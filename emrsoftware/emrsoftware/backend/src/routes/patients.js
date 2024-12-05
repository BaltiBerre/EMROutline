//emrsoftware/backend/src/routes/patients.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  console.log('User role:', req.user.Role);
  if (req.user.Role !== 'admin' && req.user.Role !== 'doctor') {
    console.log('Access denied. User role:', req.user.Role);
    return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
  }

  try {
    const result = await pool.query('SELECT * FROM Patients');
    console.log('Fetched patients:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

router.post('/', [
  body('FirstName').notEmpty().withMessage('First name is required'),
  body('LastName').notEmpty().withMessage('Last name is required'),
  body('DOB').isDate().withMessage('Date of birth must be a valid date'),
  body('Gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('Email').isEmail().withMessage('Invalid email address'),
  body('PhoneNumber').isMobilePhone().withMessage('Invalid phone number')
], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { FirstName, LastName, DOB, Gender, Address, PhoneNumber, Email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Patients (FirstName, LastName, DOB, Gender, Address, PhoneNumber, Email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [FirstName, LastName, DOB, Gender, Address, PhoneNumber, Email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message,
      code: err.code,
      hint: err.hint
    });
  }
});

router.put('/:id', [
  body('FirstName').notEmpty().withMessage('First name is required'),
  body('LastName').notEmpty().withMessage('Last name is required'),
  body('DOB').isDate().withMessage('Date of birth must be a valid date'),
  body('Gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('Email').isEmail().withMessage('Invalid email address'),
  body('PhoneNumber').isMobilePhone().withMessage('Invalid phone number')
], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { FirstName, LastName, DOB, Gender, Address, PhoneNumber, Email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Patients SET FirstName = $1, LastName = $2, DOB = $3, Gender = $4, Address = $5, PhoneNumber = $6, Email = $7 WHERE PatientID = $8 RETURNING *',
      [FirstName, LastName, DOB, Gender, Address, PhoneNumber, Email, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Patients WHERE PatientID = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Patient deleted successfully' });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // foreign_key_violation
      res.status(400).json({ error: 'Cannot delete patient. There are related records.' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

module.exports = router;