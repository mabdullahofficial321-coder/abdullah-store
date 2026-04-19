const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// GET all products (with search, filter, sort)
router.get('/', (req, res) => {
    const db = getDB();
    const { category, search, sort, minPrice, maxPrice, featured } = req.query;

    let query = `SELECT p.*, c.name as category_name FROM products p 
               LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
    const params = [];

    if (category) { query += ' AND p.category_id = ?'; params.push(category); }
    if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (minPrice) { query += ' AND p.price >= ?'; params.push(minPrice); }
    if (maxPrice) { query += ' AND p.price <= ?'; params.push(maxPrice); }
    if (featured === '1') { query += ' AND p.featured = 1'; }

    if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
    else if (sort === 'rating') query += ' ORDER BY p.rating DESC';
    else if (sort === 'newest') query += ' ORDER BY p.created_at DESC';
    else query += ' ORDER BY p.id ASC';

    db.all(query, params, (err, products) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch products' });
        res.json(products);
    });
});

// GET single product
router.get('/:id', (req, res) => {
    const db = getDB();
    db.get(`SELECT p.*, c.name as category_name FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
        [req.params.id], (err, product) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch product' });
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(product);
        });
});

// POST create product (admin only)
router.post('/', adminMiddleware, (req, res) => {
    const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
    const db = getDB();
    db.run(
        `INSERT INTO products (name, description, price, original_price, category_id, stock, image, featured) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, original_price, category_id, stock || 100, image, featured || 0],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to create product' });
            res.status(201).json({ message: 'Product created', id: this.lastID });
        }
    );
});

// PUT update product (admin only)
router.put('/:id', adminMiddleware, (req, res) => {
    const { name, description, price, original_price, category_id, stock, image, featured } = req.body;
    const db = getDB();
    db.run(
        `UPDATE products SET name=?, description=?, price=?, original_price=?, 
     category_id=?, stock=?, image=?, featured=? WHERE id=?`,
        [name, description, price, original_price, category_id, stock, image, featured, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update product' });
            res.json({ message: 'Product updated' });
        }
    );
});

// DELETE product (admin only)
router.delete('/:id', adminMiddleware, (req, res) => {
    const db = getDB();
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete product' });
        res.json({ message: 'Product deleted' });
    });
});

module.exports = router;
