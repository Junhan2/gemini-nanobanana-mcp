# 5-Minute Quick Start Guide

> **Never used Claude with image generation?** This guide gets you up and running in 5 minutes, guaranteed!

## What You'll Get
- Generate images just by typing: "Draw a cute cat"
- Images automatically save to your Downloads folder
- Works with Claude Desktop, Claude Code, or Cursor

---

## Step 1: Get Your API Key (1 minute)

1. **Click here**: [Google AI Studio](https://aistudio.google.com/apikey)
2. **Sign in** with any Google account (Gmail, etc.)
3. **Click the blue "Create API key" button**
4. **Copy the key** (looks like: `AIzaSyB...`)

**Got your key?** Move to step 2!

---

## Step 2: Choose Your Setup (2 minutes)

### Option A: Claude Desktop (Windows)

1. **Press `Windows + R`**, type `%APPDATA%` and press Enter
2. **Open the `Claude` folder** (create it if it doesn't exist)
3. **Create a new file** called `claude_desktop_config.json`
4. **Paste this code** into the file:

```json
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "PUT_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

5. **Replace `PUT_YOUR_API_KEY_HERE`** with your actual API key from Step 1
6. **Save the file** and **restart Claude Desktop**

### Option B: Claude Desktop (Mac)

1. **Open Terminal** (press `Cmd + Space`, type "Terminal")
2. **Copy and paste this command** (replace `PUT_YOUR_API_KEY_HERE` with your key):

```bash
mkdir -p ~/Library/Application\ Support/Claude && cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "gemini-nanobanana-mcp": {
      "command": "npx",
      "args": ["gemini-nanobanana-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "PUT_YOUR_API_KEY_HERE"
      }
    }
  }
}
EOF
```

3. **Press Enter** and **restart Claude Desktop**

### Option C: Claude Code (Easiest!)

1. **Open your terminal**
2. **Run this one command** (replace `PUT_YOUR_API_KEY_HERE` with your key):

```bash
claude mcp add gemini-nanobanana-mcp -s user -e GEMINI_API_KEY="PUT_YOUR_API_KEY_HERE" -- npx -y gemini-nanobanana-mcp@latest
```

3. **That's it!** No restart needed.

### Option D: Cursor

1. **Open Cursor**
2. **Go to Settings** → **MCP** → **Add new MCP Server**
3. **Fill out the form**:
   - Name: `gemini-nanobanana-mcp`
   - Command: `npx`
   - Args: `gemini-nanobanana-mcp@latest`
   - Environment Variables: `GEMINI_API_KEY` = your API key
4. **Save and restart Cursor**

---

## Step 3: Test It! (1 minute)

Open Claude and type any of these:

```
Generate a cute puppy playing in grass
```

```
Create a sunset over mountains
```

```
Draw a red sports car
```

**You should see:**
```
Image generated and saved to: ~/Downloads/gemini-images/generate-2025-01-09-14-30-45.png
Size: 1.2MB | Format: PNG
```

**Your image is automatically saved to your Downloads folder!**

---

## Success! What Now?

### Try These Commands:
- `"Make this image black and white"` (after uploading a photo)
- `"Create a medieval castle on a hilltop"`
- `"Design a modern logo for a coffee shop"`
- `"Generate a fantasy landscape with dragons"`

### Save to Custom Location:
```
Create a beach sunset and save it as ./my-sunset.png
```

### Need the Auto-Preview Feature?
If you want images to automatically open after generation:
1. Follow the [Hook Setup Guide](hooks/README.md)
2. Only works with Claude Code on Mac (for now)

---

## Something Wrong?

### "GEMINI_API_KEY not set" Error
- Double-check you replaced `PUT_YOUR_API_KEY_HERE` with your actual key
- Make sure there are no extra quotes or spaces
- Restart Claude completely

### "No such file or directory" Error
- Install Node.js: [nodejs.org](https://nodejs.org/) (get the LTS version)
- Restart your computer after installing
- Try again

### Images Not Generating
- Check your internet connection
- Try a simpler prompt: `"Generate a blue circle"`
- Make sure you restarted Claude after setup

### Still Stuck?
- Check the main [README.md](README.md) for detailed troubleshooting
- [Open an issue](https://github.com/nanobanana/nanobanana-mcp/issues) on GitHub

---

## Pro Tips

1. **Be specific**: "Golden retriever puppy with blue eyes" vs "dog"
2. **Add style**: "in watercolor style", "photorealistic", "cartoon"
3. **Set the scene**: "in a sunny garden", "at sunset", "indoors"
4. **Include mood**: "cozy", "dramatic", "peaceful", "energetic"

---

**That's it! You're now generating AI images with Claude!**

*Want more features? Check out the full [README.md](README.md)*