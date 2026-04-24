import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';

interface BotInstance {
  token: string;
  client: Client;
}

const bots: Map<string, BotInstance> = new Map();

export async function loadBots(onPresenceUpdate: (userId: string, presence: any) => void) {
  try {
    const rootDir = process.cwd(); 
    if (!fs.existsSync(rootDir)) return;

    const dirents = fs.readdirSync(rootDir, { withFileTypes: true });

    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        // Skip common large directories
        if (['node_modules', '.git', '.next', 'dist', 'uploads'].includes(dirent.name)) continue;

        const tokenPath = path.join(rootDir, dirent.name, 'token.json');
        if (fs.existsSync(tokenPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
            if (config.token) {
              await spawnBot(config.token, onPresenceUpdate);
              console.log(`[BotLoader] Spawned bot from ${dirent.name}`);
            }
          } catch (err) {
            console.error(`[BotLoader] Failed to load bot from ${dirent.name}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[BotLoader] Fatal error in loadBots:`, err);
  }
}

async function spawnBot(token: string, onPresenceUpdate: (userId: string, presence: any) => void) {
  if (bots.has(token)) return;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence.userId) return;
    
    const activities = newPresence.activities.map(a => ({
      name: a.name,
      type: a.type,
      state: a.state,
      details: a.details,
      assets: a.assets,
      timestamps: a.timestamps,
    }));

    onPresenceUpdate(newPresence.userId, {
      status: newPresence.status,
      activities,
    });
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('!linkbolt')) {
       message.reply('⚡ LinkBolt Bot is active on this server! I provide real-time status updates for linked profiles.');
    }
  });

  try {
    await client.login(token);
    bots.set(token, { token, client });
  } catch (err) {
    console.error(`[BotLoader] Auth failed for token starting with ${token.substring(0, 10)}...`);
  }
}

export function getBotCount() {
  return bots.size;
}
