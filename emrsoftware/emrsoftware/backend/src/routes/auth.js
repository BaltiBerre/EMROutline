//emrsoftware/backend/src/routes/auth.js
const authenticateToken = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

router.post('/register', [
  body('Username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('Password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('Role').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { Username, Password, Role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(Password, 10);
    const result = await pool.query(
      'INSERT INTO UserAccounts (Username, PasswordHash, Role) VALUES ($1, $2, $3) RETURNING UserID, Username, Role',
      [Username, hashedPassword, Role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // unique_violation
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

router.post('/login', [
  body('Username').notEmpty().withMessage('Username is required'),
  body('Password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { Username, Password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM UserAccounts WHERE Username = $1', [Username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (await bcrypt.compare(Password, user.passwordhash)) {
        const token = jwt.sign(
          { UserID: user.userid, Username: user.username, Role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.json({ message: 'Login successful', token, role: user.role });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.get('/staff-count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM UserAccounts WHERE Role IN ('doctor', 'admin')"
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error getting staff count:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.post('/create-user', async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO UserAccounts (Username, PasswordHash, Role) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, hashedPassword, role];
    
    const result = await pool.query(query, values);
    res.json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

module.exports = router;

