# 🎨 Gemini Nanobanana MCP

[![npm version](https://badge.fury.io/js/gemini-nanobanana-mcp.svg)](https://www.npmjs.com/package/gemini-nanobanana-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)

> **Generate images from text with Claude!** Simply type "Draw a cute cat" and get instant AI-generated images ✨

A beginner-friendly Model Context Protocol (MCP) server that brings Google's Gemini 2.5 Flash Image generation directly into your Claude conversations.

## 🚀 Quick Start - Just 3 Steps!

### 1️⃣ Get Your API Key (1 minute)
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API key" → Copy the key

### 2️⃣ Install in Your Claude Client (2 minutes)

<details>
<summary><b>🖥️ Claude Desktop (Windows)</b></summary>

1. Open **Notepad**
2. Copy this code and replace `YOUR_API_KEY` with your actual key:
```json
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```
3. Save as: `%APPDATA%/Claude/claude_desktop_config.json`
4. **Restart Claude Desktop**

</details>

<details>
<summary><b>🍎 Claude Desktop (Mac)</b></summary>

1. Open **Terminal** (search "Terminal" in Spotlight)
2. Run this command (replace `YOUR_API_KEY`):
```bash
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
EOF
```
3. **Restart Claude Desktop**

</details>

<details>
<summary><b>⚡ Claude Code (Easiest!)</b></summary>

Just run this one command in your terminal (replace `YOUR_API_KEY`):
```bash
claude mcp add gemini-nanobanana-mcp -s user -e GEMINI_API_KEY="YOUR_API_KEY" -- npx -y gemini-nanobanana-mcp@latest
```

</details>

<details>
<summary><b>🎯 Cursor</b></summary>

1. Go to `Cursor Settings` → `MCP` → `Add new MCP Server`
2. Fill in:
   - **Name**: `gemini-nanobanana-mcp`
   - **Command**: `npx`
   - **Args**: `gemini-nanobanana-mcp@latest`
   - **Environment Variables**: `GEMINI_API_KEY` = `YOUR_API_KEY`
3. **Restart Cursor**

</details>

### 3️⃣ Start Creating! (0 minutes)

Try these in Claude:
- ✨ "Generate a cute puppy playing in a garden"
- 🌅 "Create a beautiful sunset over mountains"
- 🚗 "Draw a red sports car"
- 🎨 "Make an abstract colorful painting"

**Your images automatically save to** `~/Downloads/gemini-images/` 📁

---

## 🎬 See It In Action

### Basic Usage
```
You: Generate a cozy coffee shop interior
Claude: [Generating image...]
✅ Image generated and saved to: ~/Downloads/gemini-images/generate-2025-01-09-14-30-45.png
📏 Size: 1.2MB | 📄 Format: PNG
```

### Custom Save Location
```
You: Create a sunset landscape and save it as ./my-sunset.png
Claude: ✅ Image saved to: ./my-sunset.png
```

---

## 🛠️ What You Can Do

### 🎨 Text-to-Image Generation
Create any image you can imagine from a text description.

**Examples:**
- `"A majestic dragon flying over a medieval castle"`
- `"Modern minimalist living room with plants"`
- `"Vintage bicycle on a cobblestone street"`

### ✏️ Image Editing
Edit existing images with natural language instructions.

**How to use:**
- Upload an image to Claude
- Say: `"Make this image black and white"`
- Or: `"Add a sunset background to this photo"`

### 🔄 Image Composition
Combine multiple images into one creative composition.

**How to use:**
- Upload 2-10 images to Claude
- Say: `"Combine these images into a collage"`
- Or: `"Blend these photos together artistically"`

### 🎭 Style Transfer
Apply the artistic style of one image to another.

**How to use:**
- Upload two images: a content image and a style reference
- Say: `"Apply the style of the second image to the first"`

---

## 🔧 Configuration Options

<details>
<summary><b>Environment Variables</b></summary>

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | *Required* | Your Google AI Studio API key |
| `AUTO_SAVE` | `true` | Automatically save images when no path specified |
| `DEFAULT_SAVE_DIR` | `~/Downloads/gemini-images` | Default directory for saved images |
| `LOG_LEVEL` | `info` | Logging level (`error`, `warn`, `info`, `debug`) |

**Example with custom settings:**
```json
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "your-api-key",
        "AUTO_SAVE": "true",
        "DEFAULT_SAVE_DIR": "~/Pictures/AI-Images",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Disable Auto-Save</b></summary>

To only save when you explicitly request it:
```json
{
  "env": {
    "GEMINI_API_KEY": "your-api-key",
    "AUTO_SAVE": "false"
  }
}
```

Then images will only appear in the chat without saving to disk.

</details>

---

## 🖼️ Instant Image Preview (Claude Code)

**Want images to open automatically after generation?** Set up Claude Code hooks for instant Quick Look previews!

### 🚀 One-Click Setup (Mac)
```bash
# Clone this repo and run the installer
git clone https://github.com/nanobanana/nanobanana-mcp.git
cd nanobanana-mcp
bash hooks/install.sh
```

### ✨ What You Get
- ✅ **Instant Preview**: Generated images open automatically in Quick Look
- ✅ **Zero Manual Work**: No more finding and opening files
- ✅ **Smart Detection**: Only triggers for nanobanana image tools
- ✅ **Press Space to Close**: Standard Quick Look controls

📖 **Full setup guide**: [hooks/README.md](hooks/README.md)

---

## ❓ Troubleshooting

<details>
<summary><b>❌ "GEMINI_API_KEY not set" error</b></summary>

**Solution:**
1. Double-check you replaced `YOUR_API_KEY` with your actual API key
2. Make sure there are no extra spaces around the key
3. Restart your Claude client completely
4. Verify your API key works at [Google AI Studio](https://aistudio.google.com/)

</details>

<details>
<summary><b>🔍 "No such file or directory" error</b></summary>

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/) (choose LTS version)
2. Restart your terminal/Claude client
3. Try the installation again

</details>

<details>
<summary><b>📷 Images not generating</b></summary>

**Checklist:**
- ✅ API key correctly set?
- ✅ Internet connection working?
- ✅ Restart Claude after configuration?
- ✅ Try a simple prompt: "Generate a blue circle"

</details>

<details>
<summary><b>💾 Images not saving automatically</b></summary>

**Solution:**
Check your configuration has `AUTO_SAVE: "true"` (default behavior). 
If you want to disable auto-save, set it to `"false"`.

</details>

<details>
<summary><b>🔧 Hook setup not working</b></summary>

**Common fixes:**
1. Make sure you're using Claude Code (not Claude Desktop)
2. Run the installer from the nanobanana-mcp directory
3. Restart Claude Code after installation
4. Check [hooks/README.md](hooks/README.md) for detailed troubleshooting

</details>

---

## 🎯 Tips for Better Images

### 🎨 Prompt Writing Tips
- **Be specific**: "A golden retriever puppy" vs "A dog"
- **Include style**: "in watercolor style", "photorealistic", "cartoon style"
- **Add details**: "with blue eyes", "in a sunny garden", "wearing a red collar"
- **Set the mood**: "cozy", "dramatic", "peaceful", "energetic"

### 📐 Technical Details
- **Supported formats**: PNG, JPEG, WebP, GIF
- **Default output**: PNG format
- **Image size**: Optimized for quality and reasonable file size
- **Rate limits**: Managed automatically with retry logic

---

## 🚀 Advanced Features

<details>
<summary><b>🔗 HTTP Mode (for integrations)</b></summary>

Run as an HTTP server instead of stdio:
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=8080 npx gemini-nanobanana-mcp@latest
```

Access at `http://localhost:8080/mcp`

</details>

<details>
<summary><b>📊 Debug Logging</b></summary>

Enable detailed logging:
```json
{
  "env": {
    "GEMINI_API_KEY": "your-key",
    "LOG_LEVEL": "debug"
  }
}
```

</details>

---

## 💡 Need Help?

- 📖 **Quick Setup Guide**: [QUICK_START.md](QUICK_START.md)
- 🪝 **Auto-Preview Setup**: [hooks/README.md](hooks/README.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/nanobanana/nanobanana-mcp/issues)
- 💬 **Feature Requests**: Welcome!

---

## 🤝 Contributing

Found a bug? Have a feature idea? Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use this in your own projects!

---

**⭐ If this helped you, please star the repository on GitHub!**

*Built with ❤️ for the Claude community*