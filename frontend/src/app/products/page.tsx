'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  freshnessScore: number;
  source: string;
  category?: string;
  description?: string;
}

const MOCK_PRODUCTS: Product[] = [
  { _id: '1', name: 'Fresh Organic Tomatoes', price: 45, imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop', freshnessScore: 98, source: 'Farmer', category: 'Vegetables' },
  { _id: '2', name: 'Green Spinach Bundle', price: 30, imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop', freshnessScore: 95, source: 'Warehouse', category: 'Vegetables' },
  { _id: '3', name: 'Alphonso Mangoes', price: 250, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop', freshnessScore: 90, source: 'Farmer', category: 'Fruits' },
  { _id: '4', name: 'Whole Wheat Bread', price: 50, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery' },
  { _id: '5', name: 'Fresh Broccoli', price: 60, imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&auto=format&fit=crop', freshnessScore: 92, source: 'Farmer', category: 'Vegetables' },
  { _id: '6', name: 'Red Apples', price: 120, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop', freshnessScore: 88, source: 'Warehouse', category: 'Fruits' },
  { _id: '7', name: 'Fresh Carrots', price: 35, imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop', freshnessScore: 96, source: 'Farmer', category: 'Vegetables' },
  { _id: '8', name: 'Organic Bananas', price: 55, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop', freshnessScore: 94, source: 'Warehouse', category: 'Fruits' },
  { _id: '9', name: 'Basmati Rice 1kg', price: 180, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery' },
  { _id: '10', name: 'Fresh Green Peas', price: 40, imageUrl: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800&auto=format&fit=crop', freshnessScore: 97, source: 'Farmer', category: 'Vegetables' },
  { _id: '11', name: 'Strawberries Pack', price: 150, imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop', freshnessScore: 85, source: 'Farmer', category: 'Fruits' },
  { _id: '12', name: 'Cold Pressed Olive Oil', price: 350, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  const categories = ['All', 'Vegetables', 'Fruits', 'Grocery'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch {
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Fresh Produce</h1>
          <p className="text-gray-500">Handpicked quality, straight from farms to you.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-sm"
            />
          </div>
          <div className="flex space-x-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-5xl mb-4 block">🥬</span>
            <p className="text-lg">No products found. Try a different filter!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
