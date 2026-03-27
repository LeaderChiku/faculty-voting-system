import React from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Crown, LogOut, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logoutMut = useLogout({
    mutation: {
      onSuccess: () => {
        window.location.href = "/login";
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary">
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 rounded-none">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <span className="font-display font-bold text-xl tracking-widest text-white group-hover:text-primary transition-colors">
              FAREWELL<span className="text-primary font-sans ml-1">2026</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-sm font-medium text-white">{user.name || user.username}</span>
                  <span className="text-xs text-primary uppercase tracking-wider">{user.role}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logoutMut.mutate()}
                  isLoading={logoutMut.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              location !== "/login" && (
                <Link href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all h-9 px-4 text-sm bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:shadow-lg hover:shadow-yellow-500/40">
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col relative z-10">
        {children}
      </main>
    </div>
  );
}
