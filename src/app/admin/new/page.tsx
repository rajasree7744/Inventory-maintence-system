"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PackagePlus, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const CATEGORIES = ["GPU", "CPU", "RAM", "SSD", "Motherboard", "Case", "Monitor", "PSU", "Cooler", "Audio", "Keyboard", "Mouse"];

export default function NewProductPage() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get("name") as string,
      brand: formData.get("brand") as string,
      category: formData.get("category") as string,
      price: Number(formData.get("price")),
      quantity: Number(formData.get("quantity")),
      description: formData.get("description") as string,
      imageurl: formData.get("imageurl") as string,
      createdAt: serverTimestamp(),
    };

    try {
      const productsRef = collection(db, "products");
      await addDoc(productsRef, productData);
      
      toast({
        title: "Product Added",
        description: `${productData.name} has been added to the catalog.`,
      });
      
      router.push("/admin");
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: "products",
        operation: "create",
        requestResourceData: productData,
      });
      errorEmitter.emit("permission-error", permissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors group">
          <ShoppingBag className="h-4 w-4" />
          <span className="text-sm font-medium">Exit to Customer Page</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold">Add New <span className="text-primary">Product</span></h1>
        <p className="text-sm text-muted-foreground">Expand the SmartLink inventory.</p>
      </div>

      <Card className="border-primary/10 shadow-xl bg-card/60 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-primary" /> Product Details
            </CardTitle>
            <CardDescription>Fill in the technical specifications for the new product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" placeholder="e.g., NVIDIA RTX 5090 FE" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" placeholder="e.g., NVIDIA, Intel, ASUS" required className="bg-background/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" name="price" type="number" placeholder="185000" required className="bg-background/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input id="quantity" name="quantity" type="number" placeholder="10" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageurl">Image URL</Label>
                <Input id="imageurl" name="imageurl" type="url" placeholder="https://unsplash.com/..." required className="bg-background/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Detailed features, specifications, and performance metrics." 
                className="min-h-[120px] bg-background/50" 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-white/5 pt-6">
            <Link href="/admin">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px] shadow-lg shadow-primary/20">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
