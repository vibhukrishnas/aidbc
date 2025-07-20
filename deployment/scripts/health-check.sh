#!/bin/bash

# Health check script for AI Debate Coach
# Can be used by monitoring systems or CI/CD pipelines

set -e

# Configuration
ENVIRONMENT=${1:-production}
TIMEOUT=30
RETRY_INTERVAL=5
MAX_RETRIES=5

# Service endpoints
declare -A ENDPOINTS=(
    ["production"]="https://debate-coach.com"
    ["staging"]="https://staging.debate-coach.com"
    ["local"]="http://localhost:3000"
)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get endpoint
ENDPOINT=${ENDPOINTS[$ENVIRONMENT]}
if [ -z "$ENDPOINT" ]; then
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    exit 1
fi

echo "Running health checks for $ENVIRONMENT environment..."
echo "Endpoint: $ENDPOINT"

# Function to check endpoint
check_endpoint() {
    local url=$1
    local expected_status=$2
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
        
        if [ "$response" == "$expected_status" ]; then
            echo -e "${GREEN}✓${NC} $url - Status: $response"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} $url - Status: $response (expected: $expected_status)"
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                echo "  Retrying in $RETRY_INTERVAL seconds... ($retry_count/$MAX_RETRIES)"
                sleep $RETRY_INTERVAL
            fi
        fi
    done
    
    echo -e "${RED}✗${NC} $url - Failed after $MAX_RETRIES retries"
    return 1
}

# Health checks
echo ""
echo "Checking services..."
echo "==================="

FAILED=0

# Check main page
check_endpoint "$ENDPOINT/" "200" || FAILED=$((FAILED + 1))

# Check API health
check_endpoint "$ENDPOINT/api/health" "200" || FAILED=$((FAILED + 1))

# Check static assets
check_endpoint "$ENDPOINT/static/css/main.css" "200" || FAILED=$((FAILED + 1))

# Check API endpoints
check_endpoint "$ENDPOINT/api/topics/en" "200" || FAILED=$((FAILED + 1))

# Performance check
echo ""
echo "Performance metrics..."
echo "===================="

# Measure response time
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$ENDPOINT/")
echo "Homepage response time: ${response_time}s"

if (( $(echo "$response_time > 3" | bc -l) )); then
    echo -e "${YELLOW}⚠${NC} Response time is slow (>3s)"
    FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "Summary"
echo "======="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}$FAILED health checks failed!${NC}"
    exit 1
fi