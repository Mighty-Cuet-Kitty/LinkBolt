# LinkBolt Installation & Startup Guide

This guide will help you set up and run LinkBolt on your local Linux server.

## 1. Prerequisites

- **Node.js**: Version 20 or 22 is **highly recommended**. 
  - Node 18 (your current version) has known issues with modern ESM loaders (like `tsx`) and Vite middleware, which causes the `ERR_INVALID_URL_SCHEME` error you saw.
  - To upgrade Node on Ubuntu/Debian:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
- **Git**: To clone the repository.
- **SQLite3**: The app uses SQLite for data storage.

## 2. Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd LinkBolt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your credentials. **IMPORTANT**: Do not use quotes around values unless they contain spaces.
   - `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET` (from [Discord Developer Portal](https://discord.com/developers/applications))
   - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` (from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard))
   - `APP_URL`: Your server's URL including protocol (e.g., `http://localhost:3000` or `https://your-domain.com`)
   - `SESSION_SECRET`: A long random string for session encryption.
   - `ENCRYPTION_KEY`: A 32-character string for database encryption.

4. **Discord/Spotify Redirect URLs**:
   In your developer dashboards, you **MUST** whitelist the following redirect URIs:
   - Discord: `http://localhost:3000/auth/discord/callback` (Replace localhost with your domain if applicable)
   - Spotify: `http://localhost:3000/auth/spotify/callback`

## 3. Starting the Application

### Option A: Development Mode (with Live Reload)
This uses Vite middleware. It works best on Node 20+.
```bash
npm run dev
```

### Option B: Production Mode (Recommended for your environment)
If you see errors starting Vite in dev mode, use this method. It pre-builds the frontend so the server only has to serve static files, which is much more stable.

1. **Build the frontend**:
   ```bash
   npm run build
   ```
2. **Start the server**:
   ```bash
   npm start
   ```

## 4. Troubleshooting

### "TypeError [ERR_INVALID_URL_SCHEME]"
This is caused by a conflict between Node 18's ESM loader and Vite. 
- **Fix**: Upgrade to Node 20+ OR use the **Production Mode** (Build then Start) described above.

### "Error: Cannot find native binding" (Tailwind CSS v4 Fix)
This is a common issue with Tailwind v4's new Rust-based engine on Linux. 

**The Fix:**
1. Manually install the native binding for your architecture:
   ```bash
   # For standard 64-bit Linux (most servers)
   npm install @tailwindcss/oxide-linux-x64-gnu
   
   # For ARM64 Linux (like Raspberry Pi or Oracle ARM)
   npm install @tailwindcss/oxide-linux-arm64-gnu
   ```
2. If that fails, try a clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### "Cannot GET /" or No CSS
This happens if the server starts but Vite fails to mount. 
- **Check**: Did you see `[Server] Failed to initialize Vite` in the logs?
- **Fix**: Make sure you have run `npm run build` so the server can serve the pre-compiled files if the real-time engine fails.

### Permissions
If you use `sudo npm start`, some files created by `npm install` might have restricted permissions. It is better to run as a normal user if possible. If you must use a privileged port (like 80), use a reverse proxy like Nginx instead.
