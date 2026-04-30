'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useParams } from 'next/navigation';

interface ProductDetail {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  freshnessScore: number;
  source: string;
  category: string;
  harvestTime?: string;
  qualityGrade?: string;
  stock?: number;
}

const MOCK_PRODUCTS: ProductDetail[] = [
  { _id: '1', name: 'Fresh Organic Tomatoes', description: 'Locally grown, pesticide-free tomatoes, picked fresh this morning. Rich in lycopene and vitamin C, these tomatoes are perfect for salads, curries, and sauces.', price: 45, imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop', freshnessScore: 98, source: 'Farmer', category: 'Vegetables', harvestTime: '5 hours ago', qualityGrade: 'A', stock: 100 },
  { _id: '2', name: 'Green Spinach Bundle', description: 'Crisp and nutrient-rich spinach leaves, ideal for smoothies, sabzi, and salads. Loaded with iron and vitamins.', price: 30, imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop', freshnessScore: 95, source: 'Warehouse', category: 'Vegetables', harvestTime: '8 hours ago', qualityGrade: 'A', stock: 50 },
  { _id: '3', name: 'Alphonso Mangoes', description: 'Sweet, juicy, and premium quality Alphonso mangoes from Ratnagiri. The king of fruits at its finest.', price: 250, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop', freshnessScore: 90, source: 'Farmer', category: 'Fruits', harvestTime: '12 hours ago', qualityGrade: 'A', stock: 30 },
  { _id: '4', name: 'Whole Wheat Bread', description: 'Freshly baked, 100% whole wheat bread with no preservatives. Perfect for healthy sandwiches and toast.', price: 50, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery', harvestTime: '2 hours ago', qualityGrade: 'A', stock: 20 },
  { _id: '5', name: 'Fresh Broccoli', description: 'Farm-fresh broccoli heads, packed with fiber and vitamins. Great for stir-fries and soups.', price: 60, imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&auto=format&fit=crop', freshnessScore: 92, source: 'Farmer', category: 'Vegetables', harvestTime: '6 hours ago', qualityGrade: 'A', stock: 40 },
  { _id: '6', name: 'Red Apples', description: 'Crunchy, sweet Kashmir red apples. A daily dose of health and taste.', price: 120, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop', freshnessScore: 88, source: 'Warehouse', category: 'Fruits', harvestTime: '24 hours ago', qualityGrade: 'B', stock: 80 },
  { _id: '7', name: 'Fresh Carrots', description: 'Orange, crunchy carrots straight from the farm. Rich in beta-carotene and perfect for juices.', price: 35, imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop', freshnessScore: 96, source: 'Farmer', category: 'Vegetables', harvestTime: '4 hours ago', qualityGrade: 'A', stock: 70 },
  { _id: '8', name: 'Organic Bananas', description: 'Naturally ripened organic bananas. High in potassium and a perfect on-the-go snack.', price: 55, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop', freshnessScore: 94, source: 'Warehouse', category: 'Fruits', harvestTime: '10 hours ago', qualityGrade: 'A', stock: 60 },
  { _id: '9', name: 'Basmati Rice 1kg', description: 'Premium long-grain basmati rice. Aromatic and perfect for biryanis and pulao.', price: 180, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery', harvestTime: 'N/A', qualityGrade: 'A', stock: 200 },
  { _id: '10', name: 'Fresh Green Peas', description: 'Sweet and tender green peas, shelled and ready to cook. Farm-fresh quality.', price: 40, imageUrl: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800&auto=format&fit=crop', freshnessScore: 97, source: 'Farmer', category: 'Vegetables', harvestTime: '3 hours ago', qualityGrade: 'A', stock: 55 },
  { _id: '11', name: 'Strawberries Pack', description: 'Juicy red strawberries from Mahabaleshwar. Perfect for desserts and smoothies.', price: 150, imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop', freshnessScore: 85, source: 'Farmer', category: 'Fruits', harvestTime: '18 hours ago', qualityGrade: 'B', stock: 25 },
  { _id: '12', name: 'Cold Pressed Olive Oil', description: 'Pure cold-pressed extra virgin olive oil. Heart-healthy cooking and dressing.', price: 350, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop', freshnessScore: 100, source: 'Warehouse', category: 'Grocery', harvestTime: 'N/A', qualityGrade: 'A', stock: 45 },
];

function FreshnessBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  const label = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Fair';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">Freshness</span>
        <span className="font-bold text-green-600">{score}% — {label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const id = params.id as string;
    const found = MOCK_PRODUCTS.find((p) => p._id === id);
    if (found) {
      setProduct(found);
    } else {
      // Try backend
      fetch(`http://localhost:5000/api/products/${id}`)
        .then((res) => res.json())
        .then((data) => setProduct(data))
        .catch(() => setProduct(MOCK_PRODUCTS[0]));
    }
  }, [params.id]);

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-lg">
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md">
              {product.source === 'Farmer' ? '🚜 Farmer Direct' : '🏭 Warehouse'}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit mb-4">{product.category}</span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">{product.description}</p>

            <div className="text-4xl font-extrabold text-green-600 mb-6">₹{product.price}</div>

            {/* Freshness Transparency */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">🌱 Freshness Transparency</h3>
              <FreshnessBar score={product.freshnessScore} />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Harvested</p>
                  <p className="font-bold text-gray-900 text-sm">{product.harvestTime || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Quality Grade</p>
                  <p className="font-bold text-gray-900 text-sm">Grade {product.qualityGrade || 'A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">In Stock</p>
                  <p className="font-bold text-gray-900 text-sm">{product.stock} units</p>
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer">−</button>
                <span className="w-12 h-12 flex items-center justify-center font-bold text-lg border-x border-gray-200">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer">+</button>
              </div>
              <button
                onClick={() => {
                  for (let i = 0; i < quantity; i++) addToCart(product);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                Add to Cart — ₹{product.price * quantity}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
