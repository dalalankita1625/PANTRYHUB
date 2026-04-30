'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartSidebar() {
  const { items, isCartOpen, toggleCart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={toggleCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Your Cart <span className="text-sm font-normal text-gray-500">({totalItems} items)</span>
          </h2>
          <button
            onClick={toggleCart}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-5xl mb-4">🛒</span>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Start adding fresh produce!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                  <p className="text-sm font-bold text-green-600">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-2xl font-bold text-gray-900">₹{totalPrice}</span>
            </div>
            <Link
              href="/checkout"
              onClick={toggleCart}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
