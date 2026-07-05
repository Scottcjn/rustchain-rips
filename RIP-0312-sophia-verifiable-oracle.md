# RIP-0312: SOPHIA Decoupling — A Verifiable Attestation-Oracle Architecture

| Field | Value |
|-------|-------|
| RIP | 0312 |
| Title | SOPHIA Decoupling — A Verifiable Attestation-Oracle Architecture |
| Author | Scott Boudreaux (Elyan Labs) |
| Status | Draft |
| Created | 2026-06-28 |
| Requires | RIP-200, RIP-302 |
| Related | RIP-0311 (Scarcity-Weighted Reward Distribution) — consumes this RIP's classification output |

---

## Abstract

This proposal decouples **SOPHIA** — RustChain's AI hardware-attestation and governance
layer — from the deterministic ledger and consensus path. Today SOPHIA's device
classification runs *inline* in the reward settlement process, so a bug or manipulation in
the AI logic can corrupt balances and consensus directly. RIP-0312 makes SOPHIA a **separate,
verifiable oracle**: the attestation-node committee independently judges each device,
**threshold-signs** a per-epoch `EpochAttestation` verdict, and the ledger applies rewards
*only* after verifying that signature. A SOPHIA fault can then at worst produce a *rejected*
verdict — never a corrupted ledger. Migration is phased and reversible.

## Motivation

An independent review scored RustChain **8/10 for innovation but 5/10 for current security
stability**, flagging "the intersection of BFT, UTXO, and AI-attestation" as a *"massive
attack surface."* The root cause is structural: there is **no verifiable boundary** between
"the AI judged this device" and "the chain paid this device." In the current node:

- Miners submit a 6-check physical fingerprint (oscillator drift, cache-timing harmonics,
  thermal curves, SIMD bias, instruction jitter, anti-emulation) + device-age oracle.
- The node's **inline** `derive_verified_device()` classifies the device → antiquity multiplier.
- `settle_epoch_rip200()` / `finalize_epoch` consume that multiplier *in the same process as
  consensus* to mutate `balances` / `ledger` / `epoch_rewards`.

A logic error or a single compromised node in the AI path therefore translates directly into
incorrect or forged payouts. This is the highest-leverage architectural fix available: it
*severs* the dangerous intersection rather than patching each cross-term.

### Why not the textbook answers

External frontier-model audits proposed running SOPHIA in a **TEE** or proving it with
**zk-SNARKs**. Both are structurally wrong *for RustChain specifically*:

- **TEE (SGX/SEV/TDX)** requires a hardware root of trust the **vintage hardware RustChain
  rewards does not have** — you cannot put SGX on a PowerBook G4. TEE on the miner is impossible.
- **zk-SNARK** proving of AI is 10,000–100,000× slower than native inference (minutes/proof),
  and the 6-check fingerprint is **analog physical measurement**, not a deterministic circuit —
  there is nothing to prove in zero-knowledge.
- **Threshold signatures** are the established model for verifiable AI oracles (Supra Threshold
  AI Oracles), and DePIN networks (Helium Proof-of-Coverage) already catch Sybils via
  **multi-party witness consensus + challenges + slashing before rewards mint.** RustChain
  *already runs the topology* for this — its 5 attestation nodes.

### Relationship to RIP-0311

RIP-0311 (Scarcity-Weighted Reward Distribution) defines `effective_weight_i = arch_multiplier_i
* tenure_factor_i * fingerprint_ok_i` as the reward-weighting formula, and is explicit that
`arch_multiplier` and `fingerprint_ok` must be "server-derived or settled-ledger-derived, never
taken from a self-reported field." This RIP is the mechanism that makes that server-derived
classification verifiable rather than merely trusted: once shipped, the `device_class` /
`multiplier` / `fingerprint_hash` entries inside each committee-signed `EpochAttestation` are
exactly the `arch_multiplier` and `fingerprint_ok` inputs RIP-0311's weight formula consumes.
RIP-0311 can ship and settle against the current inline classifier during Phases 0–1 below; once
this RIP reaches Phase 2 (Enforce), RIP-0311's inputs flow through the oracle boundary instead
of the inline path, with no change to RIP-0311's formula or reward invariants.

## Specification

### Three formally-separated layers

