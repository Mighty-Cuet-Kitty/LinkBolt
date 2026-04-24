import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database('database.sqlite');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    discordId TEXT UNIQUE,
    username TEXT,
    discriminator TEXT,
    avatar TEXT,
    accessToken TEXT,
    refreshToken TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    userId TEXT,
    customUsername TEXT UNIQUE,
    displayName TEXT,
    bio TEXT,
    pfpOverride TEXT,
    backgroundType TEXT,
    backgroundValue TEXT,
    theme TEXT,
    badges TEXT,
    socials TEXT,
    layout TEXT,
    isDefault INTEGER DEFAULT 0,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS integrations (
    userId TEXT,
    platform TEXT,
    accessToken TEXT,
    refreshToken TEXT,
    lastFmUsername TEXT,
    updatedAt INTEGER,
    PRIMARY KEY(userId, platform),
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS widgets (
    id TEXT PRIMARY KEY,
    profileId TEXT,
    type TEXT,
    config TEXT,
    x INTEGER,
    y INTEGER,
    w INTEGER,
    h INTEGER,
    FOREIGN KEY(profileId) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId TEXT,
    timestamp INTEGER,
    type TEXT, -- 'view', 'click'
    ref TEXT,
    country TEXT,
    FOREIGN KEY(profileId) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS guestbook (
    id TEXT PRIMARY KEY,
    profileId TEXT,
    authorName TEXT,
    message TEXT,
    createdAt INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'spam'
    FOREIGN KEY(profileId) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT,
    icon TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    userId TEXT,
    badgeId TEXT,
    PRIMARY KEY(userId, badgeId),
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(badgeId) REFERENCES badges(id)
  );
`);

export default db;

export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByDiscordId(discordId: string) {
  return db.prepare('SELECT * FROM users WHERE discordId = ?').get(discordId);
}

export function getUserByCustomUsername(username: string) {
  return db.prepare(`
    SELECT users.*, profiles.* 
    FROM users 
    JOIN profiles ON users.id = profiles.userId 
    WHERE profiles.customUsername = ?
  `).get(username);
}
