import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetMe, useGetVotingStatus, useListCategories, useListParticipants, useSubmitAudienceVote } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Heart, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AudienceVoting() {
  const { data: user, isLoading: authLoading } = useGetMe();
  const { data: status, isLoading: statusLoading } = useGetVotingStatus({ query: { refetchInterval: 5000 } });
  const { data: categories = [] } = useListCategories();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  // Track voted categories locally: categoryId -> participantId voted for
  const [votedCategories, setVotedCategories] = useState<Record<number, number>>({});
  const [pendingVote, setPendingVote] = useState<number | null>(null);

  const { data: participants = [], isLoading: pLoading } = useListParticipants(
    { categoryId: selectedCategory || undefined },
    { query: { enabled: !!selectedCategory } }
  );

  const { toast } = useToast();

  const voteMut = useSubmitAudienceVote({
    mutation: {
      onSuccess: (_data, variables) => {
        const catId = (variables.data as any).categoryId as number;
        const pId = (variables.data as any).participantId as number;
        setVotedCategories(prev => ({ ...prev, [catId]: pId }));
        setPendingVote(null);
        toast({ title: "Vote Cast!", description: "Your vote has been recorded. Thank you!" });
      },
      onError: (err: any) => {
        setPendingVote(null);
        const msg = err?.data?.error ?? err?.message ?? "Something went wrong";
        toast({ title: "Vote Failed", description: msg, variant: "destructive" });
      }
    }
  });

  if (authLoading || statusLoading) return (
    <Layout><div className="flex justify-center p-12 text-primary animate-pulse">Loading Voting Portal...</div></Layout>
  );
  if (!user) return (
    <Layout><div className="text-center p-12">Please login first.</div></Layout>
  );

  if (!status?.isOpen) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="glass-panel p-12 rounded-3xl border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Voting is Closed</h2>
            <p className="text-white/60 text-lg">The voting lines are currently closed. Please wait for the announcement.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const activeCategories = categories.filter(c => c.activeForVoting);
  const availableCategories = status.activeCategoryId
    ? activeCategories.filter(c => c.id === status.activeCategoryId)
    : activeCategories;

  if (availableCategories.length === 0) {
    return (
      <Layout>
        <div className="text-center p-12 text-white/60">No categories are currently open for voting.</div>
      </Layout>
    );
  }

  if (availableCategories.length === 1 && selectedCategory !== availableCategories[0].id) {
    setSelectedCategory(availableCategories[0].id);
  }

  const handleVote = (participantId: number) => {
    if (!selectedCategory) return;
    if (votedCategories[selectedCategory] !== undefined) return;
    if (pendingVote !== null) return;
    setPendingVote(participantId);
    voteMut.mutate({ data: { participantId, categoryId: selectedCategory } });
  };

  const votedForInCategory = selectedCategory ? votedCategories[selectedCategory] : undefined;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-3">Audience Choice</h1>
          <p className="text-primary text-lg">Cast your vote — one vote per category!</p>
        </div>

        {/* Category Selection */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(218,165,32,0.4)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat.name}
                {votedCategories[cat.id] !== undefined && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Voted banner */}
        {selectedCategory && votedForInCategory !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center"
          >
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-semibold text-lg">You've voted in this category!</p>
            <p className="text-green-400/60 text-sm mt-1">Your vote for <strong>{participants.find(p => p.id === votedForInCategory)?.name ?? "this participant"}</strong> has been recorded.</p>
          </motion.div>
        )}

        {/* Participants Grid */}
        {selectedCategory && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
              {availableCategories.find(c => c.id === selectedCategory)?.name} Candidates
            </h3>

            {pLoading ? (
              <div className="text-center py-12 text-white/50">Loading candidates...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {participants.map((p, idx) => {
                  const isVotedFor = votedForInCategory === p.id;
                  const alreadyVotedElsewhere = votedForInCategory !== undefined && !isVotedFor;
                  const isPending = pendingVote === p.id;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={p.id}
                      className={`glass-panel rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                        isVotedFor ? "border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]" :
                        alreadyVotedElsewhere ? "opacity-50" : "glass-panel-hover"
                      }`}
                    >
                      <div className="aspect-[4/5] bg-black/50 relative overflow-hidden">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl font-display font-bold text-white/10">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        {isVotedFor && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-16 h-16 text-green-400" />
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-display text-xl font-bold text-white mb-1 truncate">{p.name}</h4>
                        <div className="flex-1" />
                        {isVotedFor ? (
                          <div className="w-full mt-4 py-3 rounded-lg bg-green-500/20 text-green-400 text-center font-semibold flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Voted!
                          </div>
                        ) : (
                          <Button
                            className="w-full mt-4"
                            onClick={() => handleVote(p.id)}
                            isLoading={isPending}
                            disabled={alreadyVotedElsewhere || voteMut.isPending}
                          >
                            <Heart className="w-4 h-4 mr-2" /> Vote Now
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {participants.length === 0 && (
                  <div className="col-span-full text-center py-12 text-white/50">No participants in this category.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
