import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useGetResults } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Star, Award, TrendingUp } from "lucide-react";

export default function ResultsPage() {
  const { data, isLoading } = useGetResults({ query: { refetchInterval: 5000 } });
  const [hasAnimated, setHasAnimated] = useState(false);

  const top3 = data?.top3 || [];

  useEffect(() => {
    if (top3.length > 0 && !hasAnimated) {
      setHasAnimated(true);
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#8A2BE2', '#FFFFFF']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#8A2BE2', '#FFFFFF']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [top3, hasAnimated]);

  if (isLoading && !data) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-primary text-lg font-medium">Calculating Results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Reorder for podium: 2nd, 1st, 3rd visually
  const podiumOrder = [
    top3[1] || null, // 2nd (Left)
    top3[0] || null, // 1st (Center)
    top3[2] || null  // 3rd (Right)
  ];

  const getRankStyles = (index: number) => {
    // index here is position in podium array: 0=2nd, 1=1st, 2=3rd
    if (index === 1) return { // 1st
      height: "h-64 sm:h-80", 
      color: "from-yellow-400 via-yellow-500 to-yellow-600",
      text: "text-yellow-900",
      glow: "shadow-[0_0_50px_rgba(255,215,0,0.5)]",
      badge: "bg-yellow-400 text-yellow-900",
      rank: "1st",
      delay: 0.6
    };
    if (index === 0) return { // 2nd
      height: "h-48 sm:h-60", 
      color: "from-slate-300 via-slate-400 to-slate-500",
      text: "text-slate-900",
      glow: "shadow-[0_0_30px_rgba(200,200,200,0.3)]",
      badge: "bg-slate-300 text-slate-900",
      rank: "2nd",
      delay: 0.3
    };
    return { // 3rd
      height: "h-40 sm:h-48", 
      color: "from-amber-600 via-amber-700 to-amber-800",
      text: "text-orange-50",
      glow: "shadow-[0_0_30px_rgba(184,115,51,0.3)]",
      badge: "bg-amber-600 text-white",
      rank: "3rd",
      delay: 0.9
    };
  };

  return (
    <Layout>
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
         <img 
          src={`${import.meta.env.BASE_URL}images/podium-bg.png`} 
          alt="Podium Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>

      <div className="max-w-5xl mx-auto w-full pt-8 sm:pt-16 pb-20">
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium tracking-widest uppercase">Live Leaderboard</span>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
            Current Rankings
          </h1>
          <p className="text-lg text-white/60">Combined Faculty & Audience Votes</p>
        </div>

        {top3.length === 0 ? (
          <div className="text-center p-12 glass-panel rounded-3xl max-w-xl mx-auto">
            <Award className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Votes Yet</h3>
            <p className="text-muted-foreground">The leaderboard will update automatically once voting begins.</p>
          </div>
        ) : (
          <div className="flex items-end justify-center gap-2 sm:gap-6 min-h-[400px]">
            {podiumOrder.map((participant, i) => {
              if (!participant) return <div key={i} className="flex-1 max-w-[280px]" />; // Spacer
              
              const styles = getRankStyles(i);
              
              return (
                <div key={participant.participantId} className="flex-1 flex flex-col items-center max-w-[280px] w-full relative">
                  {/* Participant Info Floating Above Podium */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: styles.delay, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center text-center w-full z-10"
                  >
                    <div className={`relative mb-4 ${i === 1 ? 'w-32 h-32 sm:w-40 sm:h-40' : 'w-24 h-24 sm:w-32 sm:h-32'}`}>
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${styles.color} animate-pulse opacity-50 blur-md`} />
                      <div className={`w-full h-full rounded-full overflow-hidden border-4 bg-background relative z-10 ${i === 1 ? 'border-yellow-400' : (i === 0 ? 'border-slate-300' : 'border-amber-600')}`}>
                        {participant.photoUrl ? (
                          <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-white/50 bg-white/5">
                            {participant.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {/* Rank Badge */}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-black text-sm sm:text-base border-2 border-background z-20 ${styles.badge}`}>
                        {styles.rank}
                      </div>
                    </div>

                    <div className="mb-6 px-2 w-full">
                      <h3 className={`font-display font-bold truncate mb-1 ${i === 1 ? 'text-2xl sm:text-3xl text-white' : 'text-xl sm:text-2xl text-white/90'}`}>
                        {participant.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-primary uppercase tracking-wider truncate">{participant.categoryName}</p>
                    </div>
                  </motion.div>

                  {/* The Physical Podium Block */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ delay: styles.delay - 0.2, duration: 0.8, ease: "easeOut" }}
                    className={`w-full rounded-t-2xl relative overflow-hidden bg-gradient-to-t ${styles.color} ${styles.glow} ${styles.height}`}
                    style={{ transformOrigin: "bottom" }}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                    <div className="absolute inset-x-0 top-1 bottom-0 bg-gradient-to-b from-black/10 to-black/60" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className={`text-4xl sm:text-5xl font-black ${styles.text} drop-shadow-md mb-2`}>
                        {participant.totalVotes}
                      </div>
                      <div className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${styles.text} opacity-80`}>
                        Total Votes
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-black/10 flex flex-col gap-1 w-full max-w-[150px]">
                        <div className={`flex justify-between text-xs ${styles.text} opacity-70`}>
                          <span>Audience:</span>
                          <span className="font-bold">{participant.audienceVotes}</span>
                        </div>
                        <div className={`flex justify-between text-xs ${styles.text} opacity-70`}>
                          <span>Faculty:</span>
                          <span className="font-bold">{participant.facultyVotes}</span>
                        </div>
                        <div className={`flex justify-between text-xs ${styles.text} opacity-90 mt-1 bg-black/5 p-1 rounded`}>
                          <span>Avg Rating:</span>
                          <span className="font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{participant.averageRating ? participant.averageRating.toFixed(1) : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
