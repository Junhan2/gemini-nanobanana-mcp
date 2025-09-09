# Claude Code Hooks for Auto Image Preview

> **Automatically open generated images instantly!** No more manually finding and opening files after image generation.

When you generate an image:
1. **Image saves to disk** → `~/Downloads/gemini-images/generate-2025-01-09-14-30-45.png`
2. **Hook triggers automatically** → Quick Look opens instantly (Mac) or default viewer
3. **You see the result immediately!** → Press Space to close (Mac)

---

## Quick Setup (macOS)

### Automatic Installation (Recommended)

```bash
# Clone this repository
git clone https://github.com/nanobanana/nanobanana-mcp.git
cd nanobanana-mcp

# Run the installer
bash hooks/install.sh

# Restart Claude Code
# Generate an image - it will open automatically!
```

### Manual Setup

If you prefer to set it up manually:

#### 1. Choose Configuration Location

**Option A: Global Settings (affects all Claude Code projects)**
- File: `~/.claude/settings.json`
- Affects: All projects using Claude Code

**Option B: Project Settings (affects only current project)**
- File: `.claude/settings.local.json` (in your project root)
- Affects: Only the current project

#### 2. Update Settings File

Add this to your chosen settings file:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__gemini-nanobanana-mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /absolute/path/to/nanobanana-mcp/hooks/nanobanana-image-viewer.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Important**: Replace `/absolute/path/to/nanobanana-mcp` with the actual path where you cloned this repo.

#### 3. Restart Claude Code

---

## 🌍 Cross-Platform Setup

### 🪟 Windows Setup

**1. Create PowerShell Hook Script**

Create `nanobanana-hook.ps1`:
```powershell
# Read JSON input from stdin
$input = [Console]::In.ReadToEnd() | ConvertFrom-Json

# Extract response text from the correct location
$responseText = $input.tool_response[0].text

# Extract image path using regex
if ($responseText -match "saved to:\s*([^\s]+\.(png|jpg|jpeg|gif|webp))") {
    $imagePath = $matches[1]
    
    if (Test-Path $imagePath) {
        # Open with default image viewer
        Start-Process $imagePath
        Write-Host "✅ Image opened: $(Split-Path $imagePath -Leaf)" -ForegroundColor Green
        
        # Optional: Windows 10+ toast notification
        try {
            Add-Type -AssemblyName System.Windows.Forms
            $notification = New-Object System.Windows.Forms.NotifyIcon
            $notification.Icon = [System.Drawing.SystemIcons]::Information
            $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
            $notification.BalloonTipText = "Image ready: $(Split-Path $imagePath -Leaf)"
            $notification.BalloonTipTitle = "Nanobanana MCP"
            $notification.Visible = $true
            $notification.ShowBalloonTip(3000)
            $notification.Dispose()
        } catch { }
    }
}
```

**2. Update Settings**

Add to your `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__gemini-nanobanana-mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File C:\\path\\to\\nanobanana-hook.ps1"
          }
        ]
      }
    ]
  }
}
```

### Linux Setup

**1. Create Bash Hook Script**

Create `nanobanana-hook.sh`:
```bash
#!/bin/bash
set -euo pipefail

# Read JSON input
input=$(cat)

# Extract response text (important: use tool_response[0].text!)
response_text=$(echo "$input" | jq -r '.tool_response[0].text // ""')

# Extract image path
image_path=$(echo "$response_text" | \
  grep -oE 'saved to:[[:space:]]*([^[:space:]]+\.(png|jpg|jpeg|gif|webp))' | \
  sed 's/saved to:[[:space:]]*//' | head -1)

if [ -n "$image_path" ] && [ -f "$image_path" ]; then
    # Try multiple Linux image viewers
    if command -v xdg-open &> /dev/null; then
        xdg-open "$image_path" &
    elif command -v feh &> /dev/null; then
        feh "$image_path" &
    elif command -v eog &> /dev/null; then
        eog "$image_path" &
    elif command -v display &> /dev/null; then
        display "$image_path" &
    fi
    
    echo "Image opened: $(basename "$image_path")"
    
    # Optional: Desktop notification
    if command -v notify-send &> /dev/null; then
        notify-send -i "$image_path" "Nanobanana MCP" \
          "Image ready: $(basename "$image_path")"
    fi
fi
```

**2. Make Executable & Update Settings**

