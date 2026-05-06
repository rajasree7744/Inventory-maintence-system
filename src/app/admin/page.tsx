"use client"

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { Product, Sale, Feedback } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Star, 
  Bell,
  ShoppingCart,
  MessageSquare,
  Trash2,
  PlusCircle,
  Loader2,
  RefreshCw,
  Zap,
  History,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MASTER_ADMIN_EMAIL = 'admin@gmail.com';
  const isAdmin = mounted && !isUserLoading && (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL);

  // Queries - Strictly guarded by admin status
  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"), orderBy("name", "asc"));
  }, [db]);

  const salesRef = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(50));
  }, [db, isAdmin]);

  const feedbackRef = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "feedback"), orderBy("createdat", "desc"), limit(10));
  }, [db, isAdmin]);

  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsRef);
  const { data: sales, error: salesError } = useCollection<Sale>(salesRef);
  const { data: feedback, error: feedbackError } = useCollection<Feedback>(feedbackRef);

  const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.price * (sale.quantity || 1)), 0) || 0;
  const inventoryCount = products?.length || 0;
  const lowStockItems = products?.filter(p => p.quantity < 5) || [];
  const feedbackCount = feedback?.length || 0;
  const avgSatisfaction = feedback?.length 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) 
    : 0;

  const handleUpdateStock = (productId: string, currentQty: number) => {
    if (!db || !isAdmin) return;
    const productDocRef = doc(db, "products", productId);
    updateDocumentNonBlocking(productDocRef, { quantity: currentQty + 10 });
    toast({ title: "Inventory Replenished", description: "Added 10 units to stock." });
  };

  const handleDeleteProduct = (productId: string) => {
    if (!db || !isAdmin) return;
    const productDocRef = doc(db, "products", productId);
    deleteDocumentNonBlocking(productDocRef);
    toast({ variant: "destructive", title: "Product Removed", description: "Item deleted from catalog." });
  };

  const handleSignOutAndReset = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      router.push("/login");
    }
  };

  // 1. Loading Gate - Wait for Auth verification
  if (!mounted || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
          <Cpu className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary animate-pulse">SYNCHRONIZING WITH SECURE TERMINAL...</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Establishing Master Link...</p>
        </div>
      </div>
    );
  }

  // 2. Access Denied UI
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-8 text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-destructive/10 rounded-3xl border border-destructive/20 relative shadow-2xl">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <div className="h-4 w-4 bg-destructive rounded-full absolute top-2 right-2 animate-ping" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Access <span className="text-destructive">Restricted</span></h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Administrative terminal access is strictly limited to the Master Administrator account.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button onClick={handleSignOutAndReset} className="w-full h-12 gap-2 shadow-lg shadow-primary/20 bg-primary font-bold">
            <ShieldCheck className="h-4 w-4" /> Re-authenticate Session
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground hover:text-white">
            Return to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight uppercase">Master <span className="text-primary">Terminal</span></h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-mono">Core Control Center // Live Data</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto p-1.5 bg-card/40 glass-morphism rounded-xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white">
              <ShoppingBag className="h-4 w-4" /> View Store
            </Button>
          </Link>
          <Link href="/admin/new">
            <Button size="sm" className="gap-2 font-bold shadow-lg shadow-primary/20">
              <PlusCircle className="h-4 w-4" /> New Product
            </Button>
          </Link>
          <Link href="/admin/sales">
            <Button variant="secondary" size="sm" className="gap-2">
              <History className="h-4 w-4" /> Sales Log
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-morphism border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Feed</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(totalRevenue)}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-tighter">
              <Zap className="h-3 w-3" /> Real-time
            </p>
          </CardContent>
        </Card>
        <Card className="glass-morphism border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Priority Logistics</p>
          </CardContent>
        </Card>
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inventory SKU</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Active Catalog</p>
          </CardContent>
        </Card>
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span></div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">{feedbackCount} Verified Reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {lowStockItems.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5 glass-morphism">
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive font-headline font-bold uppercase text-sm">Critical Stock Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-xl shadow-inner">
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-destructive font-mono uppercase tracking-tighter">{item.quantity} Units Remaining</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 h-8 border-destructive/20 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleUpdateStock(item.id, item.quantity)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-tight">Inventory Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-4">Component Name</th>
                      <th className="px-4 py-4">Class</th>
                      <th className="px-4 py-4">Price</th>
                      <th className="px-4 py-4 text-center">Units</th>
                      <th className="px-4 py-4 text-right">Commands</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products?.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-5 font-bold max-w-[200px] truncate">{p.name}</td>
                        <td className="px-4 py-5"><Badge variant="secondary" className="text-[9px] uppercase border-none bg-primary/10 text-primary">{p.category}</Badge></td>
                        <td className="px-4 py-5 font-mono text-xs text-primary">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-5 text-center">
                          <Badge variant={p.quantity < 5 ? "destructive" : "outline"} className="font-mono text-[10px] h-5">{p.quantity}</Badge>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleUpdateStock(p.id, p.quantity)}><RefreshCw className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-morphism">
            <CardHeader className="pb-2 border-b border-white/5 mb-4">
              <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Live Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {sales?.slice(0, 5).map(sale => (
                <div key={sale.id} className="p-3 border border-white/5 rounded-xl bg-black/20 flex flex-col gap-1 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[11px] truncate">{sale.customerName}</span>
                    <span className="text-primary font-mono text-[11px]">{formatCurrency(sale.price)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{sale.productName}</p>
                </div>
              ))}
              {(!sales || sales.length === 0) && <p className="text-[10px] text-center text-muted-foreground py-4 uppercase font-mono tracking-widest opacity-50">No Sales Recorded</p>}
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardHeader className="pb-2 border-b border-white/5 mb-4">
              <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-yellow-500" /> Customer Voice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {feedback?.slice(0, 3).map(f => (
                <div key={f.id} className="p-3 border border-white/5 rounded-xl bg-black/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`h-2.5 w-2.5 ${star <= f.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] italic text-muted-foreground line-clamp-2 font-mono">"{f.comment}"</p>
                  <p className="text-[9px] font-bold text-primary uppercase truncate tracking-widest">{f.productName}</p>
                </div>
              ))}
              {(!feedback || feedback.length === 0) && <p className="text-[10px] text-center text-muted-foreground py-4 uppercase font-mono tracking-widest opacity-50">No Reviews Recorded</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
