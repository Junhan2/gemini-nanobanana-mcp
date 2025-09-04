# Gemini Nanobanana MCP

[![npm version](https://badge.fury.io/js/gemini-nanobanana-mcp.svg)](https://www.npmjs.com/package/gemini-nanobanana-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)

A Model Context Protocol (MCP) server for conversational image generation and editing with Google's Gemini 2.5 Flash Image Preview. Designed to be easy to install and use from Claude Code and other MCP clients.

## Key Features

- **Text-to-Image**: Generate images from detailed prompts
- **Image Editing**: Edit images with natural language instructions
- **Multi-Image Composition / Style Transfer**: Combine images or transfer styles
- **File Save Option**: Return base64 image and optionally save to file
- **Provider-Agnostic MCP**: Works in any MCP-enabled client
- **Enterprise-Ready**: Built-in security, error handling, and structured logging
- **Input Validation**: Comprehensive validation with size limits and security checks
- **Auto-Retry**: Exponential backoff for failed API requests
- **Cross-Platform**: Windows, macOS, and Linux support

## 🎬 Demo

### Image Generation with Auto-Save
![Demo GIF](assets/demo.gif)

*Generate images with natural language and automatically save to your Downloads folder*

**Quick Demo Steps:**
1. Type: `"Generate a cute cat playing with a ball"`
2. ✅ Image created and auto-saved to `~/Downloads/gemini-images/`
3. 📁 Open file location to view your image

### Custom Path Saving
```
Create a sunset landscape and save to ./my-sunset.png
→ Saves directly to your specified path
```

## Requirements

- Node.js 18 or newer
- An MCP client (Claude Code, Cursor, VS Code, Windsurf, etc.)
- Google Gemini API Key: set `GEMINI_API_KEY`

### Get a Gemini API key

Follow these steps to obtain an API key from Google AI Studio:

1) Open Google AI Studio and sign in: https://aistudio.google.com/apikey
2) Click “Create API key” (or “Manage keys” if you already have one)
3) Copy the generated key
4) Set it as an environment variable on your machine when running this server

Examples:
```bash
# macOS / Linux (bash/zsh)
export GEMINI_API_KEY="YOUR_API_KEY"

# Windows PowerShell
$env:GEMINI_API_KEY="YOUR_API_KEY"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ | - | Your Google AI Studio API key |
| `AUTO_SAVE` | ❌ | `true` | Automatically save images when no path specified |
| `DEFAULT_SAVE_DIR` | ❌ | `~/Downloads/gemini-images` | Default directory for auto-saved images |
| `MCP_NAME` | ❌ | `gemini-nanobanana-mcp` | Server instance name |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport mode (`stdio` or `http`) |
| `MCP_HTTP_HOST` | ❌ | `127.0.0.1` | HTTP bind address (localhost only for security) |
| `MCP_HTTP_PORT` | ❌ | `7801` | HTTP server port |
| `MCP_HTTP_PATH` | ❌ | `/mcp` | HTTP endpoint path |
| `MCP_HTTP_ENABLE_JSON` | ❌ | `false` | Enable JSON responses (vs SSE streaming) |
| `LOG_LEVEL` | ❌ | `info` | Logging level (`error`, `warn`, `info`, `debug`) |
| `GEMINI_IMAGE_ENDPOINT` | ❌ | Auto | Custom Gemini API endpoint URL |

## 💾 Image Saving Options

### Automatic Saving (Default)
By default, all generated images are automatically saved to `~/Downloads/gemini-images/` with timestamped filenames:
- Format: `{tool}-{date}-{time}.{extension}`
- Example: `generate-2025-09-04-16-30-45.png`

### Custom Path Saving
Specify a custom path using the `saveToFilePath` parameter:
```
Generate a sunset image and save to ./my-sunset.png
```

### Disable Auto-Save
Set `AUTO_SAVE=false` to only save when explicitly requested:
```json
{
  "env": {
    "GEMINI_API_KEY": "YOUR_API_KEY",
    "AUTO_SAVE": "false"
  }
}
```

### Custom Default Directory
Change the default save location:
```json
{
  "env": {
    "GEMINI_API_KEY": "YOUR_API_KEY",
    "DEFAULT_SAVE_DIR": "~/Pictures/AI-Images"
  }
}
```

## Security Features

- **Local-only HTTP binding**: HTTP mode binds to `127.0.0.1` by default
- **Request size limits**: 10MB HTTP body limit, 20MB image size limit
- **Path traversal protection**: File paths are validated to prevent directory traversal
- **Input validation**: MIME type whitelist, Base64 size limits
- **Structured logging**: JSON logs with request metadata for monitoring

## 🔧 Configuration

Choose your client and follow the installation instructions:

<details>
<summary><b>Claude Desktop</b></summary>

Add to your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY",
        "AUTO_SAVE": "true",
        "DEFAULT_SAVE_DIR": "~/Downloads/gemini-images"
      }
    }
  }
}
```

**Restart Claude Desktop** after adding the configuration.
</details>

