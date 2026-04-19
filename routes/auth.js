const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');

// Register
router.post('/register', (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const db = getDB();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, phone || null],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
                return res.status(500).json({ error: 'Registration failed' });
            }

            const token = jwt.sign(
                { id: this.lastID, email, role: 'customer', name },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'Account created successfully',
                token,
                user: { id: this.lastID, name, email, role: 'customer' }
            });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDB();
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Login failed' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Logged in successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

// Get profile
router.get('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
    const db = getDB();
    db.get('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?',
        [req.user.id], (err, user) => {
            if (err || !user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        });
});

// Update profile
router.put('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
    const { name, phone, address } = req.body;
    const db = getDB();
    db.run('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
        [name, phone, address, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Update failed' });
            res.json({ message: 'Profile updated successfully' });
        });
});

module.exports = router;
