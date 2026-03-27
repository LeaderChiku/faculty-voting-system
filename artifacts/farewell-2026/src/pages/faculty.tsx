import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetMe, useGetCurrentParticipant, useSubmitFacultyScore } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, MicVocal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FacultyPanel() {
  const { data: user, isLoading: authLoading } = useGetMe();
  const { data: rampState, isLoading: rampLoading } = useGetCurrentParticipant({ query: { refetchInterval: 3000 } });
  const { toast } = useToast();
  
  const [score, setScore] = useState<number>(3);
  const [submittedFor, setSubmittedFor] = useState<number | null>(null);

  const submitMut = useSubmitFacultyScore({
    mutation: {
      onSuccess: () => {
        toast({ title: "Score Submitted!", description: "Votes have been recorded securely." });
        setSubmittedFor(rampState?.currentParticipantId || null);
      },
      onError: (err) => toast({ title: "Submission Failed", description: err.error, variant: "destructive" })
    }
  });

  // Reset score and submitted state when participant changes
  useEffect(() => {
    if (rampState?.currentParticipantId && rampState.currentParticipantId !== submittedFor) {
      setScore(3);
      // We don't auto-reset submittedFor immediately unless we are sure it's a new person.
      // The backend should reject duplicate scores anyway, but UI-wise let's clear it if the ID changed.
      // Wait, if they scored them, then admin switched away, then switched back, they shouldn't score again.
      // We'll rely on backend 400 error for already scored, but for UI fluidity during a contiguous session:
      if (submittedFor !== null && rampState.currentParticipantId !== submittedFor) {
        setSubmittedFor(null);
      }
    }
  }, [rampState?.currentParticipantId]);


  if (authLoading || rampLoading) return <Layout><div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div></Layout>;
  if (!user || user.role !== "faculty") return <Layout><div className="text-center p-12 text-red-400">Unauthorized. Faculty access only.</div></Layout>;

  const participant = rampState?.participant;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">
            <MicVocal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Faculty Scoring Panel</h2>
            <p className="text-sm text-primary/80">Scoring as: {user.name}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {participant ? (
            <motion.div 
              key={participant.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              className="glass-panel p-6 sm:p-10 rounded-3xl border-primary/30 relative overflow-hidden"
            >
              {/* Background glow based on photo or generic */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/20 blur-[100px] pointer-events-none" />

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch relative z-10">
                {/* Photo */}
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden bg-black/50 border-4 border-white/10 shadow-2xl shrink-0">
                  {participant.photoUrl ? (
                    <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl font-display font-bold text-primary/30 bg-gradient-to-br from-white/5 to-white/10">
                      {participant.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details & Scoring */}
                <div className="flex-1 flex flex-col justify-center text-center md:text-left w-full">
                  <div className="mb-2 inline-flex items-center justify-center md:justify-start">
                    <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded-full">
                      On Stage Now
                    </span>
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-display font-bold text-white mb-2">{participant.name}</h3>
                  <p className="text-xl text-white/60 mb-8">{participant.categoryName}</p>

                  {submittedFor === participant.id ? (
                    <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center">
                      <Star className="w-12 h-12 text-green-400 mx-auto mb-3 fill-green-400" />
                      <h4 className="text-xl font-bold text-green-400 mb-1">Score Submitted</h4>
                      <p className="text-green-400/70">Waiting for next participant...</p>
                    </div>
                  ) : (
                    <div className="space-y-8 bg-black/30 p-6 rounded-2xl border border-white/5">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="text-sm font-medium text-white/80 uppercase tracking-widest">Rate Performance</label>
                          <div className="text-right">
                            <div className="text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(218,165,32,0.5)]">{score} <span className="text-lg text-white/50">/ 5</span></div>
                          </div>
                        </div>
                        
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          step="1" 
                          value={score} 
                          onChange={(e) => setScore(parseInt(e.target.value))}
                        />
                        <div className="flex justify-between text-xs text-white/40 px-1 font-mono">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <span className="text-sm text-primary">Converts to:</span>
                        <span className="text-2xl font-bold text-white">{score * 5} <span className="text-sm font-normal text-white/60">Votes</span></span>
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full text-lg h-16" 
                        onClick={() => submitMut.mutate({ data: { participantId: participant.id, score }})}
                        isLoading={submitMut.isPending}
                      >
                        Submit Score
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-panel py-24 px-6 rounded-3xl flex flex-col items-center justify-center text-center border-white/5"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
                <MicVocal className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">Waiting for Stage</h3>
              <p className="text-muted-foreground max-w-sm">The participant to be scored will appear here automatically when the admin brings them to the stage.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