<details>
<summary><b>Claude Code</b></summary>

Quick installation using CLI:
```bash
claude mcp add gemini-nanobanana-mcp -s user \
  -e GEMINI_API_KEY="YOUR_API_KEY" \
  -e AUTO_SAVE="true" \
  -e DEFAULT_SAVE_DIR="~/Downloads/gemini-images" \
  -- npx -y gemini-nanobanana-mcp@latest
```

Or install globally:
```bash
npm i -g gemini-nanobanana-mcp
claude mcp add gemini-nanobanana-mcp -s user \
  -e GEMINI_API_KEY="YOUR_API_KEY" \
  -e AUTO_SAVE="true" \
  -e DEFAULT_SAVE_DIR="~/Downloads/gemini-images" \
  -- gemini-nanobanana-mcp
```

Minimal installation (auto-save enabled by default):
```bash
claude mcp add gemini-nanobanana-mcp -s user \
  -e GEMINI_API_KEY="YOUR_API_KEY" \
  -- npx -y gemini-nanobanana-mcp@latest
```

Remove if needed:
```bash
claude mcp remove gemini-nanobanana-mcp
```
</details>

<details>
<summary><b>Cursor</b></summary>

1. Go to `Cursor Settings` → `MCP` → `Add new MCP Server`
2. Add the following configuration:

- **Name**: gemini-nanobanana-mcp
- **Command**: npx
- **Args**: gemini-nanobanana-mcp@latest
- **Environment Variables**: 
  - `GEMINI_API_KEY`: YOUR_API_KEY
- **Auto start**: on (optional)

**Restart Cursor** after adding the configuration.
</details>

<details>
<summary><b>VS Code</b></summary>

Add via CLI:
```bash
code --add-mcp '{
  "name":"gemini-nanobanana-mcp",
  "command":"npx",
  "args":["gemini-nanobanana-mcp@latest"],
  "env":{
    "GEMINI_API_KEY":"YOUR_API_KEY",
    "AUTO_SAVE":"true",
    "DEFAULT_SAVE_DIR":"~/Downloads/gemini-images"
  }
}'
```

Or add to VS Code MCP settings manually with the same configuration.

**Restart VS Code** after adding the configuration.
</details>

## 🚀 Quick Start

After configuration, you can start using the server immediately:

```bash
# Claude Code (Recommended)
claude mcp add gemini-nanobanana-mcp -s user -e GEMINI_API_KEY="YOUR_API_KEY" -- npx -y gemini-nanobanana-mcp@latest

# Global install
npm i -g gemini-nanobanana-mcp
```

### Usage Examples

**Auto-save (Default Behavior):**
```
Generate a beautiful sunset landscape
→ Automatically saves to ~/Downloads/gemini-images/generate-2025-09-04-16-30-45.png
```

**Custom Path:**
```
Create a cute cat image and save to ./my-cat.png
→ Saves to ./my-cat.png
```

**View Only (No Save):**
```
Generate a mountain scene (with AUTO_SAVE=false)
→ Shows image in chat without saving
```

## 🛠️ Available Tools

This MCP server provides 4 powerful image generation and editing tools:

### 🎨 generate_image
**Create images from text descriptions**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ | Detailed description of the image to generate |
| `saveToFilePath` | string | ❌ | Local path to save the generated image |

**Example:**
```json
{
  "prompt": "A futuristic cityscape at sunset with flying cars and neon lights reflecting off glass buildings",
  "saveToFilePath": "./futuristic-city.png"
}
```

### ✏️ edit_image
**Modify existing images with natural language instructions**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ | Instructions for editing the image |
| `image` | object | ✅ | Image source (`path`, `dataBase64`, `mimeType`) |
| `saveToFilePath` | string | ❌ | Local path to save the edited image |

**Example:**
```json
{
  "prompt": "Change the sky to a dramatic storm with lightning bolts",
  "image": { 
    "path": "./landscape.jpg", 
    "mimeType": "image/jpeg" 
  },
  "saveToFilePath": "./stormy-landscape.png"
}
```

### 🔀 compose_images
**Combine multiple images into one cohesive composition**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ | Instructions for combining the images |
| `images` | array | ✅ | Array of 2-4 image sources |
| `saveToFilePath` | string | ❌ | Local path to save the composed image |

**Example:**
```json
{
  "prompt": "Create a surreal collage with the moon from image 1 replacing the sun in image 2, and add the cat from image 3 sitting on a cloud",
  "images": [
    { "path": "./moon.jpg", "mimeType": "image/jpeg" },
    { "path": "./sunny-day.jpg", "mimeType": "image/jpeg" },
    { "path": "./cat.png", "mimeType": "image/png" }
  ],
  "saveToFilePath": "./surreal-composition.png"
}
```

