"use client"

import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert, Store, Cpu, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "firebase/auth";

/**
 * AdminGuard: The definitive security gate for SmartLink Systems.
 * Implements a strict Loading Gate to prevent GUEST_SESSION race conditions.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. THE MANDATORY LOADING GATE
  // We must return a neutral loading state while initializing. 
  // It is STRICTLY FORBIDDEN to show the "Access Restricted" UI while loading is true.
  if (!mounted || isUserLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary p-20 gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse-subtle pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 border-2 border-primary/10 rounded-full animate-spin border-t-primary" />
            <Cpu className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-xl font-headline font-bold tracking-[0.3em] uppercase animate-pulse">Synchronizing Secure Terminal</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">Verifying Master Security Link with SmartLink Cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  const MASTER_ADMIN_EMAIL = 'admin@gmail.com';
  const isMaster = user && user.email?.toLowerCase() === MASTER_ADMIN_EMAIL;

  // 2. MASTER IDENTITY CLEARANCE: Immediately grant access if confirmed.
  if (isMaster) {
    return <>{children}</>;
  }

  // 3. FALLBACK: Non-Master session detected (Only after loading is definitely FALSE).
  const handleHardReset = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      // SELF-HEALING: Sign out and purge all stale/poisoned tokens.
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Critical terminal reset failed:", error);
      router.push("/login");
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-destructive/5 blur-[120px] pointer-events-none" />
      
      <div className="p-8 bg-card glass-morphism rounded-3xl max-w-md w-full space-y-8 border-destructive/20 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-5 bg-destructive/10 rounded-2xl relative border border-destructive/20 shadow-inner">
            <ShieldAlert className="h-14 w-14 text-destructive" />
            <div className="h-4 w-4 bg-destructive rounded-full absolute -top-1 -right-1 animate-ping" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-bold tracking-tight text-foreground uppercase">
            Access <span className="text-destructive">Restricted</span>
          </h2>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2 shadow-inner">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Active Identity Header:</p>
            <p className="text-sm font-bold text-white break-all font-mono">{user?.email || "GUEST_SESSION"}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed px-4 opacity-80">
            SmartLink Master Terminal access is strictly prohibited for the current account credentials. Please authorize using the Master Administrator ID.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleHardReset} className="w-full h-12 gap-3 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold text-sm">
            <ShieldCheck className="h-5 w-5" /> Re-authenticate Session
          </Button>
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full h-12 gap-2 text-muted-foreground hover:text-white transition-colors">
              <Store className="h-4 w-4" /> Exit Terminal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
