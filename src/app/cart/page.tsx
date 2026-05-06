"use client"

import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  
  const gst = cartTotal * 0.18;
  const totalWithTax = cartTotal + gst;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="p-6 bg-primary/10 rounded-full mb-6">
            <ShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-headline font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Looks like you haven't added any high-performance hardware yet. Build your dream setup today.
          </p>
          <Link href="/">
            <Button size="lg" className="gap-2">
              Browse Inventory <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-grow space-y-6">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-headline font-bold">Shopping <span className="text-primary">Cart</span></h1>
                <p className="text-muted-foreground">{cart.length} unique components selected</p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearCart}>
                Clear All
              </Button>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative h-24 w-32 rounded-md overflow-hidden bg-muted">
                      <Image 
                        src={item.imageurl || "https://picsum.photos/seed/fallback/600/400"} 
                        alt={item.name} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{item.brand} • {item.category}</p>
                      <p className="text-primary font-bold font-mono">{formatCurrency(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.cartQuantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <p className="font-bold font-mono text-lg">{formatCurrency(item.price * item.cartQuantity)}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-50 hover:opacity-100 transition-opacity"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="w-full lg:w-96">
            <Card className="sticky top-24 border-primary/20 bg-primary/5 shadow-xl shadow-primary/5">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                  Order Summary
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18% Hardware Tax)</span>
                    <span className="font-mono">{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-500 font-medium">FREE</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-primary font-mono">{formatCurrency(totalWithTax)}</span>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-4 text-[10px] text-muted-foreground flex items-start gap-3 border border-border/50">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <p>Secure hardware transaction via SmartLink encrypted payment gateway. Your order is eligible for technical warranty support.</p>
                </div>

                <Button className="w-full h-12 text-lg font-bold gap-2">
                  Complete Checkout <ArrowRight className="h-5 w-5" />
                </Button>
                
                <Link href="/">
                  <Button variant="ghost" className="w-full mt-2 text-muted-foreground">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
