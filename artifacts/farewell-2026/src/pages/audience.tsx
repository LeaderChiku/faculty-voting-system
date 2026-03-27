import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetMe, useGetVotingStatus, useListCategories, useListParticipants, useSubmitAudienceVote } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function AudienceVoting() {
  const { data: user, isLoading: authLoading } = useGetMe();
  const { data: status, isLoading: statusLoading } = useGetVotingStatus({ query: { refetchInterval: 5000 } });
  const { data: categories = [] } = useListCategories();
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const { data: participants = [], isLoading: pLoading } = useListParticipants(
    { categoryId: selectedCategory || undefined },
    { query: { enabled: !!selectedCategory } }
  );
  
  const { toast } = useToast();

  const voteMut = useSubmitAudienceVote({
    mutation: {
      onSuccess: () => {
        toast({ title: "Vote Cast Successfully!", description: "Thank you for voting." });
        // Optionally store locally that they voted in this category to disable UI
      },
      onError: (err) => toast({ title: "Vote Failed", description: err.error, variant: "destructive" })
    }
  });

  if (authLoading || statusLoading) return <Layout><div className="flex justify-center p-12 text-primary animate-pulse">Loading Voting Portal...</div></Layout>;
  if (!user) return <Layout><div className="text-center p-12">Please login first.</div></Layout>;

  // Check if voting is closed entirely
  if (!status?.isOpen) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="glass-panel p-12 rounded-3xl border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Voting is Closed</h2>
            <p className="text-white/60 text-lg">The voting lines are currently closed by the organizers. Please wait for the announcement.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Determine which categories they can see
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

  // Auto-select if only one
  if (availableCategories.length === 1 && selectedCategory !== availableCategories[0].id) {
    setSelectedCategory(availableCategories[0].id);
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">Audience Choice</h1>
          <p className="text-primary text-lg">Cast your vote for your favorite participant!</p>
        </div>

        {/* Category Selection (if multiple) */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(218,165,32,0.4)]"
                    : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
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
                {participants.map((p, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={p.id} 
                    className="glass-panel-hover glass-panel rounded-2xl overflow-hidden group flex flex-col"
                  >
                    <div className="aspect-[4/5] bg-black/50 relative overflow-hidden">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl font-display font-bold text-white/10">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-display text-xl font-bold text-white mb-1 truncate">{p.name}</h4>
                      <div className="flex-1" />
                      <Button 
                        className="w-full mt-4 group/btn" 
                        onClick={() => {
                          if(confirm(`Cast your final vote for ${p.name}?`)) {
                            voteMut.mutate({ data: { participantId: p.id, categoryId: selectedCategory }})
                          }
                        }}
                        isLoading={voteMut.isPending}
                      >
                        <Heart className="w-4 h-4 mr-2 group-hover/btn:fill-black transition-colors" /> Vote Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
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
