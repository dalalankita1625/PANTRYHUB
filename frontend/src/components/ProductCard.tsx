import Image from 'next/image';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  freshnessScore: number;
  source: string;
  category?: string;
}

export default function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart?: (product: Product) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      <Link href={`/products/${product._id}`}>
        <div className="relative h-48 w-full overflow-hidden cursor-pointer">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-green-100 flex items-center space-x-1">
            <span className="text-xs font-bold text-green-600">{product.freshnessScore}% Fresh</span>
          </div>
          <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm">
            {product.source}
          </div>
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors">{product.name}</h3>
        </Link>
        <p className="text-2xl font-bold text-green-600 mb-4">₹{product.price}</p>
        <button
          onClick={() => onAddToCart?.(product)}
          className="w-full bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-transparent py-2 px-4 rounded-xl font-medium transition-all duration-300 active:scale-95 cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