```bash
chmod +x nanobanana-hook.sh
```

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__gemini-nanobanana-mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /absolute/path/to/nanobanana-hook.sh"
          }
        ]
      }
    ]
  }
}
```

---

## How It Works

### Hook Flow
1. **You generate an image** → Claude Code calls the nanobanana MCP tool
2. **MCP tool responds** → Returns JSON with tool result
3. **Hook triggers** → PostToolUse hook executes our script
4. **Script parses JSON** → Extracts image path from `tool_response[0].text`
5. **Image opens** → System image viewer shows the image

### JSON Structure
The hook receives this JSON structure:
```json
{
  "session_id": "...",
  "tool_name": "mcp__gemini-nanobanana-mcp__generate_image",
  "tool_input": {
    "prompt": "A cute cat"
  },
  "tool_response": [
    {
      "type": "text",
      "text": "Image generated and saved to: /path/to/image.png\nSize: 1.2MB\nFormat: image/png"
    }
  ]
}
```

**Key Points:**
- **Correct path**: `tool_response[0].text`  
- **Wrong path**: `tool_output` (doesn't exist)
- **Correct matcher**: `mcp__gemini-nanobanana-mcp__.*`
- **Wrong matcher**: `gemini-nanobanana-mcp` (missing mcp__ prefix)

---

## Troubleshooting

### ❌ Hook Not Executing

**Check Settings File Location:**
```bash
# Global settings
ls -la ~/.claude/settings.json

# Project settings  
ls -la .claude/settings.local.json
```

**Validate JSON Syntax:**
```bash
# Install jq if needed: brew install jq (Mac) or apt install jq (Linux)
jq empty ~/.claude/settings.json
```

### ❌ Wrong Image Opening

**Check Hook Script Path:**
- Hook scripts must use **absolute paths**
- Relative paths won't work in Claude Code hooks
- Update your settings.json with the full path

**Debug Hook Input:**
Add this to your hook script to debug:
```bash
echo "Hook input: $input" >> /tmp/hook-debug.log
echo "Extracted path: $image_path" >> /tmp/hook-debug.log
```

Then check: `tail -f /tmp/hook-debug.log`

### ❌ Permission Denied

**Make Scripts Executable:**
```bash
chmod +x /path/to/hook-script.sh
```

### ❌ Settings Conflicts

If you have both global and local settings:
- **Local settings** (`.claude/settings.local.json`) override global
- **Global settings** (`~/.claude/settings.json`) are fallback
- Use one or the other to avoid conflicts

### ❌ jq Command Not Found

**Install jq:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Windows (using chocolatey)
choco install jq
```

---

## 🔧 Advanced Configuration

### Enable Debug Mode

Add to your hook script:
```bash
# Enable debug logging
DEBUG=true
```

Or set environment variable:
```bash
export NANOBANANA_DEBUG=true
```

### Custom Image Viewers

**macOS:**
- Default: `qlmanage -p` (Quick Look)
- Alternative: `open` (default app)

**Windows:**
- Default: `Start-Process` (default app)
- Alternative: Use specific app path

**Linux:**
- Default: `xdg-open` (default app)
- Alternatives: `feh`, `eog`, `display`

---

## 📋 Supported Tools

The hook automatically detects these MCP tools:
- ✅ `mcp__gemini-nanobanana-mcp__generate_image`
- ✅ `mcp__gemini-nanobanana-mcp__edit_image`
- ✅ `mcp__gemini-nanobanana-mcp__compose_images`
- ✅ `mcp__gemini-nanobanana-mcp__style_transfer`

---

## 💡 Tips & Tricks

### Multiple Images
If your tool generates multiple images, the hook will open all of them.

### Performance
- Hooks run after tool execution, so they don't slow down image generation
- Quick Look (macOS) is very fast and efficient

### Integration
- Works with any Claude Code workspace
- Respects your system's default image viewer settings
- Can be easily customized for your workflow

---

## ❓ FAQ

**Q: Does this work with Claude Desktop?**
A: No, this only works with Claude Code. Claude Desktop doesn't support MCP hooks.

**Q: Can I disable the hook temporarily?**
A: Yes, comment out or remove the hook configuration from your settings.json file.

**Q: Will this work with other MCP image servers?**
A: No, this is specifically designed for nanobanana-mcp. You'd need to modify the matcher pattern and parsing logic for other servers.

**Q: Is this secure?**
A: Yes, the hook only reads tool output and opens image files. It doesn't execute arbitrary commands or access sensitive data.

---

**🎉 Enjoy automatic image previews with Claude Code!**

*Questions? [Open an issue](https://github.com/nanobanana/nanobanana-mcp/issues)*