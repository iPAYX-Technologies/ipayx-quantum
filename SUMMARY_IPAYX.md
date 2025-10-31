# iPAYX Meta-Route — Architecture globale

## 1. But du projet
iPAYX Meta-Route est le moteur de routage intelligent du protocole **iPAYX V4**, gérant les transferts inter-blockchains (multi-rail, multi-stablecoin).

---

## 2. Stack technique
- **Frontend :** React / Next.js + Tailwind + TypeScript + Supabase
- **Backend :** Supabase Edge Functions + FastAPI (Python agents)
- **Middleware :** 402 Payment Required (B2B)
- **Oracles :** Chainlink + Pyth + Messari + TokenTerminal
- **AI Layer :** Eliza Agent Framework (GPT-5 / Claude / Gemini)
- **Quantum Ready :** IBM Qiskit · PennyLane · NVIDIA NeMo

---

## 3. Intégrations blockchain
| Réseau | Type | Utilisation |
|--------|------|--------------|
| **Tron USDT** | Main Rail | Paiements institutionnels |
| **Ethereum / Polygon / Arbitrum** | EVM | CCTP Circle + LayerZero |
| **Hedera HBAR/USDC** | Institutionnel | Stablecoin + Tokenization |
| **Stellar XLM** | Off-Ramp Fiat | Corridors retail |
| **Sei EVM** | L2 Ultra-rapide | Retail on-ramp |
| **LayerZero / Hyperlane** | Cross-Chain | Bridge Tron ↔ EVM ↔ Hedera |
| **Wormhole** | Backup | Non critique |

---

## 4. Wallets et API
- **MetaMask + Tron Snap** (EVM + TRC-20)
- **Circle CCTP** · **Coinbase Wallet**
- **Fireblocks / Custodian MPC** *(préparation)*
- **FINTRAC MSB** (Canada)

---

## 5. Agents IA
**Eliza AI Agent :**
- Surveillance Tx multi-chain  
- Analyse frais / liquidité / risque  
- Orchestration cross-rail  

---

## 6. Routes de paiements
- Circle CCTP → LayerZero → Stellar Off-Ramp  
- Tron USDT → Hyperlane → Sei EVM  
- Hedera ↔ EVM ↔ Tron via Eliza Agent

---

## 7. Compliance / Sécurité
- FINTRAC MSB ✔️  
- Anti-fraude AI  
- Journalisation on-chain + Hashicorp Vault  

---

## 8. Roadmap
**Phase 1** : EVM + Sei (Testnets)  
**Phase 2** : Hedera + Tron (mainnets)  
**Phase 3** : Eliza Quantum Agents + Analytics AI

