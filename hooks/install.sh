#!/bin/bash
# Nanobanana MCP - Claude Code Hooks Installer
# Automatically configures Claude Code to show generated images with Quick Look

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🚀 Nanobanana MCP - Claude Code Hooks Installer${NC}"
echo -e "${CYAN}===================================================${NC}"
echo ""

# Get the absolute path of the current script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HOOK_SCRIPT="$SCRIPT_DIR/nanobanana-image-viewer.sh"

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}⚠️  This installer is optimized for macOS${NC}"
    echo -e "   Other platforms: see hooks/README.md for manual setup"
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found - required for JSON parsing${NC}"
    echo -e "   Install with: ${BLUE}brew install jq${NC}"
    exit 1
fi

# Check if Claude Code is available
if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}⚠️  Claude Code CLI not found${NC}"
    echo -e "   Make sure Claude Code is installed and in your PATH"
    echo -e "   You can still install manually using the instructions in hooks/README.md"
fi

# Check if hook script exists and is executable
if [ ! -f "$HOOK_SCRIPT" ]; then
    echo -e "${RED}❌ Hook script not found: $HOOK_SCRIPT${NC}"
    exit 1
fi

if [ ! -x "$HOOK_SCRIPT" ]; then
    echo -e "${YELLOW}🔧 Making hook script executable...${NC}"
    chmod +x "$HOOK_SCRIPT"
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
echo ""

# Check Claude Code configuration directory
CLAUDE_DIR="$HOME/.claude"
if [ ! -d "$CLAUDE_DIR" ]; then
    echo -e "${YELLOW}📁 Creating Claude Code directory...${NC}"
    mkdir -p "$CLAUDE_DIR"
fi

echo -e "${YELLOW}📦 Installing hooks configuration...${NC}"

# Configuration options
echo "Choose installation method:"
echo "1. Global settings (recommended - affects all Claude Code projects)"
echo "2. Project-specific settings (affects only this project)"
read -p "Enter choice (1-2): " choice

case $choice in
    1)
        # Global configuration
        CONFIG_FILE="$CLAUDE_DIR/settings.json"
        SCOPE="global"
        echo -e "${BLUE}Installing global configuration...${NC}"
        ;;
    2)
        # Project-specific configuration  
        CONFIG_FILE="$PROJECT_ROOT/.claude/settings.local.json"
        SCOPE="project"
        echo -e "${BLUE}Installing project-specific configuration...${NC}"
        
        # Create project .claude directory if needed
        if [ ! -d "$PROJECT_ROOT/.claude" ]; then
            mkdir -p "$PROJECT_ROOT/.claude"
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    backup_file="${CONFIG_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    cp "$CONFIG_FILE" "$backup_file"
    echo -e "${GREEN}✅ Backed up existing config to: $backup_file${NC}"
    
    # Check if hooks already exist
    if jq -e '.hooks.PostToolUse[]? | select(.matcher == "mcp__gemini-nanobanana-mcp__.*")' "$CONFIG_FILE" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Nanobanana hooks already configured in $CONFIG_FILE${NC}"
        read -p "Do you want to overwrite? (y/N): " overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
fi

# Create or update the hooks configuration
if [ -f "$CONFIG_FILE" ]; then
    # Merge with existing configuration
    echo -e "${YELLOW}🔄 Merging with existing configuration...${NC}"
    
    # Create a temporary file with the new hook
    temp_file=$(mktemp)
    jq --arg hook_command "bash $HOOK_SCRIPT" '
        .hooks //= {} |
        .hooks.PostToolUse //= [] |
        .hooks.PostToolUse = [
            (.hooks.PostToolUse[] | select(.matcher != "mcp__gemini-nanobanana-mcp__.*")),
            {
                "matcher": "mcp__gemini-nanobanana-mcp__.*",
                "hooks": [
                    {
                        "type": "command",
                        "command": $hook_command,
                        "timeout": 60
                    }
                ]
            }
        ]
    ' "$CONFIG_FILE" > "$temp_file"
    
    mv "$temp_file" "$CONFIG_FILE"
else
    # Create new configuration
    echo -e "${YELLOW}📝 Creating new configuration...${NC}"
    
    cat > "$CONFIG_FILE" << EOF
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__gemini-nanobanana-mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash $HOOK_SCRIPT",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
EOF
fi

echo -e "${GREEN}✅ Configuration installed: $CONFIG_FILE${NC}"

# Validate JSON
if jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Configuration is valid JSON${NC}"
else
    echo -e "${RED}❌ Configuration contains invalid JSON${NC}"
    if [ -f "${CONFIG_FILE}.backup.$(date +%Y%m%d-%H%M%S)" ]; then
        echo -e "${YELLOW}🔄 Restoring backup...${NC}"
        cp "${CONFIG_FILE}.backup.$(date +%Y%m%d-%H%M%S)" "$CONFIG_FILE"
    fi
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 What was installed:${NC}"
echo -e "   • Hook script: ${BLUE}$HOOK_SCRIPT${NC}"
echo -e "   • Configuration: ${BLUE}$CONFIG_FILE${NC}"
echo -e "   • Scope: ${BLUE}$SCOPE${NC}"
echo ""
echo -e "${CYAN}🚀 Next steps:${NC}"
echo -e "   1. ${YELLOW}Restart Claude Code${NC} if it's running"
echo -e "   2. Generate an image with nanobanana-mcp:"
echo -e "      ${BLUE}\"Generate a cute cat playing with a ball\"${NC}"
echo -e "   3. ${GREEN}Image will automatically open in Quick Look!${NC}"
echo ""
echo -e "${CYAN}💡 Usage tips:${NC}"
echo -e "   • Press ${BLUE}Space${NC} to close Quick Look"
echo -e "   • Press ${BLUE}Left/Right arrows${NC} to navigate multiple images"
echo -e "   • Enable debug: ${BLUE}export NANOBANANA_DEBUG=true${NC}"
echo ""
echo -e "${CYAN}🔧 Troubleshooting:${NC}"
if [ "$SCOPE" = "global" ]; then
    echo -e "   • Check config: ${BLUE}cat ~/.claude/settings.json${NC}"
else
    echo -e "   • Check config: ${BLUE}cat .claude/settings.local.json${NC}"
fi
echo -e "   • View hook logs: ${BLUE}tail -f /tmp/nanobanana-hook-debug.log${NC}"
echo -e "   • Documentation: ${BLUE}hooks/README.md${NC}"
echo ""
echo -e "${CYAN}❓ Need help?${NC}"
echo -e "   • Full guide: ${BLUE}hooks/README.md${NC}"
echo -e "   • Issues: ${BLUE}https://github.com/nanobanana/nanobanana-mcp/issues${NC}"
echo ""

# Show what the user should do next
echo -e "${YELLOW}⚡ Ready to test? Try this in Claude Code:${NC}"
echo -e "${BLUE}   \"Generate a beautiful sunset over mountains\"${NC}"
echo ""