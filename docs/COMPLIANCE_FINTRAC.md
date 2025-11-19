# FINTRAC ECTR Compliance Documentation

## Overview

This documentation covers the FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) Electronic Cash Transaction Report (ECTR) auto-generation system integrated into iPAYX Quantum.

The system automatically generates FINTRAC-compliant XML reports for CAD payments equal to or exceeding $10,000 CAD, in accordance with Canadian AML/CTF regulations.

## Files

### Core Library
- **`lib/compliance/fintrac.ts`** - Core TypeScript/Node.js library for FINTRAC ECTR XML generation
  - Functions: `buildFintracEctrXml()`, `writeFintracFile()`, `generateAndSaveFintracEctr()`
  - No external dependencies, uses Node.js built-in modules

### API Endpoint
- **`supabase/functions/fintrac-compliance/index.ts`** - Supabase Edge Function (Deno) that provides REST API for FINTRAC compliance
  - Endpoint: `POST /fintrac-compliance`
  - Validates input, checks thresholds, generates XML
  - Returns JSON with file metadata and XML preview

### Back-office Script
- **`scripts/compliance/generate_fintrac_ectr.py`** - Python 3 command-line tool for manual ECTR generation
  - Usage: `python generate_fintrac_ectr.py --sender-id USER123 --amount 15000 --country CA`
  - Uses only Python standard library (no pip dependencies)

### Frontend Integration
- **`src/components/ChatbotWidget.tsx`** - Enhanced to call FINTRAC compliance endpoint for qualifying CAD payments

## DRY_RUN Behavior

The system supports a `DRY_RUN` mode (enabled by default) to prevent actual submission of reports during development and testing:

### Environment Variables
```bash
# Enable DRY_RUN (default)
export DRY_RUN=true

# Disable DRY_RUN (production)
export DRY_RUN=false

# Configure FINTRAC output path (optional, Supabase Edge Function only)
export FINTRAC_OUTPUT_PATH=/custom/path/fintrac
```

### XML Comment Indicator
When `DRY_RUN=true`, generated XML includes a comment:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ECTR>
  <!-- DRY_RUN — not submitted -->
  <TransactionDate>2025-11-06</TransactionDate>
  ...
</ECTR>
```

### API Response
The FINTRAC compliance endpoint returns a `dryRun` boolean in its response:
```json
{
  "generated": true,
  "dryRun": true,
  "file": { ... },
  "xmlPreview": "..."
}
```

## API

### Endpoint
```
POST https://[project-ref].supabase.co/functions/v1/fintrac-compliance
```

### Request Headers
```
Authorization: Bearer [anon-key]
Content-Type: application/json
```

### Request Body
```typescript
{
  senderId: string;        // Unique sender identifier
  amountCad: number;       // Amount in CAD
  receiverCountry: string; // ISO country code (e.g., "CA", "US")
  kyc: {
    sender_name: string;   // Full name
    address: string;       // Full address
    dob: string;          // Date of birth (YYYY-MM-DD)
  };
  force?: boolean;         // Optional: bypass threshold check
}
```

### Response (Below Threshold)
```json
{
  "generated": false,
  "reason": "below_threshold",
  "threshold": 10000,
  "amountCad": 5000,
  "message": "Amount 5000 CAD is below the FINTRAC reporting threshold of 10000 CAD"
}
```

### Response (Generated)
```json
{
  "generated": true,
  "dryRun": true,
  "file": {
    "fileName": "ectr_report_USER123_20251106180630.xml",
    "path": "/tmp/fintrac/ectr_report_USER123_20251106180630.xml",
    "sizeBytes": 342
  },
  "xmlPreview": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ECTR>\n...",
  "timestamp": "2025-11-06T18:06:30.123Z"
}
```

### Error Response
```json
{
  "error": "Missing required fields: senderId, amountCad, receiverCountry, kyc"
}
```

## Frontend Wiring

### ChatbotWidget Integration

The `ChatbotWidget.tsx` component has been enhanced to automatically check for FINTRAC compliance when processing CAD payment messages:

```typescript
// After sending a message with CAD payment info
const checkFintracCompliance = async (amount: number, currency: string) => {
  if (currency !== 'CAD' || amount < 10000) return;
  
  try {
    const { data } = await supabase.functions.invoke('fintrac-compliance', {
      body: {
        senderId: 'CHAT_USER',
        amountCad: amount,
        receiverCountry: 'CA',
        kyc: { sender_name: 'Chat User', address: 'N/A', dob: '1990-01-01' }
      }
    });
    
    if (data.generated) {
      console.log('[FINTRAC] ECTR generated →', data.file.path);
      console.log('Preview:', data.xmlPreview.split('\n').slice(0, 5).join('\n'));
    }
  } catch (error) {
    console.error('[FINTRAC] Error:', error);
  }
};
```

**⚠️ IMPORTANT - KYC Data Warning:**
The example above uses placeholder KYC data for demonstration/DRY_RUN mode only. **In production, you MUST:**
- Replace placeholder data with actual validated KYC information from the user's account
- Implement proper KYC collection flow before triggering FINTRAC compliance
- Ensure all KYC data meets FINTRAC requirements (name, address, DOB, ID verification)
- Store KYC data securely and comply with privacy regulations

### Integration Points
1. **Payment Quote Flow** - When user requests quote for CAD ≥ $10k
2. **Send Button Handler** - After successful message with payment intent
3. **Console Logging** - Logs FINTRAC generation status and preview

Example console output:
```
[FINTRAC] ECTR generated → /tmp/fintrac/ectr_report_CHAT_USER_20251106180630.xml
Preview: <?xml version="1.0" encoding="UTF-8"?>
<ECTR>
  <!-- DRY_RUN — not submitted -->
  <TransactionDate>2025-11-06</TransactionDate>
  <Amount>15000</Amount>
