"use client"

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Product } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, AlertCircle, Flame, ShoppingBag } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const MASTER_CATALOG = [
  // GPUs
  { name: "NVIDIA RTX 5090 Founder's Edition", brand: "NVIDIA", category: "GPU", price: 195000, originalPrice: 225000, quantity: 10, description: "The definitive 8K gaming flagship with 32GB G7 memory.", features: ["8K DLSS 3.5", "32GB GDDR7", "Triple Fan"], imageurl: "https://images.unsplash.com/photo-1614214603362-e61183c5095d?auto=format&fit=crop&q=80&w=800", avgRating: 5.0, reviewCount: 42, totalRatingSum: 210, isHighDemand: true },
  { name: "ASUS ROG Strix RTX 4080 Super", brand: "ASUS", category: "GPU", price: 115000, originalPrice: 135000, quantity: 10, description: "Unmatched cooling and overclocking potential for 4K gaming.", features: ["Aura Sync", "3.5 Slot Design", "AI Powered"], imageurl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 88, totalRatingSum: 422 },
  { name: "AMD Radeon RX 7900 XTX", brand: "AMD", category: "GPU", price: 98000, originalPrice: 110000, quantity: 10, description: "AMD's flagship RDNA 3 beast with massive 24GB VRAM.", features: ["FSR 3 Ready", "24GB VRAM", "DisplayPort 2.1"], imageurl: "https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800", avgRating: 4.7, reviewCount: 120, totalRatingSum: 564 },
  
  // CPUs
  { name: "Intel Core i9-14900K", brand: "Intel", category: "CPU", price: 58000, originalPrice: 65000, quantity: 10, description: "24 cores of pure enthusiast-grade processing power.", features: ["6.0GHz Boost", "LGA 1700", "PCIe 5.0"], imageurl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 156, totalRatingSum: 764 },
  { name: "AMD Ryzen 9 7950X", brand: "AMD", category: "CPU", price: 52000, originalPrice: 62000, quantity: 10, description: "The ultimate productivity processor for creators and gamers.", features: ["AM5 Socket", "Zen 4", "5.7GHz Max"], imageurl: "https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 95, totalRatingSum: 456 },
  { name: "AMD Ryzen 7 7800X3D", brand: "AMD", category: "CPU", price: 38000, originalPrice: 45000, quantity: 10, description: "The world's fastest gaming processor with 3D V-Cache.", features: ["3D V-Cache", "AM5", "High Efficiency"], imageurl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", avgRating: 5.0, reviewCount: 240, totalRatingSum: 1200 },

  // Motherboards
  { name: "ASUS ROG Maximus Z790 Hero", brand: "ASUS", category: "Motherboard", price: 62000, originalPrice: 72000, quantity: 10, description: "Premium Intel motherboard with extreme power delivery.", features: ["WiFi 7", "PCIe 5.0", "AI Overclock"], imageurl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 65, totalRatingSum: 318 },
  { name: "MSI MPG X670E Carbon WiFi", brand: "MSI", category: "Motherboard", price: 48000, originalPrice: 55000, quantity: 10, description: "High-performance AM5 motherboard for Ryzen 7000/9000.", features: ["DDR5 Boost", "Gen 5 M.2", "WiFi 6E"], imageurl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800", avgRating: 4.7, reviewCount: 42, totalRatingSum: 197 },

  // Peripherals
  { name: "Corsair K100 RGB Mechanical", brand: "Corsair", category: "Keyboard", price: 22000, originalPrice: 26000, quantity: 10, description: "Optical-mechanical gaming keyboard with unmatched speed.", features: ["OPX Switches", "PBT Keycaps", "RGB"], imageurl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 110, totalRatingSum: 528 },
  { name: "Logitech G Pro X Superlight 2", brand: "Logitech", category: "Mouse", price: 15000, originalPrice: 18000, quantity: 10, description: "The lightest, fastest pro mouse ever made by Logitech.", features: ["60g Weight", "Hero 2 Sensor", "Wireless"], imageurl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 180, totalRatingSum: 882 },
  { name: "Elgato Facecam Pro 4K60", brand: "Elgato", category: "Peripherals", price: 28000, originalPrice: 32000, quantity: 10, description: "The first 4K60 webcam for professional streamers.", features: ["4K 60FPS", "Sony Sensor", "Pro Software"], imageurl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 55, totalRatingSum: 264 },
  { name: "Shure SM7B Studio Mic", brand: "Shure", category: "Peripherals", price: 38000, originalPrice: 42000, quantity: 10, description: "The industry standard for podcasts and vocal recording.", features: ["XLR Interface", "Pop Filter", "Classic Sound"], imageurl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800", avgRating: 5.0, reviewCount: 310, totalRatingSum: 1550 },

  // Storage/Memory
  { name: "64GB G.Skill Trident Z5 RGB", brand: "G.Skill", category: "RAM", price: 24000, originalPrice: 29000, quantity: 10, description: "Ultra-low latency DDR5 kit for extreme overclocking.", features: ["6400MT/s", "RGB Lighting", "Intel XMP"], imageurl: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 89, totalRatingSum: 427 },
  { name: "4TB Samsung 990 Pro NVMe", brand: "Samsung", category: "Storage", price: 32000, originalPrice: 42000, quantity: 10, description: "Blistering read/write speeds up to 7,450 MB/s.", features: ["Gen 4x4", "Heat Sync", "V-NAND"], imageurl: "https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 210, totalRatingSum: 1029, isHighDemand: true },
  { name: "WD Black 10TB HDD", brand: "Western Digital", category: "Storage", price: 28000, originalPrice: 34000, quantity: 10, description: "High-capacity performance storage for massive libraries.", features: ["7200 RPM", "256MB Cache", "Reliable"], imageurl: "https://images.unsplash.com/photo-1531492746377-26be2486d6e9?auto=format&fit=crop&q=80&w=800", avgRating: 4.6, reviewCount: 72, totalRatingSum: 331 },

  // Displays
  { name: "Samsung Odyssey Neo G9 49\"", brand: "Samsung", category: "Monitor", price: 185000, originalPrice: 210000, quantity: 10, description: "Immersive dual-QHD ultrawide gaming experience.", features: ["Mini-LED", "240Hz", "1000R Curve"], imageurl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", avgRating: 4.7, reviewCount: 95, totalRatingSum: 446 },
  { name: "Alienware 34\" QD-OLED", brand: "Alienware", category: "Monitor", price: 95000, originalPrice: 115000, quantity: 10, description: "Incredible contrast and color accuracy for pro gaming.", features: ["OLED Panel", "175Hz", "G-Sync Ultimate"], imageurl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 150, totalRatingSum: 735 },
  { name: "LG Ultragear 27\" 4K", brand: "LG", category: "Monitor", price: 68000, originalPrice: 78000, quantity: 10, description: "Crystal clear 4K visuals with Nano-IPS technology.", features: ["4K HDR600", "144Hz", "HDMI 2.1"], imageurl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 220, totalRatingSum: 1056 },

  // Networking
  { name: "Netgear Nighthawk Wi-Fi 7", brand: "Netgear", category: "Networking", price: 55000, originalPrice: 65000, quantity: 10, description: "The next generation of wireless speed and capacity.", features: ["WiFi 7 BE", "Multi-Gig Ports", "Quad-Band"], imageurl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 30, totalRatingSum: 147 },
  { name: "Ubiquiti UniFi Dream Machine", brand: "Ubiquiti", category: "Networking", price: 42000, originalPrice: 48000, quantity: 10, description: "All-in-one console for pro-grade home networking.", features: ["Security Gateway", "Switch", "Controller"], imageurl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 180, totalRatingSum: 882 },
  { name: "ASUS ROG 10Gbps Network Card", brand: "ASUS", category: "Networking", price: 12000, originalPrice: 15000, quantity: 10, description: "Upgrade your workstation with ultra-fast networking.", features: ["10Gbps Speed", "PCIe Card", "Gaming Opt"], imageurl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800", avgRating: 4.7, reviewCount: 25, totalRatingSum: 117 },
  
  // Additional Unique Items
  { name: "SteelSeries Apex Pro TKL", brand: "SteelSeries", category: "Keyboard", price: 18000, originalPrice: 22000, quantity: 10, description: "Adjustable actuation switches for pure gaming performance.", features: ["OmniPoint", "OLED Screen", "TKL Design"], imageurl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 340, totalRatingSum: 1632 },
  { name: "Razer DeathAdder V3 Pro", brand: "Razer", category: "Mouse", price: 14000, originalPrice: 17000, quantity: 10, description: "Iconic ergonomic mouse refined for esports.", features: ["Optical Sw", "8K Hz Polling", "Ultralight"], imageurl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 205, totalRatingSum: 1004 },
  { name: "ASUS ROG Swift 360Hz", brand: "ASUS", category: "Monitor", price: 55000, originalPrice: 65000, quantity: 10, description: "Blistering fast refresh rate for competitive play.", features: ["360Hz", "IPS Panel", "NVIDIA Reflex"], imageurl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 120, totalRatingSum: 576 },
  { name: "Sony WH-1000XM5 Headset", brand: "Sony", category: "Peripherals", price: 29000, originalPrice: 35000, quantity: 10, description: "Industry-leading noise cancellation for work and play.", features: ["ANC Tech", "30H Battery", "Multipoint"], imageurl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 450, totalRatingSum: 2205 },
  { name: "WD_BLACK SN850X 2TB", brand: "Western Digital", category: "Storage", price: 18000, originalPrice: 22000, quantity: 10, description: "Official licensed storage for the ultimate PC build.", features: ["7300MB/s", "Game Mode 2.0", "Heatsink"], imageurl: "https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 310, totalRatingSum: 1488 },
  { name: "Crucial Pro 32GB DDR5", brand: "Crucial", category: "RAM", price: 11000, originalPrice: 13000, quantity: 10, description: "Plug-and-play high-performance memory for pro builds.", features: ["6000MT/s", "Sleek Look", "Lifetime War"], imageurl: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800", avgRating: 4.7, reviewCount: 55, totalRatingSum: 258 },
  { name: "TP-Link Archer BE800", brand: "TP-Link", category: "Networking", price: 48000, originalPrice: 55000, quantity: 10, description: "Cutting-edge WiFi 7 performance for the home.", features: ["WiFi 7", "Dual 10G", "HomeShield"], imageurl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 45, totalRatingSum: 216 },
  { name: "Lian Li O11 Dynamic EVO", brand: "Lian Li", category: "Case", price: 16000, originalPrice: 19000, quantity: 10, description: "The definitive enthusiast chassis for liquid cooling.", features: ["Modular", "Dual Chamber", "Panoramic"], imageurl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=800", avgRating: 4.9, reviewCount: 280, totalRatingSum: 1372 },
  { name: "NZXT Kraken Elite 360", brand: "NZXT", category: "Cooler", price: 24000, originalPrice: 28000, quantity: 10, description: "AIO liquid cooler with customizable LCD display.", features: ["LCD Screen", "Quiet Fans", "RGB"], imageurl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", avgRating: 4.8, reviewCount: 140, totalRatingSum: 672 }
];

export default function Storefront() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    async function maintenanceAndSeed() {
      if (!db || typeof window === 'undefined') return;
      
      try {
        setIsInitializing(true);
        const productsRef = collection(db, "products");
        const allDocsSnapshot = await getDocs(productsRef);
        
        // Final deduplication version to ensure clean inventory
        const currentSeedVersion = 'v8_final_cleanup';
        const isSeeded = localStorage.getItem('hardware_seed_version');

        if (isSeeded !== currentSeedVersion) {
          const batch = writeBatch(db);
          allDocsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();

          for (const product of MASTER_CATALOG) {
            await addDoc(productsRef, {
              ...product,
              createdAt: serverTimestamp()
            });
          }
          localStorage.setItem('hardware_seed_version', currentSeedVersion);
        }
      } catch (err: any) {
        // Graceful catch for any connection or initialization errors
        console.warn("Maintenance or seeding issue handled:", err.message);
        // Only show fatal errors if they impact basic product visibility
        if (err.code !== 'permission-denied') {
          setErrorState("Failed to sync inventory. Please check your connection.");
        }
      } finally {
        setIsInitializing(false);
      }
    }

    maintenanceAndSeed();
  }, [db]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"), orderBy("name", "asc"));
  }, [db]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const trendingProducts = products 
    ? [...products].sort((a, b) => ((b.avgRating || 0) * (b.reviewCount || 0)) - ((a.avgRating || 0) * (a.reviewCount || 0))).slice(0, 4)
    : [];

  const [currentYear, setCurrentYear] = useState<number | null>(null);
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex justify-center items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-headline font-bold mb-4 tracking-tight">
            Next-Gen <span className="text-primary">Performance</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            30+ high-performance computer hardware items for enthusiasts, gamers, and professionals.
          </p>
        </header>

        {errorState && (
          <div className="max-w-2xl mx-auto mb-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Issue</AlertTitle>
              <AlertDescription>{errorState}</AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading || isInitializing ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse font-medium">
              {isInitializing ? "Performing database cleanup..." : "Syncing inventory..."}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Trending Section */}
            {trendingProducts.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Flame className="h-6 w-6 text-primary fill-primary" />
                  </div>
                  <h2 className="text-3xl font-headline font-bold">🔥 Trending <span className="text-primary">This Week</span></h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingProducts.map(product => (
                    <ProductCard key={product.id} product={product} isTrendingSection />
                  ))}
                </div>
              </section>
            )}

            {/* All Products Section */}
            <section className="animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-headline font-bold">Full <span className="text-primary">Inventory</span></h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{products?.length || 0} unique items available</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products?.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {!products?.length && !isLoading && !isInitializing && (
                  <div className="col-span-full text-center py-20 text-muted-foreground">
                    Inventory is currently empty.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-20 py-10 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold">SmartLink Computer Systems</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>&copy; {currentYear ?? "2026"} SmartLink Systems. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