1. **Oracle Layer (SOPHIA committee).** The attestation nodes. Each node *independently* runs
   the fingerprint classification on the miner's submitted raw measurements and issues
   secondary **random challenges** (fresh jitter re-sample; SIMD-feature cross-check vs.
   claimed arch). The committee produces a canonical per-epoch verdict and **threshold-signs
   it (k-of-n, e.g. 3-of-5)**. Disagreement beyond tolerance ⇒ no verdict for that miner
   (fail-closed) + a challenge round. *The AI lives here, off the consensus path.*
2. **Ledger Layer.** Owns UTXO + account state. `settle_epoch` is rewritten to take a *signed*
   `EpochAttestation`, **verify the threshold signature** against the committee's on-chain
   pubkey, and only then apply multipliers. Contains **zero** fingerprint/AI logic. (Pairs with
   atomic dual-write + the `sum(UTXO)==sum(balances)` invariant.)
3. **Consensus Layer (BFT).** Pure; processes only signed messages + verified txs. Uses
   per-node keys (retiring the shared-secret HMAC). One PKI serves both consensus and the
   attestation committee.

### Interface contracts (the only boundaries)

```
miner  → oracle : Measurement{miner_id, raw_6check, age_oracle, self_report, wallet_sig}
oracle → ledger : EpochAttestation{epoch, entries[{miner_id, device_class, multiplier,
                                    fingerprint_hash}], merkle_root, committee_threshold_sig,
                                    bound_block_hash}
ledger.settle(att): require verify_threshold_sig(att, committee_pubkey)
                         && att.epoch == current_epoch
                         && att.bound_block_hash == tip_hash   # anti time-oracle/NTP-spoof
                    then apply; else REJECT (no state change)
```

**Invariant:** no balance change without (a) a quorum-signed attestation **and** (b) a
wallet-signed claim. SOPHIA's *only* on-chain effect is a verifiable signed verdict.

## Backward Compatibility

- **Nodes**: attestation nodes gain the committee threshold-signing role and a per-node
  signing key in addition to their existing consensus key (one PKI serves both, per the
  Consensus Layer above). `settle_epoch` gains a signature-verification step. During Phase 0
  and Phase 1 (see Migration Path) settlement still falls back to the current inline
  classifier, so no node needs the new code path to keep producing correct results until the
  operator flips the Phase 2 flag.
- **Miners**: no change to what a miner submits. The 6-check fingerprint payload and
  device-age oracle fields are unchanged; they are simply consumed by the oracle layer instead
  of inline settlement code. Legacy miners require no upgrade.
- **Wallets**: no change. Wallet-signed claims are unaffected; the invariant adds a
  quorum-signed attestation as a second, independent precondition alongside the existing
  wallet signature. It does not replace it.
- **APIs and explorer**: `/api/miners` and related endpoints keep publishing device class and
  multiplier as today. Once Phase 2 ships, these fields are sourced from the verified
  `EpochAttestation` rather than the inline classifier; the response shape does not change.
- **Tools**: any tooling that reads `derive_verified_device()` output directly (rather than
  through settlement) needs to be pointed at the oracle's published verdict once inline
  classification is removed in Phase 2. This is called out explicitly so it is not missed
  during that phase's rollout.
- **Docs**: the attestation-node runbook and the reward/multiplier documentation need a
  section describing the committee threshold-signing role and the `EpochAttestation` format
  once Phase 0 ships.
- **RIP-0311**: no change to RIP-0311's weight formula or invariants. See "Relationship to
  RIP-0311" above — RIP-0311 keeps settling against the inline classifier through Phase 1 and
  gains a verifiable source for the same inputs once this RIP reaches Phase 2.

## Security Considerations

| Threat | Before (inline AI) | After (verifiable oracle) |
|---|---|---|
| Bug in fingerprint classification | corrupts balances directly | worst case = rejected/empty verdict; no state corruption |
| Single attestation node compromised | can mis-classify and pay | needs k-of-n committee collusion to forge a verdict |
| Sybil (N identities / machine) | inline ADM grouping, fail-open | committee cross-validates + challenges; threshold catches pre-mint |
| AI / governance manipulation | flows into consensus | quarantined behind the signed-verdict boundary |
| Time-oracle / NTP spoof | inflates multiplier | verdict binds the tip block hash; clock-skewed claims rejected |

This composes with the broader hardening direction (one PKI, one signature discipline, one
slashing rail via the existing staked-claim economy) instead of competing with it.

