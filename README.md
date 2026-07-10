[![BCOS Certified](https://img.shields.io/badge/BCOS-Certified-brightgreen?style=flat)](BCOS.md)

# RustChain Improvement Proposals (RIPs)

Formal specifications for changes to the [RustChain](https://github.com/Scottcjn/Rustchain) protocol.

Browse the current proposal index with the standalone [RIP search and status filter](rip-search.html).

## Current RIP Index

This repository mirrors the standalone RIP-300 document and links to canonical RIP documents that currently live in the main [RustChain](https://github.com/Scottcjn/Rustchain) repository. Status values below are copied from the referenced RIP documents.

| RIP | Title | Status | Source |
|-----|-------|--------|--------|
| [0001](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0001-proof-of-antiquity.md) | Proof of Antiquity (PoA) Consensus Specification | Draft | RustChain canonical docs |
| [0007](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0007-entropy-fingerprinting.md) | Entropy-Based Validator Fingerprinting & Scoring | Active | RustChain canonical docs |
| [0201](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0201-fleet-immune-system.md) | Fleet Detection Immune System | Deployed | RustChain canonical docs |
| [0202](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0202-fail-closed-producer-enrollment.md) | Fail-Closed Producer Enrollment Gate | Draft | RustChain canonical docs |
| [200](https://github.com/Scottcjn/Rustchain) | Round-Robin 1-CPU-1-Vote PoA | Active | README legacy entry |
| [300](RIP-300-post-quantum-signatures.md) | Post-Quantum Signature Migration | Draft | This repository |
| [0301](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0301-tip-credits-atlas-economy.md) | Tip Credits + Atlas Land Transfer Economy | Draft / Request for Comments | RustChain canonical docs |
| [302](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-302-agent-economy.md) | Agent Economy Protocol | Active | RustChain canonical docs |
| [302-test](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-302-agent-to-agent-test-challenge.md) | Reproducible Agent-to-Agent Transaction Test Challenge | Draft | RustChain canonical docs |
| [0304](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0304-retro-console-mining.md) | Retro Console Mining via Pico Serial Bridge | Draft | RustChain canonical docs |
| [0305-A](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-solana-spl-token-deployment.md) | Solana SPL Token Deployment for wRTC Bridge | Draft | RustChain canonical docs |
| [0305-C](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-bridge-lock-ledger.md) | Bridge API + Lock Ledger | Draft | RustChain canonical docs |
| [0305-D](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0305-reward-claim-system.md) | Reward Claim System & Eligibility Flow | Draft | RustChain canonical docs |
| [0306](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0306-sophia-attestation-inspector.md) | SophiaCore Attestation Inspector | Draft | RustChain canonical docs |
| [0308](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0308-proof-of-physical-ai.md) | Proof of Physical AI (PPA) | Draft | RustChain canonical docs |
| [0310](https://github.com/Scottcjn/Rustchain/blob/main/rips/docs/RIP-0310-proof-of-provenance.md) | Proof of Provenance (PoP) | Draft | RustChain canonical docs |
| [0311](RIP-0311-scarcity-weighted-rewards.md) | Scarcity-Weighted Reward Distribution with Tenure and Identity-Cap | Draft (Request for Comments and Vote) | This repository |
| [0312](RIP-0312-sophia-verifiable-oracle.md) | SOPHIA Decoupling — Verifiable Attestation-Oracle Architecture | Draft | This repository |

## RIP-300: Post-Quantum Signature Migration

Phased migration from Ed25519 to hybrid Ed25519 + ML-DSA-44 (CRYSTALS-Dilithium2) signatures, motivated by [Google Quantum AI research](https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/) showing Ed25519 crackable with <500K physical qubits in ~9 minutes.

- **Phase 1** (Q3 2026): PQ-Ready -- dual keypair generation, RTCQ addresses, zero breaking changes
- **Phase 2** (Q1 2027): Hybrid signing -- transactions carry both Ed25519 + ML-DSA signatures
- **Phase 3** (Q1 2029): PQ enforcement -- Ed25519-only rejected after cutoff block

Reference implementation: [`rustchain_crypto_pq.py`](https://github.com/Scottcjn/Rustchain)

## License

MIT License. (c) 2026 Elyan Labs.
