#!/bin/bash
# Updated hook script with JSON parsing

set -euo pipefail

echo "Hook executed at $(date)" > /tmp/claude-hook-test.txt
echo "Arguments: $@" >> /tmp/claude-hook-test.txt
echo "Working directory: $(pwd)" >> /tmp/claude-hook-test.txt

# Read JSON input from stdin
input=$(cat)
echo "JSON input: $input" >> /tmp/claude-hook-test.txt

# Parse JSON and extract tool output
if command -v jq &> /dev/null; then
    tool_response_text=$(echo "$input" | jq -r '.tool_response[0].text // ""')
    echo "Tool response text: $tool_response_text" >> /tmp/claude-hook-test.txt
    
    # Extract image path from tool response text
    image_path=$(echo "$tool_response_text" | grep -oE 'saved to:[[:space:]]*([^[:space:]]+\.(png|jpg|jpeg|gif|webp))' | sed 's/saved to:[[:space:]]*//' | head -1)
    echo "Extracted path: $image_path" >> /tmp/claude-hook-test.txt
    
    if [ -n "$image_path" ] && [ -f "$image_path" ]; then
        echo "Opening image: $image_path" >> /tmp/claude-hook-test.txt
        qlmanage -p "$image_path" &>/dev/null 2>&1 &
        echo "Image opened successfully" >> /tmp/claude-hook-test.txt
    else
        echo "No valid image path found or file does not exist" >> /tmp/claude-hook-test.txt
    fi
else
    echo "jq not available, cannot parse JSON" >> /tmp/claude-hook-test.txt
fi

exit 0