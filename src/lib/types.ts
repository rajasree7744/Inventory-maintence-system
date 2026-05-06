export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  description: string;
  category: string;
  brand: string;
  imageurl: string;
  avgRating?: number;
  reviewCount?: number;
  totalRatingSum?: number;
  features?: string[];
  isHighDemand?: boolean;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Sale {
  id?: string;
  productId: string;
  productName: string;
  customerName: string;
  contact: string;
  address: string;
  quantity: number;
  price: number;
  timestamp: any;
}

export interface Feedback {
  id?: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  defect: boolean;
  createdat: any;
}

export interface Alert {
  id?: string;
  message: string;
  type: 'lowstock' | 'negativefeedback';
  productId?: string;
  created_at: any;
}
