[![BCOS Certified](https://img.shields.io/badge/BCOS-Certified-brightgreen?style=flat)](BCOS.md)

# RustChain Improvement Proposals (RIPs)

Formal specifications for changes to the [RustChain](https://github.com/Scottcjn/Rustchain) protocol.

## Active RIPs

| RIP | Title | Status | Author |
|-----|-------|--------|--------|
| [200](https://github.com/Scottcjn/Rustchain) | Round-Robin 1-CPU-1-Vote PoA | Active | Scott Boudreaux |
| [300](RIP-300-post-quantum-signatures.md) | Post-Quantum Signature Migration | **Draft** | Scott Boudreaux |

## RIP-300: Post-Quantum Signature Migration

Phased migration from Ed25519 to hybrid Ed25519 + ML-DSA-44 (CRYSTALS-Dilithium2) signatures, motivated by [Google Quantum AI research](https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/) showing Ed25519 crackable with <500K physical qubits in ~9 minutes.

- **Phase 1** (Q3 2026): PQ-Ready -- dual keypair generation, RTCQ addresses, zero breaking changes
- **Phase 2** (Q1 2027): Hybrid signing -- transactions carry both Ed25519 + ML-DSA signatures
- **Phase 3** (Q1 2029): PQ enforcement -- Ed25519-only rejected after cutoff block

Reference implementation: [`rustchain_crypto_pq.py`](https://github.com/Scottcjn/Rustchain)

## License

MIT License. (c) 2026 Elyan Labs.