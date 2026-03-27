import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useGetMe, useListParticipants, useListCategories, useGetVotingStatus, 
  useSetVotingStatus, useGetCurrentParticipant, useNextParticipant,
  useSetRampwalkSettings,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateParticipant, useUpdateParticipant, useDeleteParticipant,
  useGetAllResults
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, SquareSquare, Users, Settings, Plus, Edit2, Trash2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getApiErrorMessage(err: any, fallback: string) {
  return err?.data?.error || err?.error || err?.message || fallback;
}

export default function AdminDashboard() {
  const { data: user, isLoading: authLoading } = useGetMe();
  const [activeView, setActiveView] = useState<"control" | "participants" | "categories" | "results">("control");

  if (authLoading) return <Layout><div className="flex justify-center p-12">Loading...</div></Layout>;
  if (!user || user.role !== "admin") return <Layout><div className="text-center p-12 text-red-400">Unauthorized. Admin access only.</div></Layout>;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold text-white mb-4 px-2">Admin Panel</h2>
          
          <NavButton active={activeView === "control"} onClick={() => setActiveView("control")} icon={<Play />} label="Live Control" />
          <NavButton active={activeView === "participants"} onClick={() => setActiveView("participants")} icon={<Users />} label="Participants" />
          <NavButton active={activeView === "categories"} onClick={() => setActiveView("categories")} icon={<SquareSquare />} label="Categories" />
          <NavButton active={activeView === "results"} onClick={() => setActiveView("results")} icon={<Trophy />} label="All Results" />
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel rounded-2xl p-6 min-h-[600px]">
          {activeView === "control" && <ControlView />}
          {activeView === "participants" && <ParticipantsView />}
          {activeView === "categories" && <CategoriesView />}
          {activeView === "results" && <ResultsView />}
        </div>
      </div>
    </Layout>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        active 
          ? "bg-primary/20 text-primary border border-primary/30" 
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

// --- VIEWS ---

function ControlView() {
  const { data: status } = useGetVotingStatus({ query: { refetchInterval: 3000 } });
  const { data: currentRamp } = useGetCurrentParticipant({ query: { refetchInterval: 3000 } });
  const { data: participants = [] } = useListParticipants();
  const { data: categories = [] } = useListCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setStatusMut = useSetVotingStatus({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/voting/status"] }),
      onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
    }
  });

  const nextPartMut = useNextParticipant({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/rampwalk/current"] }),
      onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
    }
  });

  const setRampwalkSettingsMut = useSetRampwalkSettings({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/rampwalk/current"] }),
      onError: (err: any) => toast({ title: "Error", description: err?.error ?? "Failed to update rampwalk settings", variant: "destructive" }),
    }
  });

  const [selectedNextId, setSelectedNextId] = useState<string>("");

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-4">Live Event Control</h3>
      
      {/* Ramp Walk Control */}
      <div className="bg-black/30 rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Ramp Walk Display (Faculty View)
        </h4>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              checked={!!currentRamp?.isLive}
              onChange={(e) => setRampwalkSettingsMut.mutate({ data: { isLive: e.target.checked } })}
              className="accent-primary w-4 h-4"
            />
            Rampwalk Live
          </label>
          <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              checked={!!currentRamp?.ratingActive}
              onChange={(e) => setRampwalkSettingsMut.mutate({ data: { ratingActive: e.target.checked } })}
              className="accent-primary w-4 h-4"
            />
            Rampwalk Rating Active (Faculty can score)
          </label>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="text-sm text-muted-foreground mb-1">Currently on Stage:</div>
            {currentRamp?.participant ? (
              <div className="text-xl font-bold text-white">
                #{currentRamp.participant.contestantNo ?? "-"} {currentRamp.participant.name} <span className="text-sm text-primary font-normal">({currentRamp.participant.categoryName})</span>
              </div>
            ) : (
              <div className="text-lg text-white/50 italic">Nobody on stage</div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <select 
              className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white focus:ring-2 focus:ring-primary outline-none"
              value={selectedNextId}
              onChange={(e) => setSelectedNextId(e.target.value)}
            >
              <option value="">-- Select Participant to send to stage --</option>
              <option value="clear">CLEAR STAGE (None)</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>#{p.contestantNo ?? "-"} {p.name} - {p.categoryName}</option>
              ))}
            </select>
            <Button 
              onClick={() => {
                const id = selectedNextId === "clear" ? null : (selectedNextId ? parseInt(selectedNextId) : undefined);
                if (id !== undefined) nextPartMut.mutate({ data: { participantId: id } });
              }}
              isLoading={nextPartMut.isPending}
              disabled={!selectedNextId}
            >
              Push to Faculty Screens
            </Button>
          </div>
        </div>
      </div>

      {/* Voting Control */}
      <div className="bg-black/30 rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Global Voting Status
        </h4>
        
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
          <div>
            <div className="font-medium text-white">Audience & Faculty Voting is:</div>
            <div className={`text-xl font-bold ${status?.isOpen ? 'text-green-400' : 'text-red-400'}`}>
              {status?.isOpen ? "OPEN / ACTIVE" : "CLOSED / PAUSED"}
            </div>
          </div>
          <Button 
            variant={status?.isOpen ? "danger" : "primary"}
            onClick={() => setStatusMut.mutate({ data: { isOpen: !status?.isOpen, activeCategoryId: status?.activeCategoryId }})}
            isLoading={setStatusMut.isPending}
          >
            {status?.isOpen ? "Pause Voting" : "Open Voting"}
          </Button>
        </div>

        {status?.isOpen && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-primary mb-2">Optionally restrict voting to a specific category:</div>
            <select 
              className="h-10 w-full md:w-auto min-w-[250px] rounded-lg border border-white/10 bg-black/40 px-4 text-white"
              value={status?.activeCategoryId || ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                setStatusMut.mutate({ data: { isOpen: true, activeCategoryId: val }});
              }}
            >
              <option value="">All Active Categories</option>
              {categories.filter(c => c.activeForVoting).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesView() {
  const { data: categories = [], isLoading } = useListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newCatName, setNewCatName] = useState("");

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        setNewCatName("");
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    }
  });

  const toggleMut = useUpdateCategory({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/categories"] })
    }
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
        toast({ title: "Category deleted", description: "Category and related participant data removed." });
      },
      onError: (err) => toast({ title: "Delete failed", description: err.error, variant: "destructive" }),
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-2xl font-display font-bold text-white">Categories</h3>
      </div>

      <div className="flex gap-4 mb-6">
        <Input 
          placeholder="New Category Name..." 
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="max-w-md"
        />
        <Button 
          onClick={() => createMut.mutate({ data: { name: newCatName }})}
          disabled={!newCatName || createMut.isPending}
        >
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      <div className="grid gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="font-medium text-lg text-white mb-2 sm:mb-0">{cat.name}</div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={cat.isActive}
                  onChange={(e) => toggleMut.mutate({ id: cat.id, data: { isActive: e.target.checked }})}
                  className="accent-primary w-4 h-4"
                />
                Active (Shows in lists)
              </label>
              <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={cat.activeForVoting}
                  onChange={(e) => toggleMut.mutate({ id: cat.id, data: { activeForVoting: e.target.checked }})}
                  className="accent-primary w-4 h-4"
                />
                Voting Enabled
              </label>
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => {
                  if(confirm("Are you sure? This might delete associated participants or votes.")) {
                    deleteMut.mutate({ id: cat.id });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantsView() {
  const { data: participants = [], isLoading: pLoad } = useListParticipants();
  const { data: categories = [], isLoading: cLoad } = useListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [contestantNo, setContestantNo] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState("");

  const resetForm = () => {
    setName(""); setGender("male"); setCategoryId(categories[0]?.id || 0); setContestantNo(""); setPhotoUrl(""); setEditId(null); setIsFormOpen(false);
  };

  const openEdit = (p: any) => {
    setEditId(p.id); setName(p.name); setGender(p.gender); setCategoryId(p.categoryId); setContestantNo(p.contestantNo ? String(p.contestantNo) : ""); setPhotoUrl(p.photoUrl || ""); setIsFormOpen(true);
  };

  const createMut = useCreateParticipant({
    mutation: {
      onSuccess: () => { resetForm(); queryClient.invalidateQueries({ queryKey: ["/api/participants"] }); toast({ title: "Participant saved" }); },
      onError: (err: any) => toast({ title: "Save failed", description: getApiErrorMessage(err, "Unable to save participant"), variant: "destructive" }),
    }
  });

  const updateMut = useUpdateParticipant({
    mutation: {
      onSuccess: () => { resetForm(); queryClient.invalidateQueries({ queryKey: ["/api/participants"] }); toast({ title: "Participant updated" }); },
      onError: (err: any) => toast({ title: "Update failed", description: getApiErrorMessage(err, "Unable to update participant"), variant: "destructive" }),
    }
  });

  const deleteMut = useDeleteParticipant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
        queryClient.invalidateQueries({ queryKey: ["/api/rampwalk/current"] });
        toast({ title: "Participant deleted" });
      },
      onError: (err) => toast({ title: "Delete failed", description: err.error, variant: "destructive" }),
    }
  });

  if (pLoad || cLoad) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-2xl font-display font-bold text-white">Participants</h3>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Add Participant</Button>
      </div>

      {isFormOpen && (
        <div className="bg-black/40 p-6 rounded-xl border border-primary/30 mb-6">
          <h4 className="text-lg font-bold text-primary mb-4">{editId ? "Edit Participant" : "New Participant"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <select className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white" value={gender} onChange={e => setGender(e.target.value as any)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white" value={categoryId} onChange={e => setCategoryId(parseInt(e.target.value))}>
              <option value={0} disabled>Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input
              type="number"
              min={1}
              placeholder="Contestant Number (optional, auto if empty)"
              value={contestantNo}
              onChange={e => setContestantNo(e.target.value)}
            />
            <Input placeholder="Photo URL (optional)" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={() => {
                const parsedContestantNo = contestantNo.trim() ? parseInt(contestantNo) : undefined;
                if (contestantNo.trim() && (Number.isNaN(parsedContestantNo) || parsedContestantNo <= 0)) {
                  toast({ title: "Invalid contestant number", description: "Contestant number must be a positive integer.", variant: "destructive" });
                  return;
                }
                const data = { name, gender, categoryId, contestantNo: parsedContestantNo, photoUrl: photoUrl || null };
                if (editId) updateMut.mutate({ id: editId, data });
                else createMut.mutate({ data });
              }}
              isLoading={createMut.isPending || updateMut.isPending}
              disabled={!name || !categoryId}
            >
              Save Participant
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden shrink-0 border border-white/10">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/50 bg-primary/10">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white truncate">#{p.contestantNo ?? "-"} {p.name}</h4>
              <p className="text-sm text-muted-foreground truncate">{p.categoryName}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => openEdit(p)} className="p-2 text-white/50 hover:text-primary transition-colors bg-white/5 rounded-lg"><Edit2 className="w-4 h-4"/></button>
              <button onClick={() => { if(confirm("Delete?")) deleteMut.mutate({ id: p.id })}} className="p-2 text-white/50 hover:text-red-400 transition-colors bg-white/5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
        {participants.length === 0 && <div className="col-span-full text-center py-12 text-white/50">No participants added yet.</div>}
      </div>
    </div>
  );
}

