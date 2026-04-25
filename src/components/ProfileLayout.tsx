import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Github, Twitter, Youtube, Instagram, Music, ExternalLink, Globe } from 'lucide-react';

export function SocialIcon({ link, accentColor, profileId }: { link: any, accentColor: string, profileId: string }) {
  const icons: Record<string, any> = {
    discord: Music,
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

export function ProfileLayout({ profile, theme, accentColor, presence, spotify, messages, newMsg, setNewMsg, handleSendGuestbook, isPreview = false }: any) {
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
            const socials = typeof profile.socials === 'string' ? JSON.parse(profile.socials || '[]') : (profile.socials || []);
            return (
              <div key={index} className="flex flex-wrap justify-center gap-4">
                {socials.map((link: any, i: number) => (
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
            if (isPreview) return null;
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
