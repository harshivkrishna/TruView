#!/bin/bash

# CORS Test Script for Profile Photo Upload
# This script tests if CORS is properly configured for file uploads

echo "=========================================="
echo "CORS Configuration Test"
echo "=========================================="
echo ""

# Configuration
API_URL="${1:-https://api.truviews.in}"
ORIGIN="${2:-https://www.truviews.in}"

echo "Testing API: $API_URL"
echo "From Origin: $ORIGIN"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
curl -s -I "$API_URL/health" | head -n 1
echo ""

# Test 2: CORS Test Endpoint
echo "Test 2: CORS Test Endpoint"
echo "---------------------------"
curl -s "$API_URL/cors-test" \
  -H "Origin: $ORIGIN" | jq -r '.message, .origin'
echo ""

# Test 3: OPTIONS Preflight for Profile Photo Upload
echo "Test 3: OPTIONS Preflight Request"
echo "----------------------------------"
echo "Sending OPTIONS request to /api/users/profile/photo..."
RESPONSE=$(curl -s -i -X OPTIONS "$API_URL/users/profile/photo" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type")

echo "$RESPONSE" | grep -i "HTTP/"
echo ""
echo "CORS Headers:"
echo "$RESPONSE" | grep -i "access-control"
echo ""

# Test 4: Check if CORS headers are present
echo "Test 4: Verify CORS Headers"
echo "----------------------------"
if echo "$RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo "✅ Access-Control-Allow-Origin: PRESENT"
else
    echo "❌ Access-Control-Allow-Origin: MISSING"
fi

if echo "$RESPONSE" | grep -qi "access-control-allow-methods"; then
    echo "✅ Access-Control-Allow-Methods: PRESENT"
else
    echo "❌ Access-Control-Allow-Methods: MISSING"
fi

if echo "$RESPONSE" | grep -qi "access-control-allow-credentials"; then
    echo "✅ Access-Control-Allow-Credentials: PRESENT"
else
    echo "❌ Access-Control-Allow-Credentials: MISSING"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "If all tests show ✅, CORS is configured correctly."
echo "If any test shows ❌, the backend needs to be updated and restarted."
echo ""
echo "To fix CORS issues:"
echo "1. Ensure Backend/server.js has the updated CORS configuration"
echo "2. Ensure Backend/routes/users.js has the OPTIONS handler"
echo "3. Restart the backend server"
echo "4. Clear browser cache and test again"
