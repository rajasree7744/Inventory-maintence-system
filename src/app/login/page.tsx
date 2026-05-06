"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    setErrorMessage(null);

    const targetEmail = email.toLowerCase().trim();
    const MASTER_ADMIN_EMAIL = 'admin@gmail.com';

    try {
      // 1. Force Browser Local Persistence to survive refreshes
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      
      // 2. Strict Identity Verification for Master Admin
      if (userCredential.user.email?.toLowerCase() !== MASTER_ADMIN_EMAIL) {
        setErrorMessage("Clearance Denied: Account lacks Master Administrator privileges.");
        await auth.signOut();
        return;
      }

      // 3. Clear all potential guest session contamination
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      toast({ title: "Master Access Verified", description: "Secure terminal session established." });
      router.push("/admin");
    } catch (err: any) {
      console.error("Terminal Auth Failure:", err.code);
      setErrorMessage(`Authentication Failed: ${err.code === 'auth/invalid-credential' ? 'Invalid credentials.' : 'Authorization error.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute top-8 left-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/80 backdrop-blur-md relative z-10 animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-inner">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Master <span className="text-primary">Terminal</span></CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest text-muted-foreground">Secure Hardware Controller Gateway</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Master ID</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/50 h-11 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Access Code</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-background/50 h-11 border-white/10"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 font-bold shadow-lg shadow-primary/20 uppercase tracking-widest" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                "Authorize Terminal"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
