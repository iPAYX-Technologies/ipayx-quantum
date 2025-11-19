#!/bin/bash
# Manual test script for FINTRAC compliance edge function
# Run this after deploying to Supabase

echo "=== FINTRAC Compliance API Test ==="
echo ""

# You need to set these variables
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"

echo "Testing FINTRAC compliance endpoint..."
echo "URL: ${SUPABASE_URL}/functions/v1/fintrac-compliance"
echo ""

# Test 1: Below threshold (should not generate)
echo "Test 1: Below threshold (5,000 CAD)"
echo "----------------------------------------"
curl -X POST "${SUPABASE_URL}/functions/v1/fintrac-compliance" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
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
  }' | jq '.'
echo ""
echo ""

# Test 2: Above threshold (should generate)
echo "Test 2: Above threshold (15,000 CAD)"
echo "----------------------------------------"
curl -X POST "${SUPABASE_URL}/functions/v1/fintrac-compliance" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
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
  }' | jq '.'
echo ""
echo ""

# Test 3: Below threshold with force flag
echo "Test 3: Below threshold with force flag"
echo "----------------------------------------"
curl -X POST "${SUPABASE_URL}/functions/v1/fintrac-compliance" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "TEST003",
    "amountCad": 5000,
    "receiverCountry": "CA",
    "force": true,
    "kyc": {
      "sender_name": "Forced User",
      "address": "789 Force St",
      "dob": "1992-03-20"
    }
  }' | jq '.'
echo ""
echo ""

# Test 4: Missing KYC fields (should error)
echo "Test 4: Missing KYC fields (expect error)"
echo "----------------------------------------"
curl -X POST "${SUPABASE_URL}/functions/v1/fintrac-compliance" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "TEST004",
    "amountCad": 15000,
    "receiverCountry": "CA",
    "kyc": {
      "sender_name": "Incomplete User"
    }
  }' | jq '.'
echo ""

echo "=== Tests Complete ==="
