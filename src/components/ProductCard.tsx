
"use client"

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ShoppingCart, MessageSquare, CheckCircle2, TrendingUp, Award, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { analyzeFeedback } from "@/ai/flows/admin-receives-negative-feedback-alerts";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ProductCardProps {
  product: Product;
  isTrendingSection?: boolean;
}

export function ProductCard({ product, isTrendingSection }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;
  const { toast } = useToast();
  const db = useFirestore();
  const { addToCart, cart } = useCart();
  
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.imageurl);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const fallbackImage = "https://picsum.photos/seed/fallback/600/400";
  const isInCart = cart.some(item => item.id === product.id);

  // Trending & Best Seller Logic
  const isTrending = (product.avgRating || 0) >= 4.5 && (product.reviewCount || 0) > 50;
  const isBestSeller = (product.reviewCount || 0) > 100 || (product.avgRating || 0) >= 4.8;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    setIsAdding(true);
    addToCart(product);
    
    toast({
      title: "Added to Cart",
      description: `${product.name} is now in your shopping cart.`,
    });

    setTimeout(() => setIsAdding(false), 1000);
  };

  async function handleFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || selectedRating === 0) {
      toast({ variant: "destructive", title: "Invalid Rating", description: "Please select a star rating." });
      return;
    }

    setIsFeedbackLoading(true);
    const formData = new FormData(event.currentTarget);
    const comment = formData.get("comment") as string;
    const defect = formData.get("defect") === "on";

    try {
      const productRef = doc(db, "products", product.id);
      
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Product not found");
        
        const data = productDoc.data();
        const currentTotal = data.totalRatingSum || 0;
        const currentCount = data.reviewCount || 0;

        const newTotal = currentTotal + selectedRating;
        const newCount = currentCount + 1;
        const newAvg = Number((newTotal / newCount).toFixed(1));

        transaction.update(productRef, {
          totalRatingSum: newTotal,
          reviewCount: newCount,
          avgRating: newAvg
        });

        const feedbackCollection = collection(db, "feedback");
        transaction.set(doc(feedbackCollection), {
          productId: product.id,
          productName: product.name,
          rating: selectedRating,
          comment,
          defect,
          createdat: serverTimestamp()
        });
      });

      const analysis = await analyzeFeedback({
        feedbackId: product.id,
        rating: selectedRating,
        comment
      });

      if (analysis.isNegative) {
        const alertsCollection = collection(db, "alerts");
        await addDoc(alertsCollection, {
          message: `Negative feedback alert for ${product.name}: "${comment}" - ${analysis.reason}`,
          type: "negativefeedback",
          created_at: serverTimestamp()
        });
      }

      toast({ title: "Thank you for your rating!", description: "Your feedback helps us improve." });
      setSelectedRating(0);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl border-white/5 bg-card/50 backdrop-blur-sm",
      isTrendingSection ? "ring-1 ring-primary/20" : "",
      isOutOfStock ? "opacity-60 grayscale-[0.4]" : ""
    )}>
      {/* Trending Sash */}
      {isTrending && (
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg shadow-lg">
            <TrendingUp className="h-3 w-3" />
            TRENDING
          </div>
        </div>
      )}

      {/* High Demand Badge */}
      {product.isHighDemand && (
        <div className={cn(
          "absolute z-10",
          isTrending ? "top-10 left-2" : "top-2 left-2"
        )}>
          <Badge className="bg-orange-600 hover:bg-orange-700 text-white border-none gap-1 font-bold shadow-lg text-[9px] h-5 px-2">
            <Zap className="h-3 w-3" /> HIGH DEMAND
          </Badge>
        </div>
      )}

      {/* Best Seller Badge */}
      {isBestSeller && (
        <Badge className="absolute top-2 right-2 z-10 bg-yellow-500 hover:bg-yellow-600 text-black border-none gap-1 font-bold">
          <Award className="h-3.5 w-3.5" /> Best Seller
        </Badge>
      )}

      <div className="relative aspect-video w-full overflow-hidden">
        <Image 
          src={imgSrc || fallbackImage} 
          alt={product.name} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgSrc(fallbackImage)}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <Badge variant="destructive" className="text-sm font-bold px-4 py-1">OUT OF STOCK</Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-headline font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-3 w-3", (product.avgRating || 0) >= s ? "text-yellow-500 fill-yellow-500" : "text-muted")} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {product.avgRating ? `${product.avgRating} (${product.reviewCount})` : "No reviews"}
          </span>
          <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1.5 border-white/10">{product.brand}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8 leading-relaxed">{product.description}</p>
        <div className="flex flex-col gap-0.5">
          {product.originalPrice && (
            <span className="text-[10px] text-muted-foreground line-through font-mono">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-headline font-bold text-primary">{formatCurrency(product.price)}</span>
            <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-muted-foreground">
              QTY: {product.quantity}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          className={cn(
            "flex-1 font-bold shadow-lg transition-all duration-300",
            isAdding ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90 shadow-primary/20"
          )} 
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <CheckCircle2 className="h-4 w-4 mr-2 animate-in zoom-in" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {isOutOfStock ? "Waitlist" : isAdding ? "Added!" : "Add to Cart"}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-morphism border-white/10">
            <DialogHeader>
              <DialogTitle className="font-headline">Hardware Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFeedback} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technical Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="transition-transform active:scale-90"
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(num)}
                    >
                      <Star 
                        className={cn(
                          "h-8 w-8 transition-colors duration-150",
                          (hoverRating || selectedRating) >= num 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-muted"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Detailed Feedback</Label>
                <Textarea id="comment" name="comment" required placeholder="Performance benchmarks, build quality, etc..." className="bg-background/50 border-white/5" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="defect" name="defect" />
                <Label htmlFor="defect" className="text-sm font-medium leading-none cursor-pointer">
                  Report Hardware Defect
                </Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isFeedbackLoading || selectedRating === 0} className="w-full font-bold">
                  {isFeedbackLoading ? "Uploading..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
