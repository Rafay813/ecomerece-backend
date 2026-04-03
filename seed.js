import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import User from "./models/User.js";

dotenv.config();

const sampleProducts = [
  {
    name: "Canon Camera EOS 2000, Black 10x zoom",
    price: 998.0, originalPrice: 1128.0,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    images: ["https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400&h=400&fit=crop"],
    description: "Professional DSLR camera with 10x optical zoom, 24MP sensor, and advanced autofocus system for stunning photography.",
    category: "Cameras", brand: "Canon", stock: 45, rating: 7.5, orders: 154,
    freeShipping: true, discount: 12, condition: "Brand new",
    features: ["Metallic", "24MP Sensor"], isFeatured: true,
  },
  {
    name: "GoPro HERO6 4K Action Camera - Black",
    price: 349.0,
    image: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=400&fit=crop",
    description: "4K action camera with waterproof design, voice control, and advanced stabilization.",
    category: "Cameras", brand: "GoPro", stock: 30, rating: 7.5, orders: 154,
    freeShipping: true, discount: 0, condition: "Brand new",
    features: ["Waterproof", "4K Video"], isFeatured: false,
  },
  {
    name: "MacBook Pro 16-inch Space Gray",
    price: 1999.0, originalPrice: 2199.0,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    description: "Powerful laptop with M2 Pro chip, 16GB unified memory, and 512GB SSD.",
    category: "Laptops", brand: "Apple", stock: 20, rating: 9.0, orders: 89,
    freeShipping: true, discount: 10, condition: "Brand new",
    features: ["M2 Chip", "16GB RAM", "Large Memory", "Metallic"], isFeatured: true,
  },
  {
    name: "Amazfit GTR 4 Smart Watch Grey",
    price: 149.99, originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    description: "Smart watch with GPS, health monitoring, 150+ sports modes, and 14-day battery life.",
    category: "Watches", brand: "Amazfit", stock: 80, rating: 7.8, orders: 210,
    freeShipping: false, discount: 25, condition: "Brand new",
    features: ["GPS", "Health Monitor", "Waterproof"], isFeatured: true,
  },
  {
    name: "Sony WH-1000XM4 Wireless Headphones",
    price: 279.99, originalPrice: 349.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    description: "Industry-leading noise canceling headphones with 30-hour battery life.",
    category: "Audio", brand: "Sony", stock: 55, rating: 9.2, orders: 432,
    freeShipping: true, discount: 20, condition: "Brand new",
    features: ["Noise Canceling", "30hr Battery"], isFeatured: true,
  },
  {
    name: "Xiaomi Mi 11 Ultra Smartphone",
    price: 699.0, originalPrice: 799.0,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    description: "Flagship smartphone with 108MP triple camera, 120Hz AMOLED display, 5G.",
    category: "Smartphones", brand: "Xiaomi", stock: 35, rating: 8.0, orders: 178,
    freeShipping: true, discount: 12, condition: "Brand new",
    features: ["5G", "108MP Camera", "120Hz Display"], isFeatured: false,
  },
  {
    name: "Gaming Headset Blue LED RGB",
    price: 35.0,
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop",
    description: "Immersive gaming headset with 7.1 surround sound and RGB lighting.",
    category: "Audio", brand: "HyperX", stock: 100, rating: 7.0, orders: 305,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["7.1 Surround", "RGB"], isFeatured: false,
  },
  {
    name: "Dell XPS 15 Laptop",
    price: 1499.0, originalPrice: 1799.0,
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop",
    description: "Premium thin and light laptop with 4K OLED display, Intel Core i7, 32GB RAM.",
    category: "Laptops", brand: "Dell", stock: 18, rating: 8.5, orders: 67,
    freeShipping: true, discount: 17, condition: "Brand new",
    features: ["4K OLED", "RTX Graphics", "32GB RAM"], isFeatured: true,
  },
  {
    name: "iPhone 15 Pro Max 256GB Titanium",
    price: 1199.0,
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop",
    description: "Apple's most advanced iPhone with titanium design, A17 Pro chip, 48MP camera.",
    category: "Smartphones", brand: "Apple", stock: 40, rating: 9.5, orders: 520,
    freeShipping: true, discount: 0, condition: "Brand new",
    features: ["A17 Pro Chip", "48MP Camera", "Titanium Body"], isFeatured: true,
  },
  {
    name: "Men's Classic Polo T-Shirt Teal",
    price: 10.30,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    description: "Classic polo shirt made from 100% premium cotton. Available in multiple colors.",
    category: "Clothing", brand: "Generic", stock: 200, rating: 6.5, orders: 890,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["100% Cotton"], isFeatured: false,
  },
  {
    name: "Brown Winter Jacket Men Medium",
    price: 10.30, originalPrice: 15.0,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop",
    description: "Warm winter jacket with fur-lined hood and water-resistant outer shell.",
    category: "Clothing", brand: "Generic", stock: 75, rating: 7.2, orders: 234,
    freeShipping: false, discount: 31, condition: "Brand new",
    features: ["Water Resistant", "Fur Hood"], isFeatured: false,
  },
  {
    name: "Men's Denim Shorts Blue",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1560060141-8cd2b700b07e?w=400&h=400&fit=crop",
    description: "Casual denim shorts in classic blue wash. Comfortable everyday shorts.",
    category: "Clothing", brand: "Generic", stock: 150, rating: 6.0, orders: 456,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["Denim", "Relaxed Fit"], isFeatured: false,
  },
  {
    name: "Cream Accent Armchair",
    price: 249.0, originalPrice: 319.0,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    description: "Elegant accent armchair with solid wood legs and premium fabric upholstery.",
    category: "Home & Outdoor", brand: "HomeLiving", stock: 12, rating: 8.0, orders: 34,
    freeShipping: true, discount: 22, condition: "Brand new",
    features: ["Solid Wood Legs", "Premium Fabric"], isFeatured: true,
  },
  {
    name: "Espresso Coffee Machine 15-Bar",
    price: 89.99, originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
    description: "Professional-grade espresso machine with 15-bar pump and milk frother.",
    category: "Home & Outdoor", brand: "DeLonghi", stock: 28, rating: 8.4, orders: 167,
    freeShipping: false, discount: 31, condition: "Brand new",
    features: ["15-Bar Pump", "Milk Frother"], isFeatured: true,
  },
  {
    name: "Multi-Function Blender Pro",
    price: 39.0,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop",
    description: "High-speed professional blender with 1200W motor and 10 preset programs.",
    category: "Home & Outdoor", brand: "Vitamix", stock: 60, rating: 7.5, orders: 289,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["1200W Motor", "BPA-Free"], isFeatured: false,
  },
  {
    name: "DeWalt 20V Cordless Drill Set",
    price: 189.0, originalPrice: 239.0,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
    description: "Professional cordless drill with 20V MAX batteries and LED work light.",
    category: "Tools", brand: "DeWalt", stock: 22, rating: 9.0, orders: 98,
    freeShipping: true, discount: 21, condition: "Brand new",
    features: ["20V MAX", "2 Batteries"], isFeatured: false,
  },
  {
    name: "Electric Smart Kettle 1.7L Black",
    price: 59.99, originalPrice: 79.99,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    description: "Smart electric kettle with temperature control and keep-warm function.",
    category: "Home & Outdoor", brand: "Xiaomi", stock: 65, rating: 8.2, orders: 403,
    freeShipping: false, discount: 25, condition: "Brand new",
    features: ["Temp Control", "Keep Warm"], isFeatured: false,
  },
  {
    name: "Denim Backpack Blue Casual",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    description: "Stylish denim backpack with laptop compartment and multiple pockets.",
    category: "Clothing", brand: "Generic", stock: 110, rating: 6.8, orders: 198,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["Laptop Pocket"], isFeatured: false,
  },
  {
    name: "Leather Travel Wallet Blue",
    price: 34.0,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    description: "Genuine leather travel wallet with RFID blocking technology.",
    category: "Clothing", brand: "Generic", stock: 90, rating: 7.6, orders: 312,
    freeShipping: false, discount: 0, condition: "Brand new",
    features: ["Genuine Leather", "RFID Blocking"], isFeatured: false,
  },
  {
    name: "Samsung 65\" 4K QLED Smart TV",
    price: 1299.0, originalPrice: 1599.0,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=400&h=400&fit=crop",
    description: "Quantum HDR 4K TV with built-in Alexa, Motion Xcelerator 120Hz and Gaming Mode.",
    category: "Electronics", brand: "Samsung", stock: 15, rating: 9.1, orders: 76,
    freeShipping: true, discount: 19, condition: "Brand new",
    features: ["4K QLED", "120Hz", "Smart TV", "Gaming Mode"], isFeatured: true,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear collections
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create admin user
 

    // Seed products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${inserted.length} products`);

    console.log("\n─────────────────────────────────────");
    console.log("✅ Seed complete!");
    console.log("\n🔐 Login credentials:");
    console.log(`   Admin: admin@store.com  /  Admin@123456`);
    console.log(`   User:  user@store.com   /  User@123456`);
    console.log("─────────────────────────────────────\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
};

seedDB();