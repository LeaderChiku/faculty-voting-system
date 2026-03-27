import { Link } from "wouter";
import { motion } from "framer-motion";
import { Crown, Star, Sparkles, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Elegant Night Event" 
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
            <Crown className="w-24 h-24 text-primary relative z-10" strokeWidth={1.5} />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-4 drop-shadow-2xl">
            <span className="text-white">FAREWELL</span>
            <span className="text-gradient-gold ml-4">2026</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-light mb-12 max-w-2xl mx-auto tracking-wide">
            An evening of elegance, memories, and celebration as we bid adieu to our graduating class.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-black bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(218,165,32,0.4)]"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
              <span className="relative flex items-center gap-2 text-lg">
                Enter Event Portal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/results" 
              className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white border border-white/20 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Live Results
            </Link>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-64 h-64 border border-white/5 rounded-full border-dashed pointer-events-none" 
        />
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 border border-yellow-500/10 rounded-full border-dashed pointer-events-none" 
        />
      </div>
    </div>
  );
}
