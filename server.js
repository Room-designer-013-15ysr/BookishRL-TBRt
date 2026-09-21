// Global error logging to capture startup or runtime crashes
process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT ERROR:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allows larger JSON payload imports

// Database connection pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Serve static assets from current root folder
app.use(express.static(__dirname));

// GET API: Fetch all books from PostgreSQL
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// POST API: Dynamically insert book fields (supports full import schema)
app.post('/api/books', async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);

    if (keys.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const query = `INSERT INTO books (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting book:', err);
    res.status(500).json({ error: 'Failed to insert book' });
  }
});

// Serve frontend HTML on fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'bookish_reading_tracker.html'));
});

// Start server on single PORT definition bound to host
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
