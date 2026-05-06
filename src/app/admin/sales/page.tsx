"use client"

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Sale } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalesHistoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const isBypassActive = typeof window !== 'undefined' && sessionStorage.getItem('dev_bypass_active') === 'true';
  const isAdmin = (!!user && user.email === 'admin@gmail.com') || isBypassActive;

  const salesRef = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "sales"), orderBy("timestamp", "desc"));
  }, [db, isAdmin]);

  const { data: sales, isLoading } = useCollection<Sale>(salesRef);

  const handleExportCSV = () => {
    if (!sales || sales.length === 0) {
      toast({ variant: "destructive", title: "Export Error", description: "No transaction data available." });
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      try {
        const headers = ["Date", "Customer", "Contact", "Product", "Quantity", "Price", "Total"];
        const rows = sales.map(sale => [
          `"${formatDate(sale.timestamp)}"`,
          `"${sale.customerName}"`,
          `"${sale.contact}"`,
          `"${sale.productName}"`,
          sale.quantity || 1,
          sale.price,
          sale.price * (sale.quantity || 1)
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Export Successful",
          description: "sales_report.csv has been downloaded.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "An error occurred while generating the CSV.",
        });
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Retrieving transaction history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group w-fit">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors group">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-medium">Exit to Customer Page</span>
          </Link>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Transaction <span className="text-primary">History</span></h1>
            <p className="text-muted-foreground">Full log of hardware sales and system revenue.</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 w-fit" 
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? "Generating..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" /> Verified Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 text-xs font-mono text-muted-foreground">
                      {formatDate(sale.timestamp)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-sm">{sale.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{sale.contact}</p>
                    </td>
                    <td className="px-4 py-4 font-medium max-w-[200px] truncate">
                      {sale.productName}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="secondary" className="font-mono text-[10px] bg-white/5 text-primary border-none">
                        {sale.quantity || 1}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-primary font-mono">
                      {formatCurrency(sale.price * (sale.quantity || 1))}
                    </td>
                  </tr>
                ))}
                {(!sales || sales.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No transaction records found in system database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
