const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Serve static assets from the current directory
app.use(express.static(__dirname));

// GET API: Fetch all books
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// POST API: Save book
app.post('/api/books', async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `INSERT INTO books (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save book' });
  }
});

// Fallback route: Serve bookish_reading_tracker.html (or index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'bookish_reading_tracker.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
