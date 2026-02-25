import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Activity, Trophy, Download } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden font-sans italic selection:bg-orange-500/30">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <main className="relative z-10 flex flex-col items-center max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-10 mt-16 md:mt-24 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">No VR headset. Just your phone.</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.8] uppercase"
          >
            POCKET YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">PHONE.</span><br />
            PLAY THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">GYM.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl text-white/50 max-w-2xl font-bold uppercase tracking-widest leading-relaxed"
          >
            Cast pktgym to your TV. Scan the QR code. Put your phone in your pocket. The browser is now your motion-tracking console.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-8"
          >
            <Link to="/play" className="group relative inline-flex items-center gap-6 px-12 py-6 bg-orange-500 hover:bg-orange-400 text-white rounded-[3rem] font-bold uppercase tracking-[0.4em] text-lg transition-all duration-500 shadow-[0_0_80px_rgba(249,115,22,0.4)] hover:shadow-[0_0_120px_rgba(249,115,22,0.6)] hover:-translate-y-2">
              <span>Initiate Protocol</span>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                <Zap className="w-6 h-6 fill-white" />
              </div>
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-40">
          {[
            {
              icon: Smartphone,
              title: 'Zero Friction',
              desc: 'Why buy a $500 VR headset when your phone already has a 6-axis gyroscope? Just sync via QR and sweat.',
              color: 'text-orange-500',
              bg: 'bg-orange-500/10',
              border: 'border-orange-500/20'
            },
            {
              icon: Activity,
              title: 'Peer-to-Peer WebRTC',
              desc: 'Sub-10ms latency. Your motion data routes locally directly to your screen. No servers. Total privacy.',
              color: 'text-purple-500',
              bg: 'bg-purple-500/10',
              border: 'border-purple-500/20'
            },
            {
              icon: Trophy,
              title: 'Arcade Fitness',
              desc: 'Shadow boxing, squat jumps, and reflex evasion. We gamified the workout so you forget the burn.',
              color: 'text-blue-500',
              bg: 'bg-blue-500/10',
              border: 'border-blue-500/20'
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-start p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-sm hover:bg-white/[0.08] transition-colors group"
            >
              <div className={`p-5 rounded-[2rem] mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 ${feature.bg} ${feature.border} border`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-3xl font-bold uppercase tracking-tight mb-4">{feature.title}</h3>
              <p className="text-white/50 font-bold uppercase tracking-widest text-xs leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>
        
        {/* How it Works */}
        <section className="mt-40 w-full flex flex-col items-center text-center">
           <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-20">The <span className="text-orange-500">Setup</span></h2>
           
           <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-5xl justify-between">
              <div className="flex-1 flex flex-col items-center gap-6">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-bold text-white/30">1</div>
                 <p className="text-xl font-bold uppercase tracking-widest">Open on big screen</p>
                 <p className="text-xs text-white/40 uppercase tracking-widest font-bold">TV, Laptop, or Tablet</p>
              </div>
              <div className="w-8 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent hidden md:block" />
              <div className="flex-1 flex flex-col items-center gap-6">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-bold text-white/30">2</div>
                 <p className="text-xl font-bold uppercase tracking-widest">Scan the QR code</p>
                 <p className="text-xs text-white/40 uppercase tracking-widest font-bold">With your smartphone</p>
              </div>
              <div className="w-8 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent hidden md:block" />
              <div className="flex-1 flex flex-col items-center gap-6">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl font-bold text-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]">3</div>
                 <p className="text-xl font-bold uppercase tracking-widest text-orange-500">Pocket & Play</p>
                 <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Start throwing punches</p>
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="mt-40 w-full">
          <div className="relative bg-gradient-to-br from-orange-600/20 to-purple-600/20 border border-white/10 rounded-[4rem] p-16 md:p-24 text-center overflow-hidden flex flex-col items-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-10 mix-blend-overlay" />
            
            <h2 className="relative z-10 text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-8 leading-none">Ready to drop <br/>the <span className="text-orange-500">excuses?</span></h2>
            <Link to="/play" className="relative z-10 px-10 py-5 bg-white text-black hover:bg-neutral-200 rounded-[2rem] font-bold uppercase tracking-[0.3em] transition-transform hover:scale-105">
              Launch Browser Gym
            </Link>
            <a href="https://github.com/hammaadworks/pktgym/releases/latest" target="_blank" rel="noopener noreferrer" className="relative z-10 mt-6 text-white/50 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Offline App (Mac/PC)
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}