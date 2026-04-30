'use client';

import './globals.css';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import { CartProvider } from '@/context/CartContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>PantryHub — Farm Fresh to Your Doorstep</title>
        <meta name="description" content="A freshness-first, farmer-connected, intelligent grocery platform focused on transparency, affordability, and sustainability." />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <CartSidebar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-900 text-gray-400 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-xl font-bold text-white mb-2">PantryHub<span className="text-emerald-400">.</span></p>
              <p className="text-sm">Freshness-first · Farmer-connected · AI-powered grocery ecosystem</p>
              <p className="text-xs mt-4">&copy; 2026 PantryHub. All rights reserved.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
