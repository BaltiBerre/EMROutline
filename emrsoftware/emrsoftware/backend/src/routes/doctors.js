// src/routes/doctors.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Get all doctors with their statistics
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
  }

  try {
    const result = await pool.query(`
      WITH DoctorStats AS (
        SELECT 
          ua.userid,
          COUNT(DISTINCT a.PatientID) as patient_count,
          COUNT(CASE 
            WHEN a.AppointmentDate >= CURRENT_DATE 
            THEN 1 END) as upcoming_appointments
        FROM UserAccounts ua
        LEFT JOIN Appointments a ON ua.userid = a.DoctorID
        WHERE ua.role = 'doctor'
        GROUP BY ua.userid
      )
      SELECT 
        ua.userid,
        ua.username,
        COALESCE(ds.patient_count, 0) as patient_count,
        COALESCE(ds.upcoming_appointments, 0) as upcoming_appointments
      FROM UserAccounts ua
      LEFT JOIN DoctorStats ds ON ua.userid = ds.userid
      WHERE ua.role = 'doctor'
      ORDER BY ua.username;
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// Get specific doctor details with their patients
router.get('/:id', authenticateToken, async (req, res) => {
  if (req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
  }

  try {
    // Get doctor's statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT a.PatientID) as unique_patients,
        COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.AppointmentDate >= CURRENT_DATE THEN 1 END) as upcoming_appointments
      FROM UserAccounts ua
      LEFT JOIN Appointments a ON ua.userid = a.DoctorID
      WHERE ua.userid = $1 AND ua.role = 'doctor'
      GROUP BY ua.userid;
    `;

    // Get doctor's patients with their details
    const patientsQuery = `
      SELECT DISTINCT ON (p.PatientID)
        p.PatientID as patientid,
        p.FirstName as firstname,
        p.LastName as lastname,
        MAX(mr.VisitDate) as last_visit,
        COUNT(mr.RecordID) as visit_count,
        FIRST_VALUE(mr.Diagnosis) OVER (
          PARTITION BY p.PatientID 
          ORDER BY mr.VisitDate DESC
        ) as latest_diagnosis
      FROM Patients p
      JOIN Appointments a ON p.PatientID = a.PatientID
      LEFT JOIN MedicalRecords mr ON p.PatientID = mr.PatientID
      WHERE a.DoctorID = $1
      GROUP BY p.PatientID, mr.Diagnosis, mr.VisitDate
      ORDER BY p.PatientID, last_visit DESC;
    `;

    const stats = await pool.query(statsQuery, [req.params.id]);
    const patients = await pool.query(patientsQuery, [req.params.id]);

    res.json({
      statistics: stats.rows[0] || {
        unique_patients: 0,
        completed_appointments: 0,
        upcoming_appointments: 0
      },
      patients: patients.rows
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({ message: 'Error fetching doctor details', error: error.message });
  }
});

module.exports = router;