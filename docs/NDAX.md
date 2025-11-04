# NDAX Provider — Integration Guide

## Overview
NDAX Canada Inc. est un exchange réglementé FINTRAC situé à Calgary (AB).  
Ce connecteur permet à iPayX Quantum de traiter des flux CAD ↔ crypto via NDAX.

## Business Account Setup
- Télécharger et compléter le formulaire officiel **"NDAX Business Account Application"**.
- Envoyer les documents à **compliance@ndax.io** avec :
  - Statuts de la société / certificat de constitution.
  - KYC de chaque signataire (photo ID + preuve d'adresse).
  - Politique AML/KYC de l'entreprise si gestion de fonds tiers.

## API Endpoints
| Function | Method | URL | Auth |
|-----------|---------|-----|------|
| Get Quote | GET | `/api/v1/public/getticker?instrument=BTC-CAD` | None |
| Get Balances | POST | `/api/v1/private/getaccountbalances` | Bearer API Key |
| Withdraw | POST | `/api/v1/private/withdraw` | Bearer API Key |

## Environment

````env
NDAX_API_KEY=""
NDAX_BASE_URL="https://api.ndax.io"
````

## Notes

* Contact: [compliance@ndax.io](mailto:compliance@ndax.io) / [invest@ndax.io](mailto:invest@ndax.io)
* FINTRAC Registration: M20059221
* Business Account required for volume ≥ 10 000 CAD.
