#!/bin/bash
# Nanobanana MCP - Claude Code PostToolUse Hook
# Automatically opens generated images with Quick Look (macOS)
# 
# This hook follows the official Claude Code hooks guide:
# - Reads JSON input from stdin
# - Uses jq for JSON parsing
# - Targets gemini-nanobanana-mcp tools specifically

set -euo pipefail

# Debug mode (set NANOBANANA_DEBUG=true to enable)
DEBUG="${NANOBANANA_DEBUG:-true}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Debug logging function
debug_log() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1" >&2
        echo "[DEBUG] $1" >> /tmp/nanobanana-hook-debug.log
    fi
}

# Read JSON input from stdin (Claude Code hooks standard)
input=$(cat)

debug_log "=== NANOBANANA HOOK STARTED ==="
debug_log "Full JSON input: $input"

# Parse JSON input using jq
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required for JSON parsing" >&2
    exit 1
fi

# Extract tool information from JSON input
tool_name=$(echo "$input" | jq -r '.tool_name // ""')
tool_response_text=$(echo "$input" | jq -r '.tool_response[0].text // ""')
tool_input=$(echo "$input" | jq -r '.tool_input // ""')

debug_log "Tool name: $tool_name"
debug_log "Tool input: $tool_input"
debug_log "Tool response text: $tool_response_text"
debug_log "Response text length: ${#tool_response_text}"

# Check if this is a nanobanana-mcp image generation tool
if [[ "$tool_name" =~ "gemini-nanobanana-mcp" ]]; then
    debug_log "✅ Detected nanobanana-mcp tool"
    
    # Check if it's an image generation tool
    if [[ "$tool_name" =~ (generate_image|edit_image|compose_images|style_transfer) ]]; then
        debug_log "✅ Detected image generation tool"
        
        # Extract image paths from tool response text using multiple patterns
        image_paths=""
        
        # Pattern 1: "Image generated and saved to: /path/to/image.png"
        pattern1=$(echo "$tool_response_text" | grep -oE 'Image.*saved to:[[:space:]]*([^[:space:]]+\.(png|jpg|jpeg|gif|webp))' | sed 's/.*saved to:[[:space:]]*//' || true)
        debug_log "Pattern 1 result: $pattern1"
        
        # Pattern 2: "saved to: /path/to/image.png"  
        pattern2=$(echo "$tool_response_text" | grep -oE 'saved to:[[:space:]]*([^[:space:]]+\.(png|jpg|jpeg|gif|webp))' | sed 's/saved to:[[:space:]]*//' || true)
        debug_log "Pattern 2 result: $pattern2"
        
        # Pattern 3: Auto-generated timestamp filenames
        pattern3=$(echo "$tool_response_text" | grep -oE '\/[^[:space:]]+\/(generate|edit|compose|style)-[0-9]{4}-[0-9]{2}-[0-9]{2}.*\.(png|jpg|jpeg|gif|webp)' || true)
        debug_log "Pattern 3 result: $pattern3"
        
        # Combine all patterns
        image_paths=$(printf "%s\n%s\n%s\n" "$pattern1" "$pattern2" "$pattern3" | grep -v '^$' | sort -u)
        
        debug_log "Found image paths: $image_paths"
        
        if [ -n "$image_paths" ]; then
            success_count=0
            
            # Process each image path
            while IFS= read -r image_path; do
                if [ -n "$image_path" ]; then
                    # Expand tilde to home directory
                    image_path="${image_path/#\~/$HOME}"
                    
                    debug_log "Processing: $image_path"
                    
                    # Check if file exists
                    if [ -f "$image_path" ]; then
                        debug_log "File exists, opening with Quick Look"
                        
                        # Open with Quick Look (macOS specific)
                        if command -v qlmanage &> /dev/null; then
                            qlmanage -p "$image_path" &>/dev/null 2>&1 &
                            echo -e "${GREEN}🖼️${NC}  Opened with Quick Look: ${BLUE}$(basename "$image_path")${NC}"
                            ((success_count++))
                            
                            # Send macOS notification (optional)
                            if command -v osascript &> /dev/null; then
                                osascript -e "display notification \"$(basename "$image_path")\" with title \"Nanobanana MCP\" subtitle \"Image ready! Press Space to close.\"" 2>/dev/null || true
                            fi
                        else
                            # Fallback for systems without Quick Look
                            if command -v open &> /dev/null; then
                                open "$image_path"
                                echo -e "${GREEN}📱${NC}  Opened with default viewer: ${BLUE}$(basename "$image_path")${NC}"
                                ((success_count++))
                            fi
                        fi
                    else
                        debug_log "File not found: $image_path"
                    fi
                fi
            done <<< "$image_paths"
            
            # Summary
            if [ $success_count -gt 0 ]; then
                if [ $success_count -eq 1 ]; then
                    echo -e "${GREEN}✅${NC} Successfully opened 1 image"
                else
                    echo -e "${GREEN}✅${NC} Successfully opened $success_count images"
                fi
            fi
        else
            debug_log "No image paths found in output"
        fi
    else
        debug_log "Not an image generation tool, skipping"
    fi
else
    debug_log "Not a nanobanana-mcp tool, skipping"
fi

debug_log "Hook execution completed"