```

## Python Script Usage

### Basic Usage
```bash
python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id USER123 \
  --amount 15000 \
  --country CA \
  --sender-name "John Doe" \
  --address "123 Main St, Toronto, ON M5H 2N2" \
  --dob "1985-03-15"
```

### With DRY_RUN
```bash
# Explicitly enable DRY_RUN
python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id USER456 \
  --amount 25000 \
  --country US \
  --dry-run

# Or via environment variable
DRY_RUN=true python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id USER456 \
  --amount 25000 \
  --country US
```

### Force Generation Below Threshold
```bash
python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id TEST001 \
  --amount 5000 \
  --country CA \
  --force
```

### Custom Output Directory
```bash
python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id USER789 \
  --amount 20000 \
  --country CA \
  --output-dir ./compliance_reports
```

### Output Example
```
✓ FINTRAC ECTR generated successfully
  File: ectr_report_USER123_20251106180630.xml
  Path: /tmp/fintrac/ectr_report_USER123_20251106180630.xml
  Size: 342 bytes
  DRY_RUN: True

XML Preview (first 500 chars):
------------------------------------------------------------
<?xml version="1.0" encoding="UTF-8"?>
<ECTR>
  <!-- DRY_RUN — not submitted -->
  <TransactionDate>2025-11-06</TransactionDate>
  <Amount>15000</Amount>
  <SenderName>John Doe</SenderName>
  <SenderID>USER123</SenderID>
  <SenderAddress>123 Main St, Toronto, ON M5H 2N2</SenderAddress>
  <SenderDOB>1985-03-15</SenderDOB>
  <ReceiverCountry>CA</ReceiverCountry>
