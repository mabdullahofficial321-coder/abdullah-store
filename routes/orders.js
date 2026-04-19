const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST place order
router.post('/', authMiddleware, (req, res) => {
    const { shipping_name, shipping_email, shipping_phone, shipping_address, payment_method, items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items in order' });

    const db = getDB();
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    db.run(
        `INSERT INTO orders (user_id, total, shipping_name, shipping_email, shipping_phone, shipping_address, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, total, shipping_name, shipping_email, shipping_phone, shipping_address, payment_method || 'cod'],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to create order' });
            const orderId = this.lastID;

            const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
            items.forEach(item => stmt.run([orderId, item.product_id, item.quantity, item.price]));
            stmt.finalize();

            // Clear cart after order
            db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

            res.status(201).json({ message: 'Order placed successfully', order_id: orderId });
        }
    );
});

// GET user's orders
router.get('/my', authMiddleware, (req, res) => {
    const db = getDB();
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, orders) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch orders' });
        res.json(orders);
    });
});

// GET single order detail
router.get('/:id', authMiddleware, (req, res) => {
    const db = getDB();
    db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        db.all(
            `SELECT oi.*, p.name, p.image FROM order_items oi 
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
            [order.id], (err2, items) => {
                if (err2) return res.status(500).json({ error: 'Failed to fetch order items' });
                res.json({ ...order, items });
            }
        );
    });
});

// GET all orders (admin)
router.get('/', adminMiddleware, (req, res) => {
    const db = getDB();
    db.all(
        `SELECT o.*, u.name as user_name, u.email as user_email 
     FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`,
        [], (err, orders) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch orders' });
            res.json(orders);
        }
    );
});

// PUT update order status (admin)
router.put('/:id/status', adminMiddleware, (req, res) => {
    const { status } = req.body;
    const db = getDB();
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update status' });
        res.json({ message: 'Order status updated' });
    });
});

module.exports = router;