### 🎭 style_transfer
**Apply artistic styles between images**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseImage` | object | ✅ | The content image to be stylized |
| `styleImage` | object | ✅ | The image providing the artistic style |
| `prompt` | string | ❌ | Additional styling instructions |
| `saveToFilePath` | string | ❌ | Local path to save the stylized image |

**Example:**
```json
{
  "baseImage": { "path": "./portrait.jpg", "mimeType": "image/jpeg" },
  "styleImage": { "path": "./van-gogh-painting.jpg", "mimeType": "image/jpeg" },
  "prompt": "Apply the brushwork and color palette while maintaining facial features",
  "saveToFilePath": "./stylized-portrait.png"
}
```

## 💡 Real-World Usage Examples

### 🏢 Marketing & Design
**Task:** Create social media content for a coffee shop
```
Generate a cozy coffee shop interior with warm lighting, steamed milk art in a cup, 
and people working on laptops in the background, Instagram-ready aesthetic
```

**Task:** Edit product photos for e-commerce
```
Remove the background from this product image and replace it with a clean white studio background
```

### 🎮 Content Creation
**Task:** Design game assets
```
Create a fantasy medieval castle on a floating island with waterfalls cascading down, 
surrounded by flying dragons and magical aurora lights
```

**Task:** Comic book illustration
```
Transform this photo into a comic book style illustration with bold outlines, 
vibrant colors, and dramatic shading
```

### 🎨 Artistic Projects
**Task:** Create artwork for wall decoration
```
Compose a triptych combining: a serene mountain lake, cherry blossoms, 
and a full moon reflection, in a traditional Japanese art style
```

**Task:** Style experimentation
```
Apply Picasso's cubist style to this portrait while maintaining the subject's recognizable features
```

### 📚 Educational Content
**Task:** Visualize historical concepts
```
Generate a historically accurate Renaissance marketplace scene with merchants, 
artisans, and period-appropriate architecture and clothing
```

**Task:** Scientific illustration
```
Create a cross-section diagram of a volcanic eruption showing magma chambers, 
lava flows, and geological layers in an educational illustration style
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run locally (STDIO mode)
npm run start

# Or run in development mode with watch
npm run dev
```

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript with type definitions
- `npm run clean` - Clean build directory
- `npm run dev` - Watch mode for development
- `npm run start` - Run the compiled server
- `npm run typecheck` - Type checking without compilation
- `npm run lint` - Run ESLint on source files
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Development Environment

Set up environment variables:

```bash
# Required
export GEMINI_API_KEY="your-api-key"

# Optional - for debugging
export LOG_LEVEL="debug"

# Optional - for HTTP mode testing
export MCP_TRANSPORT="http"
export MCP_HTTP_HOST="127.0.0.1"
export MCP_HTTP_PORT="7801"
```

### Testing HTTP Mode

```bash
# Start server in HTTP mode
MCP_TRANSPORT=http npm run start

# Test with curl
curl -X POST http://127.0.0.1:7801/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 🔧 Troubleshooting

<details>
<summary><b>Common Issues</b></summary>

### API Key Issues
- **Problem**: "API key not found" or authentication errors
- **Solution**: Ensure `GEMINI_API_KEY` is set correctly in your environment variables

### Installation Issues
- **Problem**: `npx` command not found
- **Solution**: Install Node.js 18+ from [nodejs.org](https://nodejs.org)

### Client Not Detecting Server
- **Problem**: MCP server not appearing in client
- **Solution**: Restart your client application after configuration changes

### Image Generation Failures
- **Problem**: "Failed to generate image" errors
- **Solution**: Check your Gemini API quota and ensure your API key has image generation permissions
</details>

<details>
<summary><b>Debug Mode</b></summary>

Enable debug logging:
```bash
export LOG_LEVEL=debug
```

For HTTP mode debugging:
```bash
export MCP_TRANSPORT=http
export LOG_LEVEL=debug
```
</details>

## Name Consistency & Troubleshooting

- Always use CANONICAL_ID (`gemini-nanobanana-mcp`) for identifiers and keys.
- Use CANONICAL_DISPLAY (`Gemini Nanobanana MCP`) only for UI labels.
- Do not mix different names across clients.

Consistency Matrix:
- npm package name → `gemini-nanobanana-mcp`
- Binary name → `gemini-nanobanana-mcp`
- MCP server name (SDK metadata) → `gemini-nanobanana-mcp`
- Env default MCP_NAME → `gemini-nanobanana-mcp`
- Client registry key → `gemini-nanobanana-mcp`
- UI label → `Gemini Nanobanana MCP`

Conflict Cleanup:
- Remove any old entries like "GeminiFlash" and re-add with `gemini-nanobanana-mcp`.
- Ensure global registries only use `gemini-nanobanana-mcp` for keys.
- Cursor: configure in the UI only. This project does not include `.cursor/mcp.json`.

## 👥 Contributors

- **Junhan2** - *Initial work* - [@Junhan2](https://github.com/Junhan2)

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Junhan2

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Google's Gemini team for the amazing image generation capabilities
- The Model Context Protocol community
- All contributors and users who help improve this project

---
Made with ❤️ for the MCP community

## 📚 References

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs/sdks)
- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [Server Concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [Gemini API Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
