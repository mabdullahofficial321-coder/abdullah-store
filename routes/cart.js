const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// GET cart items
router.get('/', authMiddleware, (req, res) => {
    const db = getDB();
    db.all(
        `SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.original_price, p.image, p.stock
     FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`,
        [req.user.id], (err, items) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch cart' });
            res.json(items);
        }
    );
});

// POST add to cart / update quantity
router.post('/', authMiddleware, (req, res) => {
    const { product_id, quantity = 1 } = req.body;
    const db = getDB();
    db.run(
        `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?`,
        [req.user.id, product_id, quantity, quantity],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to add to cart' });
            res.json({ message: 'Added to cart' });
        }
    );
});

// PUT update cart item quantity
router.put('/:id', authMiddleware, (req, res) => {
    const { quantity } = req.body;
    const db = getDB();
    if (quantity <= 0) {
        db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to remove item' });
            res.json({ message: 'Item removed' });
        });
    } else {
        db.run('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, req.params.id, req.user.id], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to update cart' });
                res.json({ message: 'Cart updated' });
            });
    }
});

// DELETE remove cart item
router.delete('/:id', authMiddleware, (req, res) => {
    const db = getDB();
    db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to remove item' });
        res.json({ message: 'Item removed' });
    });
});

// DELETE clear cart
router.delete('/', authMiddleware, (req, res) => {
    const db = getDB();
    db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to clear cart' });
        res.json({ message: 'Cart cleared' });
    });
});

module.exports = router;
