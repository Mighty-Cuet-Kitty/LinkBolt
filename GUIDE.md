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
   Edit `.env` and fill in your credentials:
   - `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET` (from Discord Developer Portal)
   - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET` (from Spotify Developer Dashboard)
   - `APP_URL`: Your server's URL (e.g., `http://your-ip:3000`)
   - `SESSION_SECRET`: A long random string.

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

### "Cannot GET /" or No CSS
This happens if the server starts but Vite fails to mount. 
- **Check**: Did you see `[Server] Failed to initialize Vite` in the logs?
- **Fix**: Follow the **Production Mode** steps (run `npm run build` before `npm start`).

### Permissions
If you use `sudo npm start`, some files created by `npm install` might have restricted permissions. It is better to run as a normal user if possible. If you must use a privileged port (like 80), use a reverse proxy like Nginx instead.