function ResultsView() {
  const { data: results = [], isLoading } = useGetAllResults({ query: { refetchInterval: 5000 } });

  if (isLoading) return <div>Loading...</div>;

  const grouped = results.reduce((acc: Record<string, typeof results>, row) => {
    const key = row.categoryName || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-2xl font-display font-bold text-white">Category-wise Top 3 Results</h3>
      </div>

      {Object.entries(grouped).map(([categoryName, rows]) => {
        const top3 = rows.slice().sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 3);
        return (
          <div key={categoryName} className="space-y-3">
            <h4 className="text-lg font-semibold text-primary">{categoryName}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white/90 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-primary">
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Participant</th>
                    <th className="p-3 font-semibold">Faculty Votes</th>
                    <th className="p-3 font-semibold">Audience Votes</th>
                    <th className="p-3 font-semibold text-xl">TOTAL</th>
                    <th className="p-3 font-semibold">Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {top3.map((r, i) => (
                    <tr key={r.participantId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 font-bold">{i + 1}</td>
                      <td className="p-3 font-medium">#{r.contestantNo ?? "-"} {r.name}</td>
                      <td className="p-3">{r.facultyVotes} <span className="text-xs text-white/40">({r.facultyScoreCount} scores)</span></td>
                      <td className="p-3">{r.audienceVotes}</td>
                      <td className="p-3 text-lg font-bold text-primary">{r.totalVotes}</td>
                      <td className="p-3">{r.averageRating ? r.averageRating.toFixed(1) : '-'} / 5</td>
                    </tr>
                  ))}
                  {top3.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-white/50">No voting data yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
