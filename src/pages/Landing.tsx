import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Sparkles, ZapIcon } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[160px] -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>The most powerful bio-link platform</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter max-w-4xl mx-auto leading-[0.9]">
            YOUR LINK, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">YOUR IDENTITY.</span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto font-medium">
            LinkBolt lets you create stunning, real-time social profiles. Showcase your Discord presence, Spotify jams, and more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => {
                fetch('/api/auth/discord/url')
                  .then(r => r.json())
                  .then(data => {
                    window.location.href = data.url;
                  });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95"
            >
              Get Started Now
            </button>
            <Link to="/showcase" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-all">
              View Showcase
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Grid of Features */}
      <div className="max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Zap className="w-8 h-8 text-yellow-400" />}
          title="Real-Time Sync"
          description="Your profile reflects your current Discord status and Spotify playback instantly via WebSockets."
        />
        <FeatureCard 
          icon={<Sparkles className="w-8 h-8 text-purple-400" />}
          title="Infinite Customization"
          description="Gradients, videos, custom fonts, and an advanced theme builder to make your page uniquely yours."
        />
        <FeatureCard 
          icon={<Shield className="w-8 h-8 text-blue-400" />}
          title="Secure & Scalable"
          description="Encrypted tokens, rate-limited APIs, and a robust backend built for performance."
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 text-center text-white/20 text-xs font-mono tracking-widest uppercase">
        © 2026 LinkBolt — All Rights Reserved
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-8 bg-white/5 border border-white/10 rounded-3xl"
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-white/40 leading-relaxed">{description}</p>
    </motion.div>
  );
}
