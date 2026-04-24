import db from './db.js';
import { encrypt, decrypt } from './encryption.js';
import axios from 'axios';

export async function getSpotifyPlayback(userId: string) {
  const integration = db.prepare('SELECT * FROM integrations WHERE userId = ? AND platform = \'spotify\'').get(userId) as any;
  if (!integration || !integration.accessToken) return null;

  try {
    const accessToken = decrypt(integration.accessToken);
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.status === 204 || !response.data || !response.data.item) return null;

    return {
      name: response.data.item.name,
      artist: response.data.item.artists[0].name,
      albumArt: response.data.item.album.images[0].url,
      progressMs: response.data.progress_ms,
      durationMs: response.data.item.duration_ms,
      isPlaying: response.data.is_playing,
      updatedAt: Date.now()
    };
  } catch (err: any) {
    if (err.response?.status === 401) {
      // Refresh token logic
      await refreshSpotifyToken(userId, integration.refreshToken);
      return getSpotifyPlayback(userId); // Retry once after refresh
    }
    return null;
  }
}

async function refreshSpotifyToken(userId: string, encryptedRefreshToken: string) {
  const refreshToken = decrypt(encryptedRefreshToken);
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token } = response.data;
    db.prepare('UPDATE integrations SET accessToken = ?, updatedAt = ? WHERE userId = ? AND platform = \'spotify\'')
      .run(encrypt(access_token), Date.now(), userId);
  } catch (err) {
    console.error('Spotify Token Refresh Failed:', err);
  }
}
