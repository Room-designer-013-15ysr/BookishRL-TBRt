const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors()); // Allows your app to talk to this server from any device
app.use(express.json());

// Connects to your Neon database using an environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database table automatically
pool.query(`
  CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT,
    author TEXT,
    genre TEXT,
    format TEXT,
    status TEXT,
    rating NUMERIC,
    cover TEXT
  )
`);

// GET all books
app.get('/api/books', async (req, res) => {
  const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
  res.json(result.rows);
});

// POST add a book
app.post('/api/books', async (req, res) => {
  const { title, author, genre, format, status, rating, cover } = req.body;
  const result = await pool.query(
    'INSERT INTO books (title, author, genre, format, status, rating, cover) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, author, genre, format, status, rating, cover]
  );
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
