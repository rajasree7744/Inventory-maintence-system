"use client"

import { useState, useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { LayoutDashboard, Package, History, Bell, LogOut, Store, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { AdminGuard } from "@/components/AdminGuard";
import { Product, Sale } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isBypassActive, setIsBypassActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsBypassActive(sessionStorage.getItem('dev_bypass_active') === 'true');
    }
  }, []);

  const MASTER_ADMIN_EMAIL = 'admin@gmail.com';
  const isAdminEmail = user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;
  const shouldFetchProtected = mounted && !isUserLoading && (isAdminEmail || isBypassActive);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "products");
  }, [db]);

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !shouldFetchProtected) return null;
    return query(collection(db, "products"), where("quantity", "<", 5));
  }, [db, shouldFetchProtected]);

  const recentSalesQuery = useMemoFirebase(() => {
    if (!db || !shouldFetchProtected) return null;
    return query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(3));
  }, [db, shouldFetchProtected]);

  const { data: allProducts } = useCollection<Product>(productsQuery);
  const { data: lowStockItems } = useCollection<Product>(alertsQuery);
  const { data: recentSales } = useCollection<Sale>(recentSalesQuery);

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="w-72 border-r border-white/5 hidden lg:flex flex-col glass-morphism fixed h-full z-20 shadow-2xl">
          <div className="p-6 border-b border-white/5">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary transition-colors">
                <ShieldCheck className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight">SmartLink <span className="text-primary">Sys</span></span>
            </Link>
          </div>

          <div className="flex-grow flex flex-col overflow-y-auto">
            <nav className="p-4 space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-50">Operations</p>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary group">
                  <LayoutDashboard className="h-4 w-4 opacity-70 group-hover:opacity-100" /> Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary group">
                  <Package className="h-4 w-4 opacity-70 group-hover:opacity-100" /> 
                  <span className="flex-grow text-left">Inventory</span>
                  {allProducts && <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/20 text-primary border-none">{allProducts.length}</Badge>}
                </Button>
              </Link>
              <Link href="/admin/sales">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary group">
                  <History className="h-4 w-4 opacity-70 group-hover:opacity-100" /> Sales Tracker
                </Button>
              </Link>
            </nav>

            <div className="p-4 mt-auto border-t border-white/5">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 opacity-50">Critical Logs</p>
              <div className="space-y-2">
                {lowStockItems && lowStockItems.length > 0 ? (
                  <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-center gap-2 text-destructive">
                      <Bell className="h-3 w-3 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase">{lowStockItems.length} Low Stock Alerts</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-muted-foreground py-2 italic">No stock alerts.</p>
                )}
                
                <div className="mt-4 space-y-2">
                  {recentSales?.map((sale, idx) => (
                    <div key={idx} className="px-3 py-2 bg-white/5 rounded-md border border-white/5 text-[11px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold truncate text-primary">{sale.customerName}</span>
                        <span className="text-[9px] text-muted-foreground">{formatDate(sale.timestamp).split(',')[0]}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{sale.productName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-2 bg-card/40">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-50">Public View</p>
            <Link href="/">
              <Button variant="outline" className="w-full justify-start gap-3 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary-foreground transition-all">
                <ShoppingBag className="h-4 w-4" /> Exit Terminal
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Terminate Session
            </Button>
          </div>
        </aside>

        <main className="flex-grow lg:ml-72 p-4 md:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