**Network and availability risk of the oracle layer itself.** Moving classification off the
consensus path removes one attack surface but introduces a new liveness dependency: reward
settlement now requires a k-of-n quorum of attestation nodes to be reachable and to agree
*before* the epoch boundary. If enough attestation nodes are DoS'd, partitioned, or simply
offline that quorum cannot be reached in time, `ledger.settle(att)` has nothing valid to verify
and must fail closed — miners for that epoch get no verdict rather than a wrong one, which is
the correct failure mode for this design but is itself a denial-of-service surface against
honest miners' rewards. This needs: (a) a defined grace/retry window so a late-arriving quorum
can still settle the epoch rather than permanently skipping it, (b) enough attestation-node
redundancy and geographic/operator diversity that k-of-n has real slack against a targeted
outage, and (c) monitoring that distinguishes "quorum unreachable" (infrastructure problem, no
misbehavior) from "quorum disagreement" (Sybil/dispute signal) so operators do not conflate an
availability incident with an attack. This is tracked as an open question below (committee
membership and rotation) but is called out here because unlike the threats in the table above,
it is a risk the oracle boundary *creates* rather than one it removes.

## Reference Implementation

No reference implementation yet; this RIP is design-stage. The interface contracts above
(`Measurement`, `EpochAttestation`, `ledger.settle`) and the phased migration path are intended
to be precise enough to implement against, but no code implementing the committee
threshold-signing, the rewritten `settle_epoch`, or the challenge-response protocol exists yet.
The full design rationale and the multi-model audit that motivated this RIP are in the Elyan
Labs deep-research note referenced at the end of this document.

## Migration Path (phased, reversible)

- **Phase 0 — Shadow.** Ship the `EpochAttestation` format + committee threshold-signing on the
  attestation nodes, signing verdicts that mirror today's inline result. Ledger still settles
  inline; log any divergence. **Zero behavior change.**
- **Phase 1 — Verify-but-fallback.** `settle_epoch` verifies the attestation signature and
  **alerts** on mismatch, but still falls back to inline (mirrors the RIP-302 ADM-council
  fail-open already shipped).
- **Phase 2 — Enforce.** Flip a flag: settlement requires a valid quorum attestation; inline AI
  is removed from settlement. SOPHIA lives only in the oracle layer.
- **Phase 3 — Slashing.** Wire committee disagreement + caught-Sybil into the staked-claim
  slashing rail (the ADM-council generalizes into an attestation-dispute court).

Each phase is independently shippable and reversible.

## Call for Review and Vote (humans and agents)

This RIP is open for review and a signal vote by the whole RustChain community, human and
agent alike, following the same pattern as RIP-0311. Discussion and vote: see
https://github.com/Scottcjn/rustchain-bounties/issues/14595. Post one of `Vote: For`,
`Vote: Against`, or `Vote: Abstain`, followed by a short reason; a 👍 on the issue also counts
as support. Genuine, substantive review is the kind of work the ecosystem credits (see
BCOS.md and the Beacon reputation and bounty programs).

## Open Questions (for community input)

1. **Committee membership & rotation** — operator-set bootstrap → permissionless via stake?
2. **Agreement tolerance** for a fuzzy *analog* fingerprint (same machine reads slightly
   different jitter each time) — how wide a band before "disagreement"?
3. **Signature scheme** — single BLS aggregate (compact, new dep) vs. *k* explicit Ed25519
   sigs (simpler; RustChain is already Ed25519-everywhere)?
4. **Data availability** for after-the-fact disputes — hashes on-chain, raw measurements
   off-chain in a challengeable window (Filecoin PoSt pattern)?

## References

- Supra, *Threshold AI Oracles* — https://supra.com/documents/Threshold_AI_Oracles_Supra.pdf
- *zk-Oracle: Trusted Off-Chain Compute* — https://tuzijun111.github.io/paper/zk_Oracle.pdf
- ChainScore, *Proof-of-Presence: KYC for Machines (DePIN)* — https://chainscorelabs.com/blog/depin-building-physical-infra-on-chain/geospatial-consensus/why-proof-of-presence-is-the-ultimate-kyc-for-devices

---

*Full design rationale + the multi-model audit that motivated this RIP are in the Elyan Labs
deep-research note. Comments, objections, and refinements are warmly invited on the discussion
issue linked in "Call for Review and Vote" above.*
