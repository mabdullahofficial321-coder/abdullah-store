const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'store.db');

let db;

function getDB() {
    if (!db) {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) console.error('DB connection error:', err.message);
        });
        db.run('PRAGMA foreign_keys = ON');
    }
    return db;
}

function initDB() {
    const database = getDB();

    database.serialize(() => {
        // Users table
        database.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Categories table
        database.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT
    )`);

        // Products table
        database.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category_id INTEGER,
      stock INTEGER DEFAULT 100,
      image TEXT,
      rating REAL DEFAULT 4.0,
      reviews_count INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`);

        // Cart table
        database.run(`CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    )`);

        // Orders table
        database.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_name TEXT,
      shipping_email TEXT,
      shipping_phone TEXT,
      shipping_address TEXT,
      payment_method TEXT DEFAULT 'cod',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

        // Order items table
        database.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

        // Seed default data
        seedDefaultData(database);
    });

    console.log('✅ Database initialized');
}

function seedDefaultData(database) {
    // Check if already seeded
    database.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
        if (err || row.count > 0) return;

        // Seed categories
        const categories = [
            ['Electronics', '💻', 'Latest gadgets and electronics'],
            ['Clothing', '👕', 'Trendy fashion and apparel'],
            ['Home & Living', '🏠', 'Furniture and home essentials'],
            ['Sports', '⚽', 'Sports equipment and gear'],
            ['Books', '📚', 'Books and educational material'],
        ];

        const catStmt = database.prepare('INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)');
        categories.forEach(c => catStmt.run(c));
        catStmt.finalize();

        // Seed products
        const products = [
            // Electronics (cat 1)
            ['Wireless Bluetooth Headphones', 'Premium noise-cancelling headphones with 30h battery life and crystal-clear audio quality.', 4999, 7999, 1, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 4.8, 245, 1],
            ['Smartphone Pro Max', 'Latest flagship smartphone with 108MP camera, 5G, and 5000mAh battery.', 89999, 99999, 1, 30, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 4.7, 512, 1],
            ['Laptop Ultra Slim', '14-inch ultra-slim laptop with i7 processor, 16GB RAM, 512GB SSD.', 74999, 89999, 1, 20, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 4.6, 189, 1],
            ['Smart Watch Series 5', 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.', 12999, 17999, 1, 80, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 4.5, 334, 0],
            ['Wireless Earbuds Pro', 'True wireless earbuds with ANC, 24h total battery, IPX5 waterproof.', 3499, 5999, 1, 100, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 4.4, 678, 0],
            // Clothing (cat 2)
            ['Premium Cotton T-Shirt', 'Soft 100% organic cotton t-shirt, available in multiple colors and sizes.', 799, 1299, 2, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 4.6, 892, 1],
            ['Slim Fit Jeans', 'Stretch slim-fit denim jeans, comfortable for all-day wear.', 1999, 3499, 2, 150, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 4.3, 423, 0],
            ['Hoodie Sweatshirt', 'Cozy fleece hoodie with kangaroo pocket, perfect for cool weather.', 1499, 2499, 2, 120, 'https://images.unsplash.com/photo-1556821840-3a63f15232d2?w=400', 4.5, 567, 1],
            ['Running Shoes Pro', 'Lightweight running shoes with advanced cushioning and breathable mesh upper.', 3999, 5999, 2, 90, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 4.7, 1203, 1],
            ['Formal Dress Shirt', 'Wrinkle-resistant formal dress shirt, perfect for office and events.', 1299, 1999, 2, 180, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', 4.2, 234, 0],
            // Home & Living (cat 3)
            ['Ergonomic Office Chair', 'Full lumbar support office chair with adjustable height and armrests.', 15999, 22999, 3, 40, 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400', 4.6, 389, 1],
            ['Coffee Maker Deluxe', 'Programmable coffee maker with built-in grinder and thermal carafe.', 8999, 12999, 3, 60, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 4.4, 267, 0],
            ['LED Desk Lamp', 'Eye-friendly LED desk lamp with adjustable color temperature and USB charging port.', 2499, 3999, 3, 70, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 4.5, 445, 0],
            ['Bedside Table Organizer', 'Bamboo bedside organizer with 3 compartments and wireless charging pad.', 3199, 4499, 3, 55, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', 4.3, 178, 0],
            // Sports (cat 4)
            ['Yoga Mat Premium', 'Extra thick 8mm non-slip yoga mat with carrying strap, eco-friendly material.', 1899, 2999, 4, 200, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 4.7, 891, 1],
            ['Dumbbell Set', 'Adjustable dumbbell set 5-50kg with quick-lock mechanism and storage rack.', 12999, 18999, 4, 25, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 4.8, 345, 1],
            ['Football Pro League', 'FIFA-approved match football, size 5, durable synthetic leather.', 2499, 3499, 4, 100, 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400', 4.5, 567, 0],
            // Books (cat 5)
            ['The Art of Business', 'Bestselling guide to entrepreneurship and building successful businesses.', 699, 999, 5, 500, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', 4.6, 1234, 1],
            ['Python Programming Mastery', 'Complete Python guide from beginner to advanced with 500+ exercises.', 1299, 1999, 5, 300, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400', 4.8, 2341, 1],
            ['Design Thinking Handbook', 'Practical guide to user-centered design and creative problem solving.', 899, 1299, 5, 250, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400', 4.4, 678, 0],
        ];

        const pStmt = database.prepare(`INSERT INTO products 
      (name, description, price, original_price, category_id, stock, image, rating, reviews_count, featured) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        products.forEach(p => pStmt.run(p));
        pStmt.finalize();

        // Seed admin user
        const adminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
        database.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Admin', process.env.ADMIN_EMAIL || 'admin@abdullahstore.com', adminHash, 'admin']);

        console.log('✅ Database seeded with products and admin user');
    });
}

module.exports = { getDB, initDB };
