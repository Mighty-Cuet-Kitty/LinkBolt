import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export interface User {
  id: string; // Internal UUID
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
  createdAt: number;
}

export interface Profile {
  id: string;
  userId: string;
  customUsername: string; // The URL slug /u/{customUsername}
  displayName: string;
  bio: string;
  pfpOverride?: string;
  backgroundType: 'image' | 'gradient' | 'video';
  backgroundValue: string;
  theme: string; // JSON string for advanced styles
  badges: string[]; // List of badge IDs
  socials: SocialLink[];
  layout: any; // JSON for toggleable sections
  isDefault: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface Integration {
  userId: string;
  platform: 'spotify' | 'lastfm';
  accessToken?: string;
  refreshToken?: string;
  lastFmUsername?: string;
  updatedAt: number;
}

export interface DiscordPresenceStatus {
  status: string;
  activities: any[];
}

export interface SpotifyPlayback {
  name: string;
  artist: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}
