console.log('Starting server...');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Import routes
const doctorsRouter = require('./src/routes/doctors');
const patientsRouter = require('./src/routes/patients');
const appointmentsRouter = require('./src/routes/appointments');
const authRouter = require('./src/routes/auth');
const medicalRecordsRouter = require('./src/routes/medicalRecords');
const patientOverviewRouter = require('./src/routes/patientOverview');
const fhirImportRouter = require(path.join(__dirname, './src/routes/fhirImport'));

// Use routes
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/patient-overview', patientOverviewRouter);
app.use('/api/fhir', fhirImportRouter);
app.use('/api/doctors', doctorsRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is healthy' });
});

// Database connection test route
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = require('./config/database');
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected successfully', time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection error', error: err.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  console.error('Error starting server:', err);
});