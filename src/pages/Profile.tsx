import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ProfileLayout } from '../components/ProfileLayout';

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
        if (bRes.ok) setBadges(await bRes.json());

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

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 text-center">
      <h1 className="text-6xl font-black mb-4">404</h1>
      <p className="text-white/40 font-mono tracking-widest uppercase">{error}</p>
      <a href="/" className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-xl">Go Home</a>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono uppercase tracking-[0.3em] text-xs">
      Initialising LinkBolt...
    </div>
  );

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
      className="min-h-screen relative flex items-center justify-center p-4 overflow-x-hidden"
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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ borderColor: `${accentColor}20` }}
        className="relative z-10 w-full max-w-lg bg-black/60 border backdrop-blur-xl rounded-2xl p-8 shadow-2xl my-8"
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

          <ProfileLayout 
            profile={profile} 
            theme={theme} 
            accentColor={accentColor} 
            presence={presence} 
            spotify={spotify} 
            messages={messages} 
            newMsg={newMsg} 
            setNewMsg={setNewMsg} 
            handleSendGuestbook={handleSendGuestbook} 
          />
        </div>

        {/* Ambient Glows */}
        <div style={{ backgroundColor: `${accentColor}15` }} className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full blur-[100px] -z-10" />
        <div style={{ backgroundColor: `${accentColor}10` }} className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[120px] -z-10" />
      </motion.div>
    </div>
  );
}
