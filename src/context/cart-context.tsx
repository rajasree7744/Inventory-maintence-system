"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useUser();
  const db = useFirestore();

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('smartlink_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('smartlink_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync with Firestore if logged in as admin
  useEffect(() => {
    if (!user || !db || user.email !== 'admin@gmail.com') return;

    const cartRef = doc(db, 'carts', user.uid);
    
    // Listen for remote changes
    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteCart = docSnap.data().items as CartItem[];
        // Simple merge/sync logic: only update if local is empty or specifically for initial load
        if (cart.length === 0 && remoteCart.length > 0) {
          setCart(remoteCart);
        }
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  // Push local changes to Firestore
  useEffect(() => {
    if (!user || !db || user.email !== 'admin@gmail.com' || cart.length === 0) return;
    
    const cartRef = doc(db, 'carts', user.uid);
    setDoc(cartRef, { items: cart, updatedAt: new Date() }, { merge: true });
  }, [cart, user, db]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, cartQuantity: quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.cartQuantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartCount, 
      cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
