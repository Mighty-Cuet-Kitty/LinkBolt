import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import type { DiscordPresenceStatus, SpotifyPlayback } from '../types';
import ReactMarkdown from 'react-markdown';
import { Github, Twitter, Youtube, Instagram, Music, ExternalLink, Globe } from 'lucide-react';

function LayoutRenderer({ profile, theme, accentColor, presence, spotify, messages, newMsg, setNewMsg, handleSendGuestbook }: any) {
  const layout = typeof profile.layout === 'string' ? JSON.parse(profile.layout || '{}') : (profile.layout || {});
  const widgets = layout.widgets || ['bio', 'socials', 'presence', 'spotify', 'guestbook'];

  return (
    <div className="w-full space-y-8">
      {widgets.map((wId: string | { type: string }, index: number) => {
        const type = typeof wId === 'string' ? wId : wId.type;
        
        switch (type) {
          case 'bio':
            return (
              <div key={index} style={{ color: `${theme.textColor || '#ffffff'}cc` }} className="markdown-body max-w-none text-left">
                <ReactMarkdown>{profile.bio}</ReactMarkdown>
              </div>
            );
          case 'socials':
            return (
              <div key={index} className="flex flex-wrap justify-center gap-4">
                {JSON.parse(profile.socials).map((link: any, i: number) => (
                  <SocialIcon key={i} link={link} accentColor={accentColor} profileId={profile.id} />
                ))}
              </div>
            );
          case 'presence':
            return presence && presence.activities && presence.activities.length > 0 && (
              <div key={index} className="w-full space-y-4">
                <p style={{ color: `${theme.textColor || '#ffffff'}66` }} className="text-xs font-bold uppercase tracking-widest text-left px-2">Activities</p>
                {presence.activities.map((activity: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {activity.assets?.largeImage ? (
                         <img 
                          src={activity.assets.largeImage.startsWith('mp:external') ? activity.assets.largeImage.split('https/')[1] : `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.largeImage}.png`} 
                          className="w-full h-full object-cover"
                         />
                      ) : (
                         <Music className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="font-bold text-sm truncate">{activity.name}</p>
                      <p style={{ color: `${theme.textColor || '#ffffff'}99` }} className="text-xs truncate">{activity.details || activity.state}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          case 'spotify':
            return spotify && (
               <div key={index} style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }} className="w-full border p-4 rounded-xl flex items-center gap-4">
                  <img src={spotify.albumArt} className="w-12 h-12 rounded shadow-lg" />
                  <div className="flex-1 text-left overflow-hidden">
                     <p style={{ color: accentColor }} className="text-[10px] font-bold uppercase tracking-widest">{spotify.isPlaying ? 'Listening to Spotify' : 'Recently Played'}</p>
                     <p className="font-bold text-sm truncate">{spotify.name}</p>
                     <p style={{ color: `${theme.textColor || '#ffffff'}99` }} className="text-xs truncate">{spotify.artist}</p>
                  </div>
               </div>
            );
          case 'guestbook':
            return (
              <div key={index} className="w-full text-left pt-8">
                <h4 style={{ color: `${theme.textColor || '#ffffff'}66` }} className="text-xs font-bold uppercase tracking-widest mb-6">Guestbook</h4>
                <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                   {messages.map((m: any, i: number) => (
                      <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{m.authorName}</span>
                            <span className="text-[10px] opacity-20">{new Date(m.createdAt).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs opacity-60 leading-relaxed">{m.message}</p>
                      </div>
                   ))}
                   {messages.length === 0 && <p className="text-center opacity-20 py-8 italic text-xs">No messages yet...</p>}
                </div>
                <div className="flex flex-col gap-2">
                   <input 
                      placeholder="Your Name" 
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-white/20"
                      value={newMsg.author}
                      onChange={(e) => setNewMsg({...newMsg, author: e.target.value})}
                   />
                   <textarea 
                      placeholder="Leave a message..." 
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-white/20 resize-none h-20"
                      value={newMsg.text}
                      onChange={(e) => setNewMsg({...newMsg, text: e.target.value})}
                   />
                   <button 
                      onClick={handleSendGuestbook}
                      className="w-full py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-white/80 transition-all uppercase tracking-widest"
                   >Post Message</button>
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [presence, setPresence] = useState<any>(null);
  const [spotify, setSpotify] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState({ author: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/u/${username}`);
        if (!res.ok) throw new Error('Profile not found');
        const data = await res.json();
        const theme = typeof data.theme === 'string' ? JSON.parse(data.theme || '{}') : (data.theme || {});
        setProfile({ ...data, theme });
        setPresence(data.presence);
        setSpotify(data.spotify);
        
        // Fetch Badges
        const bRes = await fetch(`/api/badges/${data.userId}`);
        if (bRes.ok) setBadges(await bRes.ok ? await bRes.json() : []);

        // Fetch Guestbook
        const gRes = await fetch(`/api/guestbook/${data.id}`);
        if (gRes.ok) setMessages(await gRes.json());
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile) return;

    const socket = io();
    socket.emit('subscribe', profile.discordId);

    socket.on('presence', (p) => setPresence(p));
    socket.on('spotify', (s) => setSpotify(s));

    return () => {
      socket.disconnect();
    };
  }, [profile]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-white">{error}</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  const theme = profile.theme || {};
  const accentColor = theme.accentColor || '#6366f1';

  const handleSendGuestbook = async () => {
    if (!newMsg.author || !newMsg.text) return;
    const res = await fetch(`/api/guestbook/${profile.id}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ authorName: newMsg.author, message: newMsg.text })
    });
    if (res.ok) {
       setMessages([{ authorName: newMsg.author, message: newMsg.text, createdAt: Date.now() }, ...messages]);
       setNewMsg({ author: '', text: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ 
        fontFamily: theme.fontFamily || 'inherit',
        color: theme.textColor || '#ffffff',
        background: profile.backgroundType === 'gradient' ? profile.backgroundValue : (theme.backgroundColor || 'black'),
        backgroundImage: profile.backgroundType === 'image' ? `url(${profile.backgroundValue})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Media */}
      {profile.backgroundType === 'video' && (
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={profile.backgroundValue}
        />
      )}
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[1]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ borderColor: `${accentColor}20` }}
        className="relative z-10 w-full max-w-lg bg-black/60 border backdrop-blur-xl rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar with Status */}
          <div className="relative mb-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              style={{ borderColor: `${accentColor}40` }}
              className="w-32 h-32 rounded-full border-4 overflow-hidden shadow-xl"
            >
              <img 
                src={profile.pfpOverride || `https://cdn.discordapp.com/avatars/${profile.discordId}/${profile.avatar}.png?size=256`} 
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {presence && (
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-black ${getStatusColor(presence.status)}`} />
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2 tracking-tight">{profile.displayName}</h1>
          <p style={{ color: `${theme.textColor || '#ffffff'}99` }} className="mb-6 font-mono text-sm tracking-widest uppercase">@{profile.customUsername}</p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
             {badges.map(b => (
                <div key={b.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md flex items-center gap-2 group cursor-help relative">
                   <img src={b.icon} className="w-4 h-4" alt={b.name} />
                   <span className="text-[10px] font-bold uppercase tracking-tight">{b.name}</span>
                </div>
             ))}
          </div>

          <LayoutRenderer profile={profile} theme={theme} accentColor={accentColor} presence={presence} spotify={spotify} messages={messages} newMsg={newMsg} setNewMsg={setNewMsg} handleSendGuestbook={handleSendGuestbook} />
        </div>
      </motion.div>

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
>
        <div style={{ backgroundColor: `${accentColor}15` }} className="absolute top-[10%] left-[20%] w-64 h-64 rounded-full blur-[100px]" />
        <div style={{ backgroundColor: `${accentColor}10` }} className="absolute bottom-[10%] right-[20%] w-96 h-96 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

function SocialIcon({ link, accentColor, profileId }: { link: any, accentColor: string, profileId: string }) {
  const icons: Record<string, any> = {
    discord: Music, // Placeholder
    github: Github,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
    spotify: Music,
    website: Globe
  };

  const Icon = icons[link.platform.toLowerCase()] || ExternalLink;

  return (
    <motion.a
      whileHover={{ y: -5, scale: 1.1, backgroundColor: '#ffffff', color: '#000000' }}
      href={`/api/click/${profileId}?platform=${link.platform}&url=${encodeURIComponent(link.url)}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
      className="w-10 h-10 flex items-center justify-center border rounded-full transition-colors"
    >
      <Icon className="w-5 h-5" />
    </motion.a>
  );
}
