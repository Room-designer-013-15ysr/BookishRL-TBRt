const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Connect to Neon PostgreSQL using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Serve frontend static files (index.html, CSS, client JS)
app.use(express.static(__dirname));

// --- API ENDPOINTS ---

// GET all books
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST a new book
app.post('/api/books', async (req, res) => {
  const { title, author, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, status) VALUES ($1, $2, $3) RETURNING *',
      [title, author, status || 'To Read']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to insert book' });
  }
});

// Serve index.html for any direct web page requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
