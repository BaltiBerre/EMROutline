//emrsoftware/backend/src/routes/appointments.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Appointments');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', [
  body('PatientID').isInt().withMessage('Patient ID must be an integer'),
  body('DoctorID').isInt().withMessage('Doctor ID must be an integer'),
  body('AppointmentDate').isDate().withMessage('Appointment date must be a valid date'),
  body('AppointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Appointment time must be in HH:MM format'),
  body('ReasonForVisit').notEmpty().withMessage('Reason for visit is required'),
  body('Status').isIn(['Scheduled', 'Completed', 'Cancelled']).withMessage('Invalid status')
], authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { PatientID, DoctorID, AppointmentDate, AppointmentTime, ReasonForVisit, Status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, ReasonForVisit, Status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [PatientID, DoctorID, AppointmentDate, AppointmentTime, ReasonForVisit, Status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // foreign_key_violation
      res.status(400).json({ error: 'Invalid PatientID or DoctorID' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

module.exports = router;