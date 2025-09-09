#!/bin/bash
# Debug version of the hook script to understand Claude Code input format

# Log everything to a file for debugging
exec > /tmp/claude-hook-debug.log 2>&1

echo "=== Hook Debug Started ==="
echo "Date: $(date)"
echo "PWD: $(pwd)"
echo "User: $(whoami)"

# Read all input from stdin
echo "=== Reading stdin ==="
input=$(cat)
echo "Raw input length: ${#input}"
echo "Raw input content:"
echo "$input"
echo "=== End stdin ==="

# Try to parse as JSON
echo "=== JSON parsing test ==="
if echo "$input" | jq . >/dev/null 2>&1; then
    echo "✅ Valid JSON detected"
    echo "Parsed JSON:"
    echo "$input" | jq .
else
    echo "❌ Invalid JSON or empty input"
    echo "Trying to parse as simple text:"
    echo "$input"
fi

echo "=== Hook Debug Finished ==="
exit 0