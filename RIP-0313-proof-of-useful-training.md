# RIP-0313: Proof of Useful Training — Training Contribution as Attested Work

| Field | Value |
|-------|-------|
| RIP | 0313 |
| Title | Proof of Useful Training — Training Contribution as Attested Work |
| Author | Scott Boudreaux |
| Status | Draft |
| Created | 2026-07-14 |
| Requires | RIP-0001 (Proof of Antiquity), RIP-0007 (Entropy Fingerprinting), RIP-0201 (Fleet Immune System), RIP-0311 (Scarcity-Weighted Rewards) |

---

## Abstract

RustChain already solves two hard problems: proving that a participant is real physical
hardware (not a VM farm), and settling small token payments to that hardware's owner. This
proposal points that machinery at a third problem: who pays for, and who owns,
community-trained models.

Proof of Useful Training (PoUT) adds a job registry, a work-unit assignment protocol, and a
verification pipeline so that attested miners can earn RTC by completing machine-learning
training work — distillation runs, fine-tune shards, dataset generation, and evaluation
passes — instead of, or in addition to, idle attestation. Rewards come from per-job escrow
funded by whoever posts the job, not from epoch emission, so this proposal changes no
tokenomics. The thesis: the same attestation that proves a miner is real hardware can prove
a training contribution came from real hardware, and the same settlement rail that pays
bounties can pay for gradient work. Decentralized training does not need a new network. It
needs an incentive layer bolted onto one that already exists.

## Motivation

The power analysis is simple. Pretraining a frontier model costs tens of millions of
dollars and stays with large corporations. But the base models keep being released as open
weights, and the layer that actually differentiates — distillation, fine-tuning,
specialization, evaluation — runs on consumer and decommissioned datacenter hardware.
That layer is where "training owned by the people" is actually achievable, and it is
achievable today.

What is missing is not compute. Idle GPUs and high-RAM machines are abundant; this lab
alone runs a POWER8 with 512 GB of RAM and a dozen GPUs bought at 60-85% off retail as
datacenter castoffs. What is missing is the incentive and trust layer:

1. Why would strangers contribute GPU-hours to a community model? (No payment rail.)
2. How do you know a contribution is real work and not garbage or poison? (No verification.)
3. How do you stop one actor with a thousand cloud VMs from farming the rewards or
   poisoning the run? (No Sybil resistance.)

RustChain already has answers to (1) and (3): RTC settlement with Ed25519-signed transfers,
and hardware fingerprinting that prices a VM at a billionth of real hardware. This RIP
specifies (2) and the protocol that ties the three together.

Distributed volunteer pretraining has an existence proof (Prime Intellect's INTELLECT-1,
a 10B model trained across internet-connected volunteer nodes in 2024). What those efforts
lack is exactly what a chain provides: durable identity for contributors, verifiable
work records, and automatic payment. Conversely, what this chain lacks is a reason for
useful hardware to join beyond antiquity novelty. The two problems are each other's
solutions.

## Specification

### Roles

- **Job poster**: any wallet. Escrows RTC for a training job and publishes the job spec.
- **Worker**: any miner with a valid, current hardware attestation (RIP-0001/0007) whose
  fingerprint verdict is REAL. VMs and SOFT_SUSPECT hardware are not assignable workers.
- **Verifier**: a node role that scores submitted work units. Verification is deterministic
  given the job spec and submissions, so any node can recompute a verifier's decision.
- **Coordinator**: the node service that assigns work units, tracks redundancy, and
  triggers settlement. Runs alongside the existing attestation endpoints.

### Job classes (scoped honestly)

PoUT explicitly does NOT attempt frontier-scale pretraining. Supported job classes, in
order of rollout:

1. **EVAL** — run a fixed evaluation set through a published model checkpoint; report
   per-item outputs and aggregate metrics. Cheapest to verify; ships first.
2. **DATAGEN** — teacher-model dataset generation: run a published prompt template over a
   seed corpus shard and return structured input→output training rows. Verified by schema
   (grammar-constrained output), spot recomputation, and near-duplicate rejection.
3. **TUNE** — a LoRA/QLoRA fine-tune shard: train an adapter on an assigned dataset shard
   from a fixed base checkpoint with fixed hyperparameters and seed; return adapter weights
   plus training log. The flagship class.
4. **DISTILL** — a composed pipeline of DATAGEN + TUNE toward a named student model.

Each job spec pins: base model hash, dataset shard hash (content-addressed), hyperparameters,
seed, tokenizer hash, maximum wall-clock, output schema, redundancy factor `k`, escrow
amount, and per-work-unit price.

### Assignment

