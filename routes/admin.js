const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// GET dashboard stats
router.get('/stats', adminMiddleware, (req, res) => {
    const db = getDB();
    const stats = {};

    db.get('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders', [], (err, row) => {
        stats.total_orders = row ? row.count : 0;
        stats.total_revenue = row ? row.revenue : 0;

        db.get('SELECT COUNT(*) as count FROM users WHERE role = "customer"', [], (err2, row2) => {
            stats.total_customers = row2 ? row2.count : 0;

            db.get('SELECT COUNT(*) as count FROM products', [], (err3, row3) => {
                stats.total_products = row3 ? row3.count : 0;

                db.get('SELECT COUNT(*) as count FROM orders WHERE status = "pending"', [], (err4, row4) => {
                    stats.pending_orders = row4 ? row4.count : 0;
                    res.json(stats);
                });
            });
        });
    });
});

// GET all users (admin)
router.get('/users', adminMiddleware, (req, res) => {
    const db = getDB();
    db.all('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch users' });
        res.json(users);
    });
});

// DELETE user (admin)
router.delete('/users/:id', adminMiddleware, (req, res) => {
    const db = getDB();
    db.run('DELETE FROM users WHERE id = ? AND role != "admin"', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete user' });
        res.json({ message: 'User deleted' });
    });
});

module.exports = router;
