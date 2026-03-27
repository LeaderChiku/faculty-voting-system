import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useGetMe, useGetCurrentParticipant, useSubmitFacultyScore } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, MicVocal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}

function ScoreSlider({ label, description, value, onChange, color }: ScoreSliderProps) {
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
      <div className="flex justify-between items-center">
        <div>
          <p className={`font-semibold text-sm uppercase tracking-widest ${color}`}>{label}</p>
          <p className="text-xs text-white/40 mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${color}`}>{value}</span>
          <span className="text-sm text-white/40"> / 5</span>
          <p className="text-xs text-white/50">{labels[value]}</p>
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-current"
        style={{ accentColor: color.includes("yellow") ? "#facc15" : color.includes("purple") ? "#a855f7" : "#60a5fa" }}
      />
      <div className="flex justify-between text-xs text-white/30 px-0.5 font-mono">
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  );
}

export default function FacultyPanel() {
  const { data: user, isLoading: authLoading } = useGetMe();
  const { data: rampState, isLoading: rampLoading } = useGetCurrentParticipant({ query: { refetchInterval: 3000 } });
  const { toast } = useToast();

  const [scoreIntro, setScoreIntro] = useState(3);
  const [scoreRamp, setScoreRamp] = useState(3);
  const [scoreTalent, setScoreTalent] = useState(3);
  const [submittedFor, setSubmittedFor] = useState<number | null>(null);

  const submitMut = useSubmitFacultyScore({
    mutation: {
      onSuccess: () => {
        toast({ title: "Score Submitted!", description: "Your scores have been recorded." });
        setSubmittedFor(rampState?.currentParticipantId || null);
      },
      onError: (err: any) => toast({ title: "Submission Failed", description: err?.error ?? "Please try again.", variant: "destructive" })
    }
  });

  useEffect(() => {
    if (rampState?.currentParticipantId && rampState.currentParticipantId !== submittedFor) {
      setScoreIntro(3);
      setScoreRamp(3);
      setScoreTalent(3);
      if (submittedFor !== null && rampState.currentParticipantId !== submittedFor) {
        setSubmittedFor(null);
      }
    }
  }, [rampState?.currentParticipantId]);

  if (authLoading || rampLoading) return (
    <Layout>
      <div className="flex justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );
  if (!user || user.role !== "faculty") return (
    <Layout><div className="text-center p-12 text-red-400">Unauthorized. Faculty access only.</div></Layout>
  );

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
              className="glass-panel p-6 sm:p-8 rounded-3xl border-primary/30 relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/20 blur-[100px] pointer-events-none" />

              {/* Participant Info */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 relative z-10">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-black/50 border-4 border-white/10 shadow-2xl shrink-0">
                  {participant.photoUrl ? (
                    <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-display font-bold text-primary/30 bg-gradient-to-br from-white/5 to-white/10">
                      {participant.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded-full inline-block mb-3">
                    On Stage Now
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">{participant.name}</h3>
                  <p className="text-lg text-white/60">{participant.categoryName}</p>
                </div>
              </div>

              {/* Scoring Section */}
              <div className="relative z-10">
                {submittedFor === participant.id ? (
                  <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl text-center">
                    <Star className="w-14 h-14 text-green-400 mx-auto mb-3 fill-green-400" />
                    <h4 className="text-2xl font-bold text-green-400 mb-1">Scores Submitted!</h4>
                    <p className="text-green-400/70">Waiting for next participant...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Rate Each Round (1–5)</h4>

                    <ScoreSlider
                      label="Introduction"
                      description="First impression & stage presence"
                      value={scoreIntro}
                      onChange={setScoreIntro}
                      color="text-yellow-400"
                    />
                    <ScoreSlider
                      label="Ramp Walk"
                      description="Confidence, style & walk quality"
                      value={scoreRamp}
                      onChange={setScoreRamp}
                      color="text-purple-400"
                    />
                    <ScoreSlider
                      label="Talent Showcase"
                      description="Performance & overall impact"
                      value={scoreTalent}
                      onChange={setScoreTalent}
                      color="text-blue-400"
                    />

                    <Button
                      size="lg"
                      className="w-full text-lg h-14 mt-2"
                      onClick={() => submitMut.mutate({
                        data: {
                          participantId: participant.id,
                          scoreIntroduction: scoreIntro,
                          scoreRampwalk: scoreRamp,
                          scoreTalent: scoreTalent,
                        }
                      })}
                      isLoading={submitMut.isPending}
                    >
                      Submit All Scores
                    </Button>
                  </div>
                )}
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
              <p className="text-muted-foreground max-w-sm">The participant will appear here automatically when the admin brings them on stage.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
