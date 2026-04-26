import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import cookieParser from 'cookie-parser';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    spotifyState: string;
  }
}

import { initSocket, broadcastPresence } from './src/lib/socket.js';
import { loadBots } from './src/lib/bot-loader.js';
import db from './src/lib/db.js';
import axios from 'axios';
import crypto from 'crypto';
import { encrypt, decrypt } from './src/lib/encryption.js';
import { getSpotifyPlayback } from './src/lib/spotify.js';
import multer from 'multer';
import { broadcastSpotify } from './src/lib/socket.js';
import { getLastfmData } from './src/lib/lastfm.js';
import rateLimit from 'express-rate-limit';

const PORT = 3000;
const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = initSocket(server);

  app.set('trust proxy', 1); // Trust first proxy (AI Studio proxy)

  app.use(express.json());
  app.use(cookieParser());
  
  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, try again later.' }
  });
  app.use('/api/', apiLimiter);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'linkbolt-secret-123',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Enable proxy support
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Redis/In-memory Cache for Real-time
  const presenceCache = new Map<string, any>();
  const spotifyCache = new Map<string, any>();

  // Non-blocking bot loader
  loadBots((userId, presence) => {
    presenceCache.set(userId, presence);
    broadcastPresence(userId, presence);
  }).then(() => console.log('[Server] Bots loaded successfully'))
    .catch(err => console.error('[BotLoader] Error:', err));

  // Guestbook
  app.get('/api/guestbook/:profileId', (req, res) => {
    const messages = db.prepare('SELECT * FROM guestbook WHERE profileId = ? AND status = \'approved\' ORDER BY createdAt DESC').all(req.params.profileId);
    res.json(messages);
  });

  app.get('/api/click/:profileId', (req, res) => {
    const { url, platform } = req.query;
    if (!url || !platform) return res.redirect('/');
    
    db.prepare('INSERT INTO analytics (profileId, timestamp, type, ref) VALUES (?, ?, ?, ?)')
      .run(req.params.profileId, Date.now(), 'click', platform);
      
    res.redirect(url as string);
  });

  app.get('/api/guestbook-admin/:profileId', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const profile = db.prepare('SELECT id FROM profiles WHERE id = ? AND userId = ?').get(req.params.profileId, req.session.userId);
    if (!profile) return res.status(403).json({ error: 'Forbidden' });
    const messages = db.prepare('SELECT * FROM guestbook WHERE profileId = ? ORDER BY createdAt DESC').all(req.params.profileId);
    res.json(messages);
  });

  app.post('/api/guestbook/moderate', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { messageId, status } = req.body;
    const msg = db.prepare(`SELECT guestbook.* FROM guestbook JOIN profiles ON guestbook.profileId = profiles.id WHERE guestbook.id = ? AND profiles.userId = ?`).get(messageId, req.session.userId);
    if (!msg) return res.status(403).json({ error: 'Forbidden' });

    if (status === 'deleted') {
      db.prepare('DELETE FROM guestbook WHERE id = ?').run(messageId);
    } else {
      db.prepare('UPDATE guestbook SET status = ? WHERE id = ?').run(status, messageId);
    }
    res.json({ success: true });
  });

  app.post('/api/guestbook/:profileId', (req, res) => {
    const { authorName, message } = req.body;
    if (!authorName || !message) return res.status(400).json({ error: 'Missing fields' });
    db.prepare('INSERT INTO guestbook (id, profileId, authorName, message, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.profileId, authorName, message, Date.now());
    res.json({ success: true });
  });

// Badges
app.get('/api/badges/:userId', (req, res) => {
  const badges = db.prepare(`
    SELECT badges.* FROM badges 
    JOIN user_badges ON badges.id = user_badges.badgeId 
    WHERE user_badges.userId = ?
  `).all(req.params.userId);
  res.json(badges);
});

  // Spotify/Last.fm synchronization job
  setInterval(async () => {
  // Sync Spotify
  const spotifyUsers = db.prepare('SELECT userId FROM integrations WHERE platform = \'spotify\'').all() as { userId: string }[];
  for (const { userId } of spotifyUsers) {
    const playback = await getSpotifyPlayback(userId);
    if (playback) {
      spotifyCache.set(userId, playback);
      broadcastSpotify(userId, playback);
    }
  }

  // Sync Last.fm
  const lastfmUsers = db.prepare('SELECT userId FROM integrations WHERE platform = \'lastfm\'').all() as { userId: string }[];
  for (const { userId } of lastfmUsers) {
    const lfmData = await getLastfmData(userId);
    if (lfmData) {
      // Reusing cache/broadcast for simplicity or create specific one
      spotifyCache.set(`${userId}:lastfm`, lfmData);
    }
  }
}, 5000);

  // Static uploads
  app.use('/uploads', express.static('uploads'));

  // User API
  app.get(['/api/me', '/api/user'], (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = db.prepare('SELECT id, discordId, username, discriminator, avatar, createdAt FROM users WHERE id = ?').get(req.session.userId);
    res.json(user);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/u/:username', (req, res) => {
    const { username } = req.params;
    const profile = db.prepare(`
      SELECT users.username as discordUsername, users.avatar, users.discordId, users.id as realUserId, profiles.* 
      FROM profiles 
      JOIN users ON profiles.userId = users.id 
      WHERE profiles.customUsername = ?
    `).get(username) as any;
    
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    
    // Track analytics (Simplified)
    db.prepare('INSERT INTO analytics (profileId, timestamp, type, ref) VALUES (?, ?, ?, ?)')
      .run(profile.id, Date.now(), 'view', req.get('referrer') || 'direct');
    
    const presence = presenceCache.get(profile.discordId);
    let spotify = spotifyCache.get(profile.realUserId);
    if (!spotify) {
      spotify = spotifyCache.get(`${profile.realUserId}:lastfm`);
    }
    res.json({ ...profile, presence, spotify });
  });

  // Spotify Auth
  app.get('/api/auth/spotify/url', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const state = crypto.randomBytes(16).toString('hex');
    // Store state in session for verification
    (req.session as any).spotifyState = state;
    
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/spotify/callback`;
    const scopes = 'user-read-currently-playing user-read-playback-state';
    const url = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    res.json({ url });
  });

  app.delete('/api/integrations/:platform', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { platform } = req.params;
    db.prepare('DELETE FROM integrations WHERE userId = ? AND platform = ?').run(req.session.userId, platform);
    res.json({ success: true });
  });

  app.post('/api/integrations/lastfm', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { username } = req.body;
    
    db.prepare(`
      INSERT INTO integrations (userId, platform, lastFmUsername, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId, platform) DO UPDATE SET lastFmUsername = excluded.lastFmUsername, updatedAt = excluded.updatedAt
    `).run(req.session.userId, 'lastfm', username, Date.now());
    
    res.json({ success: true });
  });

  app.get('/api/integrations', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const integrations = db.prepare('SELECT platform, lastFmUsername FROM integrations WHERE userId = ?').all(req.session.userId);
    res.json(integrations);
  });

  app.get('/auth/spotify/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code || !req.session.userId) return res.status(400).send('Invalid request');
    
    // Verify state
    if (!state || state !== (req.session as any).spotifyState) {
        return res.status(400).send('State mismatch');
    }
    delete (req.session as any).spotifyState;

    try {
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/spotify/callback`;
      const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

      const { access_token, refresh_token } = response.data;
      
      db.prepare(`
        INSERT INTO integrations (userId, platform, accessToken, refreshToken, updatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId, platform) DO UPDATE SET accessToken=excluded.accessToken, refreshToken=excluded.refreshToken, updatedAt=excluded.updatedAt
      `).run(req.session.userId, 'spotify', encrypt(access_token), encrypt(refresh_token), Date.now());

      res.send(`<html><body><script>window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*'); window.close();</script></body></html>`);
    } catch (err) {
      res.status(500).send('Spotify connection failed');
    }
  });

  // File Upload
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const url = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.get('/api/analytics/:profileId', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    // Check ownership
    const profile = db.prepare('SELECT id FROM profiles WHERE id = ? AND userId = ?').get(req.params.profileId, req.session.userId);
    if (!profile) return res.status(403).json({ error: 'Forbidden' });
    
    const stats = db.prepare(`
      SELECT date(timestamp/1000, 'unixepoch') as day, count(*) as views 
      FROM analytics 
      WHERE profileId = ? 
      GROUP BY day 
      ORDER BY day DESC 
      LIMIT 14
    `).all(req.params.profileId);
    
    res.json(stats);
  });

  app.get('/api/profiles', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const profiles = db.prepare('SELECT * FROM profiles WHERE userId = ?').all(req.session.userId);
    res.json(profiles);
  });

  app.post(['/api/profiles', '/api/profile/create'], (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const id = crypto.randomUUID();
    let { displayName, customUsername } = req.body;
    
    // Slug validation
    if (customUsername) {
      customUsername = customUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const existing = db.prepare('SELECT id FROM profiles WHERE customUsername = ?').get(customUsername);
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    } else {
      customUsername = `user_${id.substring(0, 8)}`;
    }

    try {
      db.prepare(`
        INSERT INTO profiles (id, userId, customUsername, displayName, bio, backgroundType, backgroundValue, theme, badges, socials, layout)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.session.userId, customUsername, displayName || 'New Profile', '', 'gradient', 'linear-gradient(to right, #6366f1, #a855f7)', '{}', '[]', '[]', '{}');
      res.json({ id });
    } catch (err) {
      console.error('Create profile error:', err);
      res.status(500).json({ error: 'Failed to create profile' });
    }
  });

  app.delete(['/api/profiles/:id', '/api/profile/delete/:id'], (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM profiles WHERE id = ? AND userId = ?').run(id, req.session.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
    
    res.json({ success: true });
  });

  app.post(['/api/profile/save', '/api/profile/update'], (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, displayName, customUsername, bio, socials, theme, backgroundType, backgroundValue, layout } = req.body;
    
    try {
      db.prepare(`
        UPDATE profiles 
        SET displayName = ?, customUsername = ?, bio = ?, socials = ?, theme = ?, backgroundType = ?, backgroundValue = ?, layout = ?
        WHERE id = ? AND userId = ?
      `).run(
        displayName, 
        customUsername, 
        bio, 
        JSON.stringify(socials), 
        JSON.stringify(theme), 
        backgroundType, 
        backgroundValue, 
        JSON.stringify(layout),
        id,
        req.session.userId
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error saving profile:', err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  app.put('/api/settings/update', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.session.userId);
    res.json({ success: true });
  });

  // OAuth Flows
  app.get('/api/auth/discord/url', (req, res) => {
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/discord/callback`;
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20connections`;
    res.json({ url });
  });

  app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send('No code provided');

    try {
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/discord/callback`;
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

      const { access_token, refresh_token } = tokenResponse.data;
      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const discordUser = userResponse.data;
      
      let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(discordUser.id) as any;
      
      if (!user) {
        const userId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO users (id, discordId, username, discriminator, avatar, accessToken, refreshToken, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, discordUser.id, discordUser.username, discordUser.discriminator, discordUser.avatar, encrypt(access_token), encrypt(refresh_token), Date.now());
        
        // Create default profile
        const profileId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO profiles (id, userId, customUsername, displayName, bio, backgroundType, backgroundValue, theme, badges, socials, layout, isDefault)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(profileId, userId, discordUser.username, discordUser.username, 'Welcome to my profile!', 'gradient', 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)', '{}', '[]', '[]', '{}', 1);
        
        user = { id: userId };
      } else {
        db.prepare('UPDATE users SET accessToken = ?, refreshToken = ?, username = ?, avatar = ? WHERE id = ?')
          .run(encrypt(access_token), encrypt(refresh_token), discordUser.username, discordUser.avatar, user.id);
      }

      req.session.userId = user.id;
      
      console.log(`[OAuth] Login successful for user: ${discordUser.username} (${user.id})`);
      res.redirect('/dashboard');
    } catch (err) {
      console.error('Discord Auth Error:', err);
      const errorMessage = err instanceof Error ? encodeURIComponent(err.message) : 'unknown';
      res.redirect(`/login?error=${errorMessage}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    // If dist exists and we are not explicitly in dev, prefer static serving
    if (fs.existsSync(indexPath) && process.env.VITE_DEV !== 'true') {
      console.log('[Server] Production build found. Serving static files...');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return;
        res.sendFile(indexPath);
      });
    } else {
      console.log('[Server] Initializing Vite middleware...');
      try {
        const { createServer: createViteServer, loadEnv } = await import('vite');
        const react = (await import('@vitejs/plugin-react')).default;
        const tailwindcss = (await import('@tailwindcss/vite')).default;

        const mode = process.env.NODE_ENV || 'development';
        const env = loadEnv(mode, process.cwd(), '');
        
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: process.env.DISABLE_HMR !== 'true'
          },
          appType: 'spa',
          root: process.cwd()
        });
        
        app.use(vite.middlewares);
        console.log('[Server] Vite middleware mounted.');
      } catch (viteError) {
        console.error('[Server] Failed to initialize Vite:', viteError);
        if (fs.existsSync(indexPath)) {
          console.log('[Server] Falling back to static dist...');
          app.use(express.static(distPath));
          app.get('*', (req, res) => {
            if (req.path.startsWith('/api')) return;
            res.sendFile(indexPath);
          });
        } else {
          app.get('/', (req, res) => {
            res.status(500).send(`
              <div style="font-family: sans-serif; padding: 2rem; background: #fff1f2; min-height: 100vh;">
                <h1 style="color: #be123c;">Server Initialization Error</h1>
                <p>The development engine (Vite) failed to start, and no production build was found in <code>/dist</code>.</p>
                
                <div style="background: #fff; padding: 1rem; border: 1px solid #fda4af; border-radius: 0.5rem; margin: 1.5rem 0;">
                  <strong style="display: block; margin-bottom: 0.5rem; color: #9f1239;">Underlying Error:</strong>
                  <pre style="white-space: pre-wrap; font-size: 0.875rem; margin: 0;">${viteError instanceof Error ? viteError.stack : String(viteError)}</pre>
                </div>

                <h2 style="color: #9f1239; font-size: 1.25rem;">Next Steps to Fix:</h2>
                <ol style="line-height: 1.6;">
                  <li><strong>Fix Tailwind Native Bindings:</strong> Run <code>npm install @tailwindcss/oxide-linux-x64-gnu</code> (for standard Linux) or <code>npm install @tailwindcss/oxide-linux-arm64-gnu</code> (for ARM).</li>
                  <li><strong>Build Frontend:</strong> After fixing the bindings, run <code>npm run build</code>.</li>
                  <li><strong>Check Node Version:</strong> Ensure you are on Node.js 20+ if you want to use the live development engine.</li>
                </ol>
                <p style="color: #64748b; font-size: 0.875rem; margin-top: 2rem;">Refresh this page after trying the fixes.</p>
              </div>
            `);
          });
        }
      }
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return;
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Run npm run build.');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Success! Listening on 0.0.0.0:${PORT}`);
    console.log(`[Server] App URL: ${process.env.APP_URL || 'http://localhost:3000'}`);
  });
}

console.log('[Server] Starting LinkBolt...');
startServer().catch(err => {
  console.error('[Server] Fatal crash during startup:', err);
});
