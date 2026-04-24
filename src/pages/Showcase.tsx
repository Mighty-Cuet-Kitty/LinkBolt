import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function ShowcasePage() {
  const templates = [
    {
      name: 'Cyber Neon',
      description: 'A dark, high-contrast theme for the tech-focused creator.',
      theme: { backgroundColor: '#050505', textColor: '#ffffff', accentColor: '#ff00ff', fontFamily: 'JetBrains Mono, monospace' },
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(45deg, #0f0c29, #302b63, #24243e)'
    },
    {
      name: 'Minimalist Frost',
      description: 'Clean, light, and airy. Perfect for a professional presence.',
      theme: { backgroundColor: '#ffffff', textColor: '#1a1a1a', accentColor: '#3b82f6', fontFamily: 'Inter, sans-serif' },
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)'
    },
    {
      name: 'Synthwave Strike',
      description: 'Retro-future vibes with animated video backgrounds.',
      theme: { backgroundColor: '#120458', textColor: '#ff71ce', accentColor: '#01cdfe', fontFamily: 'Outfit, sans-serif' },
      backgroundType: 'video',
      backgroundValue: 'https://v1.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4'
    },
    {
       name: 'Emerald Forest',
       description: 'Deep greens and organic textures for a grounded look.',
       theme: { backgroundColor: '#064e3b', textColor: '#ecfdf5', accentColor: '#10b981', fontFamily: 'Playfair Display, serif' },
       backgroundType: 'gradient',
       backgroundValue: 'radial-gradient(circle at center, #064e3b, #022c22)'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <Link to="/" className="text-white/40 hover:text-white transition-colors mb-8 inline-block font-mono text-xs tracking-widest uppercase">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
             <Sparkles className="w-8 h-8 text-yellow-400" />
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter">THE SHOWCASE</h1>
          </div>
          <p className="text-xl text-white/40 max-w-2xl">
            Explore the diversity of LinkBolt profiles. From minimalist portfolios to high-energy social hubs.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {templates.map((tpl, i) => (
            <motion.div 
              key={tpl.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div 
                className="aspect-video w-full rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl mb-6"
                style={{
                  background: tpl.backgroundType === 'gradient' ? tpl.backgroundValue : (tpl.theme.backgroundColor || 'black'),
                  backgroundImage: tpl.backgroundType === 'image' ? `url(${tpl.backgroundValue})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                 {tpl.backgroundType === 'video' && (
                    <video src={tpl.backgroundValue} autoPlay muted loop className="w-full h-full object-cover" />
                 )}
                 <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                       <ArrowRight className="w-8 h-8" />
                    </div>
                 </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{tpl.name}</h3>
              <p className="text-white/40 mb-4">{tpl.description}</p>
              <div className="flex gap-2">
                 <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {tpl.theme.fontFamily.split(',')[0]}
                 </span>
                 <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {tpl.backgroundType}
                 </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 p-12 rounded-[3rem] bg-indigo-600 flex flex-col items-center text-center">
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">READY TO BUILD YOURS?</h2>
           <button 
              onClick={() => {
                fetch('/api/auth/discord/url')
                  .then(r => r.json())
                  .then(data => {
                    window.open(data.url, 'discord-auth', 'width=600,height=800');
                  });
              }}
              className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-black hover:text-white transition-all transform hover:scale-105"
           >
              CLAIM YOUR USERNAME
           </button>
        </div>
      </div>
    </div>
  );
}