- Work units are assigned only to workers holding a fresh attestation (within
  ATTESTATION_TTL) with fingerprint verdict REAL.
- Each work unit is assigned to `k` independent workers (default k=2 for TUNE, k=1 with
  audit for EVAL/DATAGEN). Assignment avoids co-assigning identities that share a
  hardware-binding cluster or IP/MAC evidence (reusing RIP-0201's dedupe machinery), so a
  single operator cannot self-agree.
- A worker binds each submission to its hardware identity: the submission hash is signed by
  the worker's key and includes the current attestation nonce. A result cannot be replayed
  or resold across identities.

### Verification (the hard part, stated plainly)

Bitwise reproducibility across a heterogeneous fleet (x86, POWER, ARM, mixed GPU) is not
achievable for floating-point training and is not attempted. Verification is layered:

1. **Schema gate** — the submission parses against the job's declared output schema.
   Grammar-constrained generation is recommended on the worker side so this gate approaches
   zero rejects. Free.
2. **Redundant agreement (TUNE)** — the `k` adapters are compared not bitwise but
   behaviorally: each is applied to the base model and scored on a held-out eval slice that
   was NOT distributed with the job (the verifier holds it back). Submissions must land
   within a tolerance band of each other AND must improve held-out loss versus the base
   model by at least the job's declared minimum delta. Agreement within tolerance → both
   paid. Divergence → escalate to audit.
3. **Spot audit (all classes)** — the verifier recomputes a randomly selected micro-batch
   (TUNE) or a random sample of rows (DATAGEN/EVAL) and checks the worker's training log or
   outputs against its own within tolerance. Audit probability is public; audit selection
   is not predictable in advance (seeded from the settled epoch hash after submission).
4. **Eval-delta gate (DISTILL/TUNE)** — the final composed artifact must beat the base
   checkpoint on the held-out set. Work that "completes" without improving the student
   pays nothing regardless of effort. Escrow for failed units returns to the poster.

A worker caught submitting fabricated work (audit mismatch beyond tolerance, or
copy-detection between supposedly independent redundant submissions) is flagged through the
fleet immune system (RIP-0201): its identity loses REAL status pending re-attestation, any
posted bond (RIP-0311 identity bond) is slashed toward the audit pool, and prior unsettled
work units are voided.

### Settlement

- Payment is per verified work unit at the job's posted price, from the job's escrow.
  Settlement reuses the existing pending-transfer + Ed25519 signed-transfer rails.
- Training work does NOT receive antiquity multipliers. Antiquity weights consensus
  attestation, where scarcity is the point. Useful work is paid at the market price the
  poster set — a G4 and an H100 earn the same RTC for the same verified unit, which means
  in practice each class of hardware self-selects into job classes it can complete inside
  the wall-clock. (A G4 will never take a TUNE job; it can take EVAL and DATAGEN jobs
  sized for it. High-RAM CPU boxes are first-class citizens for large-model EVAL.)
- Verifier nodes earn a fixed percentage fee (default 2%) of each settled unit, from
  escrow, for the recompute cost of audits.
- Escrow not consumed within the job's deadline returns to the poster automatically.

### Model ownership and provenance

Every settled job writes a provenance record to the chain: job spec hash, contributor
identities and unit counts, verifier decisions, and the content hash of the final artifact.
The artifact itself lives off-chain (content-addressed storage; the chain stores hashes).
The result is a model whose training history is a public, signed ledger: who contributed,
what hardware, what data shards, what price. That record is the "owned by the people"
claim made checkable — and it composes with agent identity (Beacon) so an agent can prove
which community-trained model it runs.

### What this proposal does NOT do

- No change to epoch emission, supply, or the mining reward split. PoUT is escrow-funded.
- No frontier pretraining claims. Job classes are sized to consumer and decomm hardware.
- No gradient-compression or bandwidth-reduction research. Jobs are sized so that
  submissions are adapters, rows, or metrics — megabytes, not terabytes.
- No private/proprietary datasets in v1. All v1 job data must be public and
  content-addressed, because verifiers must be able to fetch shards to audit.

## Backward Compatibility

- New endpoints (`/jobs/*`, `/work/*`) and three new tables (job registry, work units,
  provenance records). No existing endpoint changes semantics.
- Miners that ignore PoUT are unaffected; attestation and epoch rewards continue unchanged.
- Wallet impact: job escrow is a new transfer type but uses the existing signed-transfer
  format. Explorer should learn to render provenance records (documentation impact).
- RIP-0311 interaction: PoUT earnings are orthogonal to epoch-reward weight. Completing
  training work does not raise attestation weight, and tenure_factor does not gate work
  assignment (fingerprint REAL does).

## Security Considerations

- **Trust boundaries**: job posters trust the verification pipeline, not individual
  workers. Workers trust escrow (funds are locked on-chain before assignment). Verifiers
  are trusted for audit honesty in v1 — this is the largest open trust assumption; see
  Open Questions.
- **Authentication and authorization**: work submission requires the worker's Ed25519
  signature over the submission hash plus a fresh attestation nonce. Job posting requires
  a signed escrow transfer. No admin-key paths are added.
- **Consensus and settlement safety**: PoUT settlement is escrow-scoped; a disagreement
  between nodes about a work unit cannot mint tokens or affect epoch settlement. Provenance
  records are append-only. Verifier decisions embed the inputs needed for any node to
  recompute them.
- **Poisoning**: a malicious TUNE submission (backdoored adapter) is the sharpest attack.
  Mitigations: held-out eval-delta gate, redundant agreement across operators that the
  assignment layer forces to be hardware-distinct, spot audits, and — for DISTILL jobs —
  a final gate where the composed student must pass the job's full eval suite before the
  last tranche of escrow settles. This reduces but does not eliminate poisoning risk;
  v1 job posters are advised to treat community artifacts as candidates, not releases.
- **Sybil/farming**: assignment requires fingerprint REAL, so the existing anti-VM
  economics apply — a thousand cloud VMs earn nothing. Redundancy assignment excludes
  hardware-cluster siblings, so self-agreement requires genuinely distinct physical
  machines, which is exactly the cost PoA already imposes.
- **Free-riding/replay**: submissions are bound to identity + attestation nonce; a copied
  result fails copy-detection under redundancy comparison (adapters from independent seeds
  land in the tolerance band but are never near-identical; near-identical submissions from
  "independent" workers are themselves evidence of collusion and route to audit).
- **Network and availability**: job and submission payloads are size-capped by class;
  shard fetches are content-addressed so nodes can mirror them. Audit recompute cost is
  bounded by the audit rate and paid by the verifier fee.
- **Data exposure**: v1 restricts jobs to public datasets, so no private data crosses the
  network. Worker hardware metadata exposed in provenance records is the same class of
  data already exposed by attestation.
- **Mitigations and tests**: rollout gates below; regression tests must cover escrow
  return on deadline, slash-on-audit-failure, cluster-aware assignment, and the
  determinism of verifier decisions across node versions.

## Rollout

1. **Phase 0** — EVAL jobs only, single verifier (the primary node), k=1 with 10% audit.
   Proves the escrow/assign/settle loop with the cheapest verification.
2. **Phase 1** — DATAGEN with schema gates and duplicate rejection. First real artifact:
   a community teacher-distillation dataset with on-chain provenance.
3. **Phase 2** — TUNE with k=2 redundancy and held-out eval gating. First community
   adapter with a signed training ledger.
4. **Phase 3** — DISTILL composition, multi-verifier decisions, verifier-set rotation.

## Reference Implementation

None yet. Phase 0 is implementable against the current node
(`rustchain_v2_integrated_v2.2.1_rip200.py`) as a new module reusing
`miner_attest_recent`, the hardware-binding tables, and the pending-transfer rail.
The distillation job format can be derived from the working teacher→student pipeline
already run in this lab (teacher-generated rows, QLoRA student on a single consumer GPU).

## Open Questions

1. **Who verifies the verifiers?** v1 trusts node-operated verifiers. Options for later:
   verifier bonds with challenge windows, rotating verifier sets selected by epoch hash,
   or requiring verifier decisions to carry recompute transcripts any node can check.
2. **Tolerance calibration.** The behavioral-agreement band for TUNE redundancy must be
   wide enough for cross-architecture float drift and tight enough to catch lazy or
   poisoned work. Needs empirical calibration per job class before Phase 2.
3. **Shard hosting.** Content-addressed storage for datasets and artifacts: IPFS, plain
   HTTP mirrors with hash checks, or node-hosted. Phase 0 can use node-hosted.
4. **Job pricing discovery.** Posted prices in v1; a bid/ask market is deliberately out
   of scope until there is real demand.
5. **Licensing of community artifacts.** Provenance says who trained it; it does not say
   what license it carries. Job specs should probably require a declared artifact license
   (default suggestion: AGPL-3.0 for original community models, matching lab practice).

## Provenance Note

This proposal was crystallized in an open discussion on 2026-07-14 with Andy301 (Discord),
whose framing — "model training needs to be owned by the people somehow, but it costs too
much to train; if you can solve that then the power shifts" — is the motivation section in
one sentence. The mechanism (attestation-verified work, escrow settlement, provenance
ledger) extends existing RustChain machinery. Published as a draft to establish the idea
in the open per project practice.
