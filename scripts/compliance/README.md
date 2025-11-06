# FINTRAC Compliance Scripts

This directory contains scripts for FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) compliance reporting.

## Scripts

### generate_fintrac_ectr.py
Python 3 CLI tool for generating FINTRAC Electronic Cash Transaction Report (ECTR) XML files.

**Requirements:** Python 3.6+ (uses standard library only)

**Basic Usage:**
```bash
python generate_fintrac_ectr.py \
  --sender-id USER123 \
  --amount 15000 \
  --country CA
```

**Full Options:**
```bash
python generate_fintrac_ectr.py \
  --sender-id USER123 \
  --amount 15000 \
  --country CA \
  --sender-name "John Doe" \
  --address "123 Main St, Toronto, ON M5H 2N2" \
  --dob "1985-03-15" \
  --dry-run \
  --output-dir ./my-reports
```

**Flags:**
- `--sender-id`: Required. Unique identifier for sender
- `--amount`: Required. Amount in CAD
- `--country`: Required. ISO country code (e.g., CA, US)
- `--sender-name`: Optional. Full name (default: "John Doe")
- `--address`: Optional. Full address (default: "123 Main St, Toronto, ON")
- `--dob`: Optional. Date of birth YYYY-MM-DD (default: "1990-01-01")
- `--output-dir`: Optional. Output directory (default: /tmp/fintrac or ./.tmp/fintrac)
- `--dry-run`: Optional. Add DRY_RUN comment to XML
- `--force`: Optional. Generate even if below $10,000 threshold

**Examples:**
```bash
# Standard report for $15k CAD transaction
python generate_fintrac_ectr.py --sender-id ABC123 --amount 15000 --country CA

# Force generation for testing with lower amount
python generate_fintrac_ectr.py --sender-id TEST001 --amount 5000 --country CA --force

# Custom output directory
python generate_fintrac_ectr.py --sender-id XYZ789 --amount 25000 --country US --output-dir ./reports

# Production mode (no DRY_RUN comment)
DRY_RUN=false python generate_fintrac_ectr.py --sender-id PROD001 --amount 20000 --country CA
```

### test_fintrac_api.sh
Bash script for manually testing the FINTRAC Supabase Edge Function API endpoint.

**Requirements:** curl, jq (optional for pretty printing)

**Setup:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
```

**Usage:**
```bash
./test_fintrac_api.sh
```

This will run 4 test cases:
1. Below threshold (expect: below_threshold response)
2. Above threshold (expect: generated=true with XML preview)
3. Below threshold with force flag (expect: generated=true)
4. Missing KYC fields (expect: error)

## File Outputs

Generated XML files are saved to:
- **Serverless/Edge Functions:** Metadata only (in-memory)
- **Local Development:** `./.tmp/fintrac/` or `/tmp/fintrac/`
- **Production:** Should be configured to use S3/Vault (see docs/COMPLIANCE_FINTRAC.md)

Files are named: `ectr_report_{senderId}_{timestamp}.xml`

Example: `ectr_report_USER123_20251106181441.xml`

## DRY_RUN Mode

Both scripts respect the `DRY_RUN` environment variable:

```bash
# Enable DRY_RUN (default)
export DRY_RUN=true

# Disable for production
export DRY_RUN=false
```

When enabled, XML files include a comment: `<!-- DRY_RUN — not submitted -->`

## Threshold

FINTRAC reporting threshold: **$10,000 CAD**

- Transactions ≥ $10,000 CAD: Generate ECTR automatically
- Transactions < $10,000 CAD: Require `--force` flag or `force: true` in API

## See Also

- **Full Documentation:** `docs/COMPLIANCE_FINTRAC.md`
- **API Endpoint:** `supabase/functions/fintrac-compliance/index.ts`
- **Core Library:** `lib/compliance/fintrac.ts`
- **Frontend Integration:** `src/components/ChatbotWidget.tsx`

## Support

For questions:
- Review `docs/COMPLIANCE_FINTRAC.md`
- Check `docs/SECRETS_AND_KEYS_POLICY.md` for security
- Contact compliance team for regulatory questions
