import db from './db.js';
import axios from 'axios';

const API_KEY = process.env.LASTFM_API_KEY;

export async function getLastfmData(userId: string) {
  const integration = db.prepare('SELECT * FROM integrations WHERE userId = ? AND platform = \'lastfm\'').get(userId) as any;
  if (!integration || !integration.lastFmUsername || !API_KEY) return null;

  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.getrecenttracks',
        user: integration.lastFmUsername,
        api_key: API_KEY,
        format: 'json',
        limit: 1
      }
    });

    const track = response.data.recenttracks.track[0];
    return {
      name: track.name,
      artist: track.artist['#text'],
      album: track.album['#text'],
      image: track.image[3]['#text'],
      nowPlaying: track['@attr']?.nowplaying === 'true'
    };
  } catch (err) {
    return null;
  }
}