</ECTR>
------------------------------------------------------------
```

## Production Notes

### Security & Storage

**⚠️ IMPORTANT: This implementation uses temporary storage suitable for development and DRY_RUN testing.**

For production deployment, you MUST:

1. **Secure Storage**
   - Store ECTR XML files in encrypted S3 buckets or HashiCorp Vault
   - Enable versioning and audit logging
   - Set appropriate retention policies (7 years for FINTRAC)
   - Use signed URLs with expiration for access

2. **Secrets Management**
   - Never commit API keys or credentials
   - Use environment variables or secret managers
   - Rotate credentials regularly
   - Follow the `docs/SECRETS_AND_KEYS_POLICY.md` guide

3. **Enhanced Schema**
   - Current implementation is a minimal ECTR example
   - Production XML should include:
     - Full reporting entity details (MSB registration)
     - Complete beneficiary information
     - Transaction chain details
     - Source of funds documentation
     - Risk assessment indicators
   - Consult FINTRAC's ECTR XML schema v1.0 specification

4. **Submission Integration**
   - When `DRY_RUN=false`, integrate with FINTRAC's submission API
   - Implement retry logic with exponential backoff
   - Store submission receipts and acknowledgments
   - Monitor submission status and handle errors

5. **Compliance Workflow**
   - Add manual review step before submission
   - Implement approval workflow for high-risk transactions
   - Generate audit trail for all ECTR generations
   - Set up alerts for failed submissions

6. **Testing**
   - Use FINTRAC's test environment before production
   - Validate XML against official schema (XSD)
   - Test with various edge cases and data combinations
   - Perform regular compliance audits

### File Storage Locations

**Development/DRY_RUN:**
- Serverless (Supabase): In-memory (metadata only)
- Local: `./.tmp/fintrac/` (excluded from git)
- Unix systems: `/tmp/fintrac/`

**Production:**
- S3: `s3://compliance-reports/fintrac/ectr/YYYY/MM/DD/`
- Vault: Encrypted KV store with access controls
- Database: Metadata only (not full XML)

### Monitoring & Alerting

Set up monitoring for:
- ECTR generation failures
- Threshold breaches without reports
- DRY_RUN enabled in production (alert!)
- Storage quota usage
- API endpoint latency and errors

### Legal & Regulatory

- FINTRAC reporting deadline: 15 calendar days
- Record retention: Minimum 5 years (recommend 7)
- Privacy: Encrypt PII at rest and in transit
- Audit: Log all access to compliance data
- Updates: Monitor FINTRAC for schema updates

## Testing

### Manual API Test
```bash
# Test below threshold
curl -X POST https://[project-ref].supabase.co/functions/v1/fintrac-compliance \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "TEST001",
    "amountCad": 5000,
    "receiverCountry": "CA",
    "kyc": {
      "sender_name": "Test User",
      "address": "123 Test St",
      "dob": "1990-01-01"
    }
  }'

# Test above threshold
curl -X POST https://[project-ref].supabase.co/functions/v1/fintrac-compliance \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "TEST002",
    "amountCad": 15000,
    "receiverCountry": "US",
    "kyc": {
      "sender_name": "John Doe",
      "address": "456 Main Ave, Toronto ON",
      "dob": "1985-06-15"
    }
  }'
```

### Python Script Test
```bash
# Test with default DRY_RUN
python scripts/compliance/generate_fintrac_ectr.py \
  --sender-id TEST003 \
  --amount 12000 \
  --country CA

# Verify file created
ls -lh .tmp/fintrac/ || ls -lh /tmp/fintrac/
```

### Frontend Test
1. Open browser console
2. Send message with CAD payment ≥ $10k in ChatbotWidget
3. Check console for `[FINTRAC]` log messages
4. Verify ECTR generated log appears

## Troubleshooting

### Issue: "below_threshold" response for valid amount
- Check that `amountCad` is numeric and ≥ 10000
- Use `force: true` parameter to override
- Verify currency is CAD (not case-sensitive in some flows)

### Issue: Missing KYC fields error
- Ensure all KYC fields present: `sender_name`, `address`, `dob`
- Check date format: YYYY-MM-DD
- Validate no null/undefined values

### Issue: Files not being created
- Check directory permissions: `.tmp/fintrac/` or `/tmp/fintrac/`
- Verify disk space available
- In serverless: Files are in-memory, not persisted

### Issue: DRY_RUN not working
- Check environment variable: `echo $DRY_RUN`
- Verify case: should be "true" or "false" (lowercase)
- Restart service after changing env vars

## Support

For questions or issues:
- Review `docs/SECRETS_AND_KEYS_POLICY.md` for security guidelines
- Check Supabase Edge Functions logs for errors
- Contact compliance team for FINTRAC schema questions
- See `docs/CLIENT_INTEGRATION.md` for integration help

---

**Last Updated:** 2025-11-06  
**Schema Version:** ECTR v1.0 (simplified)  
**Compliance Standard:** FINTRAC PCMLTFA Regulations
