import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, MicVocal, KeyRound, User as UserIcon } from "lucide-react";
import { useAdminLogin, useFacultyLogin, useAudienceLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";

type Role = "admin" | "faculty" | "audience";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Role>("faculty");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const adminMut = useAdminLogin({
    mutation: {
      onSuccess: () => setLocation("/admin"),
      onError: (err) => toast({ title: "Login Failed", description: err.error, variant: "destructive" })
    }
  });

  const facultyMut = useFacultyLogin({
    mutation: {
      onSuccess: () => setLocation("/faculty"),
      onError: (err) => toast({ title: "Login Failed", description: err.error, variant: "destructive" })
    }
  });

  const audienceMut = useAudienceLogin({
    mutation: {
      onSuccess: () => setLocation("/audience"),
      onError: (err) => toast({ title: "Login Failed", description: err.error, variant: "destructive" })
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "admin") adminMut.mutate({ data: { username, password } });
    if (activeTab === "faculty") facultyMut.mutate({ data: { name: username, password } });
    if (activeTab === "audience") audienceMut.mutate({ data: { username, password: "audience" } });
  };

  const isPending = adminMut.isPending || facultyMut.isPending || audienceMut.isPending;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center relative py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background -z-10 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            {/* Top decorative glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Select your role to access the portal</p>
            </div>

            {/* Role Tabs */}
            <div className="flex p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
              {[
                { id: "admin", icon: Shield, label: "Admin" },
                { id: "faculty", icon: MicVocal, label: "Faculty" },
                { id: "audience", icon: Users, label: "Audience" }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as Role);
                      setUsername(tab.id === "admin" ? "admin" : "");
                      setPassword("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-white/10 text-primary shadow-sm border border-white/10" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <Input
                  required
                  icon={<UserIcon className="w-5 h-5" />}
                  placeholder={
                    activeTab === "faculty" ? "Your Full Name" :
                    activeTab === "audience" ? "Your Name" :
                    "admin"
                  }
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={activeTab === "admin"}
                  disabled={isPending}
                />
                
                {activeTab !== "audience" && (
                  <Input
                    required
                    type="password"
                    icon={<KeyRound className="w-5 h-5" />}
                    placeholder={activeTab === "faculty" ? "Shared Faculty Password" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                  />
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {activeTab === "faculty" && (
                  <motion.div
                    key="faculty-hint"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-primary/80 bg-primary/5 p-3 rounded-lg border border-primary/10"
                  >
                    Enter your actual name. This will be used to record your scores for the participants.
                  </motion.div>
                )}
                {activeTab === "audience" && (
                  <motion.div
                    key="audience-hint"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-primary/80 bg-primary/5 p-3 rounded-lg border border-primary/10"
                  >
                    Just enter your name to join and vote for your favourite participants!
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
                Sign In as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
