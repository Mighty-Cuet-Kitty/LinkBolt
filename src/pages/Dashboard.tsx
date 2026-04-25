import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Layout, Palette, User as UserIcon, LogOut, Save, Plus, Trash2, Sparkles, Music, Upload, BarChart3, Shield, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [lastfmUser, setLastfmUser] = useState('');
  const [moderationMsgs, setModerationMsgs] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchProfiles = async () => {
    const res = await fetch('/api/profiles');
    if (res.ok) {
      const data = await res.json();
      setAllProfiles(data.map((p: any) => ({
        ...p,
        socials: JSON.parse(p.socials || '[]'),
        layout: JSON.parse(p.layout || '{}'),
        theme: JSON.parse(p.theme || '{}')
      })));
    }
  };

  const fetchAnalytics = async (profileId: string) => {
    const res = await fetch(`/api/analytics/${profileId}`);
    if (res.ok) {
      const data = await res.json();
      setAnalytics(data.reverse());
    }
  };

  const fetchIntegrations = async () => {
    const res = await fetch('/api/integrations');
    if (res.ok) {
       const data = await res.json();
       setIntegrations(data);
       const lfm = data.find((i: any) => i.platform === 'lastfm');
       if (lfm) setLastfmUser(lfm.lastFmUsername || '');
    }
  };

  const fetchModeration = async (profileId: string) => {
     const res = await fetch(`/api/guestbook-admin/${profileId}`);
     if (res.ok) setModerationMsgs(await res.json());
  };

  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    const res = await fetch(`/api/integrations/${platform}`, { method: 'DELETE' });
    if (res.ok) {
       fetchIntegrations();
       if (platform === 'lastfm') setLastfmUser('');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error();
        const userData = await res.json();
        setUser(userData);
        
        await fetchProfiles();
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (allProfiles.length > 0 && !profile) {
      const defaultProfile = allProfiles.find(p => p.isDefault) || allProfiles[0];
      setProfile(defaultProfile);
      fetchAnalytics(defaultProfile.id);
    }
  }, [allProfiles, profile]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        alert('Profile saved successfully!');
      } else {
        alert('Failed to save profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'backgroundValue' | 'pfpOverride') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setProfile({ ...profile, [target]: data.url });
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const connectSpotify = async () => {
     const res = await fetch('/api/auth/spotify/url');
     const data = await res.json();
     window.open(data.url, 'spotify-auth', 'width=600,height=700');
  };

  useEffect(() => {
     const handler = (e: MessageEvent) => {
        if (e.data.type === 'SPOTIFY_AUTH_SUCCESS') {
           alert('Spotify Connected!');
        }
     };
     window.addEventListener('message', handler);
     return () => window.removeEventListener('message', handler);
  }, []);

  const fonts = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
    { name: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
    { name: 'Outfit', value: 'Outfit, sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' }
  ];

  const templates = [
    {
      name: 'Cyber Neon',
      theme: { backgroundColor: '#050505', textColor: '#ffffff', accentColor: '#ff00ff', fontFamily: 'JetBrains Mono, monospace' },
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(45deg, #0f0c29, #302b63, #24243e)'
    },
    {
      name: 'Minimalist Frost',
      theme: { backgroundColor: '#ffffff', textColor: '#1a1a1a', accentColor: '#3b82f6', fontFamily: 'Inter, sans-serif' },
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)'
    },
    {
      name: 'Synthwave',
      theme: { backgroundColor: '#120458', textColor: '#ff71ce', accentColor: '#01cdfe', fontFamily: 'Outfit, sans-serif' },
      backgroundType: 'video',
      backgroundValue: 'https://v1.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4'
    },
    {
      name: 'Editorial Slate',
      theme: { backgroundColor: '#1a1a1a', textColor: '#f4f4f4', accentColor: '#d4af37', fontFamily: 'Playfair Display, serif' },
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%)'
    }
  ];

  const handleApplyTemplate = (tpl: any) => {
    setProfile({
      ...profile,
      theme: tpl.theme,
      backgroundType: tpl.backgroundType,
      backgroundValue: tpl.backgroundValue
    });
    alert(`Applied ${tpl.name} template! Remember to save.`);
  };

  const handleCreateProfile = async () => {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'New Profile' })
    });
    if (res.ok) {
      await fetchProfiles();
      setActiveTab('profile');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-4 bg-black/50">
        <div className="mb-12 px-4 flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <LinkBoltLogo />
           </div>
           <span className="font-black text-xl tracking-tighter">LINKBOLT</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon className="w-5 h-5" />} label="My Profile" />
          <SidebarItem active={activeTab === 'theme'} onClick={() => setActiveTab('theme')} icon={<Palette className="w-5 h-5" />} label="Theme Builder" />
          <SidebarItem active={activeTab === 'widgets'} onClick={() => setActiveTab('widgets')} icon={<Layout className="w-5 h-5" />} label="Widget Deck" />
          <SidebarItem active={activeTab === 'integrations'} onClick={() => { setActiveTab('integrations'); fetchIntegrations(); }} icon={<Music className="w-5 h-5" />} label="Integrations" />
          <SidebarItem active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); fetchAnalytics(profile.id); }} icon={<BarChart3 className="w-5 h-5" />} label="Insights" />
          <SidebarItem active={activeTab === 'moderation'} onClick={() => { setActiveTab('moderation'); fetchModeration(profile.id); }} icon={<Shield className="w-5 h-5" />} label="Moderation" />
          <SidebarItem active={activeTab === 'showcase'} onClick={() => setActiveTab('showcase')} icon={<Sparkles className="w-5 h-5 text-yellow-400" />} label="Showcase" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-5 h-5" />} label="Account Settings" />
        </nav>

        <div className="mt-8 border-t border-white/5 pt-8">
           <p className="px-4 text-[10px] font-black uppercase text-white/20 tracking-widest mb-4">Saved Profiles</p>
           <div className="space-y-1">
              {allProfiles.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setProfile(p)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm rounded-lg transition-all",
                    profile?.id === p.id ? "bg-white/10 text-white font-bold" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {p.displayName}
                </button>
              ))}
              <button 
                onClick={handleCreateProfile}
                className="w-full text-left px-4 py-2 text-xs text-indigo-400 hover:text-indigo-300 transition-all font-bold flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> New Profile
              </button>
           </div>
        </div>

        <button className="flex items-center gap-3 p-4 text-white/40 hover:text-red-400 transition-colors mt-auto">
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm uppercase tracking-widest">Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">
              {activeTab === 'profile' && 'Edit Your Identity'}
              {activeTab === 'theme' && 'Visual Aesthetics'}
              {activeTab === 'widgets' && 'Modular Layout'}
              {activeTab === 'integrations' && 'Connected Apps'}
              {activeTab === 'analytics' && 'Profile Intelligence'}
              {activeTab === 'moderation' && 'Guestbook Control'}
              {activeTab === 'showcase' && 'Template Showcase'}
              {activeTab === 'settings' && 'Account Controls'}
            </h2>
            <p className="text-white/40 text-sm font-medium">Configure how the world sees you.</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-white/5"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </motion.button>
        </header>

        {activeTab === 'profile' && profile && (
          <div className="max-w-3xl space-y-8">
            <Section title="General Information">
              <div className="grid grid-cols-2 gap-8">
                <Input label="Display Name" value={profile.displayName} onChange={(e: any) => setProfile({...profile, displayName: e.target.value})} />
                <Input label="Custom URL" value={profile.customUsername} onChange={(e: any) => setProfile({...profile, customUsername: e.target.value})} prefix="linkbolt.app/u/" />
              </div>
              <Textarea label="Biography (Markdown Supported)" value={profile.bio} onChange={(e: any) => setProfile({...profile, bio: e.target.value})} />
            </Section>

            <Section title="Social Presence">
               <div className="space-y-4">
                  {profile.socials.map((social: any, i: number) => (
                    <div key={i} className="flex gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                       <Input label="Platform" value={social.platform} onChange={(e: any) => {
                         const newsocials = [...profile.socials];
                         newsocials[i].platform = e.target.value;
                         setProfile({...profile, socials: newsocials});
                       }} containerClass="flex-1" />
                       <Input label="URL" value={social.url} onChange={(e: any) => {
                         const newsocials = [...profile.socials];
                         newsocials[i].url = e.target.value;
                         setProfile({...profile, socials: newsocials});
                       }} containerClass="flex-[2]" />
                       <button onClick={() => {
                         const newsocials = profile.socials.filter((_: any, idx: number) => idx !== i);
                         setProfile({...profile, socials: newsocials});
                       }} className="mb-2 p-2 text-white/40 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setProfile({...profile, socials: [...profile.socials, { platform: 'Website', url: '' }]})}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-white/20 hover:border-white/20 hover:text-white/40 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs"
                  >
                     <Plus className="w-4 h-4" /> Add Social Link
                  </button>
               </div>
            </Section>
          </div>
        )}

        {activeTab === 'theme' && profile && (
           <div className="max-w-3xl space-y-12">
              {/* Live Theme Preview Card */}
              <div 
                className="p-12 rounded-3xl border border-white/10 relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500"
                style={{
                  fontFamily: profile.theme.fontFamily || 'inherit',
                  color: profile.theme.textColor || '#ffffff',
                  background: profile.backgroundType === 'gradient' ? profile.backgroundValue : (profile.theme.backgroundColor || '#000000'),
                  backgroundImage: profile.backgroundType === 'image' ? `url(${profile.backgroundValue})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Live Video Preview */}
                {profile.backgroundType === 'video' && (
                  <video 
                    autoPlay 
                    muted 
                    loop 
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
                    src={profile.backgroundValue}
                  />
                )}
                
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-[1]" />
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div 
                    layoutId="preview-avatar"
                    className="w-24 h-24 rounded-full mb-6 border-4 shadow-xl"
                    style={{ borderColor: `${profile.theme.accentColor || '#6366f1'}40` }}
                  >
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.avatar}.png`} 
                      className="w-full h-full rounded-full object-cover" 
                      alt="Avatar"
                    />
                  </motion.div>
                  <h4 className="text-3xl font-bold tracking-tight mb-2">{profile.displayName}</h4>
                  <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-50 mb-6">@{profile.customUsername}</p>
                  
                  <div className="flex gap-3">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-full border flex items-center justify-center bg-white/5 transition-colors"
                        style={{ borderColor: `${profile.theme.accentColor || '#6366f1'}20` }}
                      >
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: i === 1 ? (profile.theme.accentColor || '#6366f1') : 'transparent' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Section title="Typography">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Font Family</label>
                       <select 
                        value={profile.theme.fontFamily || 'Inter, sans-serif'}
                        onChange={(e) => setProfile({...profile, theme: { ...profile.theme, fontFamily: e.target.value }})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all appearance-none"
                       >
                          {fonts.map(f => (
                            <option key={f.value} value={f.value} className="bg-black text-white">{f.name}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              </Section>

              <Section title="Colors">
                 <div className="grid grid-cols-3 gap-8">
                    <ColorInput 
                      label="Text Color" 
                      value={profile.theme.textColor || '#ffffff'} 
                      onChange={(val) => setProfile({...profile, theme: { ...profile.theme, textColor: val }})} 
                    />
                    <ColorInput 
                      label="Accent Color" 
                      value={profile.theme.accentColor || '#6366f1'} 
                      onChange={(val) => setProfile({...profile, theme: { ...profile.theme, accentColor: val }})} 
                    />
                    <ColorInput 
                      label="Background Color" 
                      value={profile.theme.backgroundColor || '#000000'} 
                      onChange={(val) => setProfile({...profile, theme: { ...profile.theme, backgroundColor: val }})} 
                    />
                 </div>
              </Section>

              <Section title="Background Stage">
                 <div className="space-y-4">
                    <div className="flex gap-4">
                       <button 
                        onClick={() => setProfile({...profile, backgroundType: 'gradient'})}
                        className={cn("px-6 py-3 rounded-xl font-bold text-sm", profile.backgroundType === 'gradient' ? "bg-white text-black" : "bg-white/5 text-white/40")}
                       >Gradient</button>
                       <button 
                        onClick={() => setProfile({...profile, backgroundType: 'image'})}
                        className={cn("px-6 py-3 rounded-xl font-bold text-sm", profile.backgroundType === 'image' ? "bg-white text-black" : "bg-white/5 text-white/40")}
                       >Image</button>
                       <button 
                        onClick={() => setProfile({...profile, backgroundType: 'video'})}
                        className={cn("px-6 py-3 rounded-xl font-bold text-sm", profile.backgroundType === 'video' ? "bg-white text-black" : "bg-white/5 text-white/40")}
                       >Video</button>
                    </div>
                    
                    <div className="flex gap-4">
                      <Input 
                        label={profile.backgroundType === 'gradient' ? "Gradient Value (CSS)" : (profile.backgroundType === 'video' ? "Video URL (MP4)" : "Image URL")} 
                        value={profile.backgroundValue} 
                        onChange={(e: any) => setProfile({...profile, backgroundValue: e.target.value})} 
                        containerClass="flex-1"
                      />
                      {(profile.backgroundType === 'image' || profile.backgroundType === 'video') && (
                        <div className="flex flex-col justify-end">
                           <label className="cursor-pointer bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 h-[50px] flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase">Upload</span>
                              <input type="file" className="hidden" accept={profile.backgroundType === 'video' ? 'video/mp4' : 'image/*'} onChange={(e) => handleFileUpload(e, 'backgroundValue')} />
                           </label>
                        </div>
                      )}
                    </div>
                 </div>
              </Section>
           </div>
        )}

        {activeTab === 'widgets' && profile && (
          <div className="max-w-xl space-y-8">
            <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-8">
               <p className="text-sm text-indigo-300 font-medium leading-relaxed">
                  Arrange your profile modules. LinkBolt uses a modular approach—toggle visibility and drag to prioritize what others see first.
               </p>
            </div>

            <div className="space-y-4">
              {(typeof profile.layout === 'string' ? JSON.parse(profile.layout || '{"widgets": ["bio", "socials", "presence", "spotify", "guestbook"]}').widgets : profile.layout?.widgets || ['bio', 'socials', 'presence', 'spotify', 'guestbook']).map((wId: string, idx: number, arr: string[]) => (
                <div key={wId} className="group p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/[0.07] transition-all">
                   <div className="flex items-center gap-4">
                      <div className="text-white/20 group-hover:text-white/40">
                         <GripVertical className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="font-bold capitalize text-sm">{wId}</h4>
                         <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Base Module</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                           const newWidgets = [...arr];
                           if (idx > 0) {
                              [newWidgets[idx], newWidgets[idx - 1]] = [newWidgets[idx - 1], newWidgets[idx]];
                              setProfile({...profile, layout: { ...profile.layout, widgets: newWidgets }});
                           }
                        }}
                        disabled={idx === 0}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 disabled:opacity-0 transition-opacity"
                      >
                         <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                           const newWidgets = [...arr];
                           if (idx < arr.length - 1) {
                              [newWidgets[idx], newWidgets[idx + 1]] = [newWidgets[idx + 1], newWidgets[idx]];
                              setProfile({...profile, layout: { ...profile.layout, widgets: newWidgets }});
                           }
                        }}
                        disabled={idx === arr.length - 1}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 disabled:opacity-0 transition-opacity"
                      >
                         <ArrowDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const newWidgets = arr.filter(w => w !== wId);
                          setProfile({...profile, layout: { ...profile.layout, widgets: newWidgets }});
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400"
                      >
                         <EyeOff className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
              
              <div className="pt-8 border-t border-white/5">
                 <h5 className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Add More Modules</h5>
                 <div className="flex flex-wrap gap-2">
                    {['bio', 'socials', 'presence', 'spotify', 'guestbook'].filter(w => !(typeof profile.layout === 'string' ? JSON.parse(profile.layout || '{}').widgets : profile.layout?.widgets || []).includes(w)).map(w => (
                       <button 
                        key={w}
                        onClick={() => {
                           const current = typeof profile.layout === 'string' ? JSON.parse(profile.layout || '{}').widgets : profile.layout?.widgets || [];
                           setProfile({...profile, layout: { ...profile.layout, widgets: [...current, w] }});
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold capitalize flex items-center gap-2"
                       >
                          <Plus className="w-3 h-3" /> {w}
                       </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="max-w-xl space-y-8">
            <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                     <Music className="w-6 h-6 text-black" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold">Spotify</h3>
                     <p className="text-sm text-white/40">
                        {integrations.find(i => i.platform === 'spotify') ? 'Connected' : 'Show what you\'re currently listening to.'}
                     </p>
                  </div>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={connectSpotify}
                  className="px-6 py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition-all text-xs"
                 >
                   {integrations.find(i => i.platform === 'spotify') ? 'Reconnect' : 'Connect'}
                 </button>
                 {integrations.find(i => i.platform === 'spotify') && (
                   <button 
                    onClick={() => disconnectPlatform('spotify')}
                    className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 )}
               </div>
            </div>

            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                     <Music className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-xl font-bold">Last.fm</h3>
                     <input 
                      type="text" 
                      placeholder="Username" 
                      value={lastfmUser}
                      onChange={(e) => setLastfmUser(e.target.value)}
                      className="bg-transparent border-b border-white/20 focus:border-white focus:outline-none text-sm py-1 w-full"
                     />
                  </div>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={async () => {
                    const res = await fetch('/api/integrations/lastfm', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: lastfmUser })
                    });
                    if (res.ok) fetchIntegrations();
                  }}
                  className="px-6 py-3 bg-red-500 text-black font-black rounded-xl hover:bg-red-400 transition-all text-xs"
                 >Save</button>
                 {integrations.find(i => i.platform === 'lastfm') && (
                   <button 
                    onClick={() => disconnectPlatform('lastfm')}
                    className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            {moderationMsgs.map((m: any) => (
              <div key={m.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">{m.authorName}</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                      m.status === 'approved' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-500"
                    )}>{m.status}</span>
                  </div>
                  <p className="text-white/60 mb-1">{m.message}</p>
                  <p className="text-[10px] text-white/20 font-mono">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {m.status !== 'approved' && (
                    <button 
                      onClick={async () => {
                        await fetch('/api/guestbook/moderate', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messageId: m.id, status: 'approved' })
                        });
                        fetchModeration(profile.id);
                      }}
                      className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg text-sm"
                    >Approve</button>
                  )}
                  <button 
                    onClick={async () => {
                        await fetch('/api/guestbook/moderate', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messageId: m.id, status: 'deleted' })
                        });
                        fetchModeration(profile.id);
                      }}
                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-lg text-sm"
                  >Delete</button>
                </div>
              </div>
            ))}
            {moderationMsgs.length === 0 && <p className="text-center py-24 text-white/20 font-bold uppercase tracking-widest">No messages to moderate.</p>}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-12">
            <div className="grid grid-cols-3 gap-6">
               <StatCard label="Total Views" value={analytics.reduce((acc, curr) => acc + curr.views, 0)} />
               <StatCard label="Unique Visitors" value={Math.floor(analytics.reduce((acc, curr) => acc + curr.views, 0) * 0.7)} />
               <StatCard label="Avg. Stay" value="2:45m" />
            </div>

            <div className="h-[400px] w-full bg-white/5 border border-white/10 rounded-3xl p-8">
               <h3 className="text-sm font-black uppercase tracking-widest text-white/20 mb-8">Views Over Time</h3>
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics}>
                    <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10' }} />
                    <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'showcase' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map(tpl => (
              <motion.div 
                key={tpl.name}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => handleApplyTemplate(tpl)}
              >
                <div 
                  className="aspect-video rounded-2xl mb-4 border border-white/10 overflow-hidden relative"
                  style={{
                    background: tpl.backgroundType === 'gradient' ? tpl.backgroundValue : (tpl.theme.backgroundColor || 'black'),
                    backgroundImage: tpl.backgroundType === 'image' ? `url(${tpl.backgroundValue})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                   {tpl.backgroundType === 'video' && <video src={tpl.backgroundValue} muted autoPlay loop className="w-full h-full object-cover" />}
                   <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 font-black text-xs tracking-widest uppercase">
                      Apply Template
                   </div>
                </div>
                <h4 className="font-bold text-lg">{tpl.name}</h4>
                <p className="text-white/40 text-xs font-mono">{tpl.theme.fontFamily.split(',')[0]}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Live Preview Pane */}
      <div className="w-[450px] border-l border-white/5 bg-[#050505] hidden xl:flex flex-col">
         <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Preview</span>
            <Link to={`/u/${profile?.customUsername}`} target="_blank" className="text-white/40 hover:text-white"><ExternalLinkSmall /></Link>
         </div>
         <div className="flex-1 p-8">
            {/* Mock Iframe viewport */}
            <div className="w-full h-full rounded-[2.5rem] border-[8px] border-[#1a1a1a] bg-black overflow-hidden shadow-2xl relative">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />
               <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 mb-4 border border-white/20 overflow-hidden">
                     <img src={`https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.avatar}.png`} className="w-full h-full object-cover" />
                  </div>
                  <div className="h-4 w-32 bg-white/20 rounded-full mb-2" />
                  <div className="h-3 w-48 bg-white/10 rounded-full mb-6" />
                  <div className="space-y-2 w-full">
                     <div className="h-10 w-full bg-white/5 border border-white/10 rounded-lg" />
                     <div className="h-10 w-full bg-white/5 border border-white/10 rounded-lg" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: any }) {
  return (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
      <p className="text-xs font-black uppercase tracking-widest text-white/20 mb-2">{label}</p>
      <h4 className="text-4xl font-black">{value}</h4>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm tracking-tight",
        active ? "bg-white text-black shadow-lg shadow-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("w-5 h-5", active ? "text-black" : "text-white/20")}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, prefix, containerClass }: any) {
  return (
    <div className={cn("space-y-2", containerClass)}>
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
      <div className="relative">
        {prefix && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-mono text-sm">{prefix}</div>}
        <input 
          type="text" 
          value={value} 
          onChange={onChange}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all font-medium",
            prefix && "pl-32"
          )}
        />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
      <textarea 
        value={value} 
        onChange={onChange}
        rows={6}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-all font-medium resize-none"
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
      <div className="flex gap-3">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
        />
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-white/30"
        />
      </div>
    </div>
  );
}

function LinkBoltLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ExternalLinkSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
