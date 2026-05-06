
"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  Cpu, 
  Search, 
  Layers, 
  Flame, 
  User, 
  ChevronDown, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { Badge } from "@/components/ui/badge";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const CATEGORIES = ["GPU", "CPU", "RAM", "SSD", "Motherboard", "Monitor", "Networking", "Peripherals"];

export function Navbar() {
  const { cartCount } = useCart();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isBypassActive = typeof window !== 'undefined' && sessionStorage.getItem('dev_bypass_active') === 'true';
  const isAdmin = mounted && (user?.email?.toLowerCase() === 'admin@gmail.com' || isBypassActive);
  
  // Guard against hydration mismatch and loading flickering
  const userDisplayEmail = mounted && !isUserLoading ? (user?.email || "Guest User") : "Syncing...";

  return (
    <nav className="sticky-nav">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary transition-all duration-300">
            <Cpu className="h-6 w-6 text-primary group-hover:text-primary-foreground group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xl font-headline font-bold tracking-tight hidden lg:inline-block uppercase">
            SmartLink <span className="text-primary">Systems</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden xl:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" className="gap-2 font-medium">Home</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2 font-medium">Shop All</Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 font-medium">
                Categories <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 glass-morphism border-white/10">
              {CATEGORIES.map(cat => (
                <DropdownMenuItem key={cat} className="cursor-pointer">
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" className="gap-2 font-medium text-orange-400 hover:text-orange-300">
            <Flame className="h-4 w-4" /> Trending
          </Button>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-grow max-w-md hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search performance hardware..." 
            className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-full h-10"
          />
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Conditional Admin Dashboard Link */}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-primary/20 text-primary hover:bg-primary/10">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden xl:inline">Dashboard</span>
              </Button>
            </Link>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in border-2 border-background"
                  variant="default"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                {isUserLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 glass-morphism border-white/10" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Account Session</span>
                    {isAdmin && <Badge className="text-[9px] h-4 bg-primary/20 text-primary border-none">ADMIN</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {isUserLoading ? "Authenticating..." : userDisplayEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              
              {user ? (
                <>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Layers className="h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <User className="h-4 w-4" /> Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:bg-destructive/10 gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <Link href="/login">
                  <DropdownMenuItem className="cursor-pointer gap-2 text-primary focus:bg-primary/10 font-bold">
                    <LogIn className="h-4 w-4" /> Sign In to SmartLink
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
