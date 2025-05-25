require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'coaching-tracker-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database initialization
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        team_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        leader_id INTEGER REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        team_id INTEGER REFERENCES teams(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coachings (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        team_member_name VARCHAR(100) NOT NULL,
        coaching_style VARCHAR(20) NOT NULL,
        tcap_id VARCHAR(50),
        time_spent INTEGER NOT NULL,
        checkmarks JSONB NOT NULL,
        performance_rating INTEGER NOT NULL,
        total_score DECIMAL(3,1) NOT NULL,
        notes TEXT,
        project_notes TEXT,
        coached_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes would go here
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  initDatabase();
});