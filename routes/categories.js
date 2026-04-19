const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

router.get('/', (req, res) => {
    const db = getDB();
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch categories' });
        res.json(rows);
    });
});

module.exports = router;
