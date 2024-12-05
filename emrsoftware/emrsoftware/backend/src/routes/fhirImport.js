const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { importFHIRData } = require('../utils/fhirProcessor');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Import a single file
router.post('/import/:filename', authenticateToken, async (req, res) => {
  if (req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can import FHIR data' });
  }

  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../data/fhir', filename);
    
    const fhirContent = await fs.readFile(filePath, 'utf8');
    await importFHIRData(pool, fhirContent);
    
    res.json({ message: `FHIR data from ${filename} imported successfully` });
  } catch (error) {
    console.error('FHIR import error:', error);
    res.status(500).json({ 
      message: 'Failed to import FHIR data', 
      error: error.message 
    });
  }
});

// Import all files in the directory
router.post('/import-all', authenticateToken, async (req, res) => {
  if (req.user.Role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can import FHIR data' });
  }

  try {
    const dirPath = path.join(__dirname, '../data/fhir');
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let imported = 0;
    let failed = 0;
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dirPath, file);
        const fhirContent = await fs.readFile(filePath, 'utf8');
        await importFHIRData(pool, fhirContent);
        imported++;
        console.log(`Successfully imported ${file}`);
      } catch (error) {
        failed++;
        console.error(`Failed to import ${file}:`, error);
      }
    }
    
    res.json({
      message: 'FHIR data import complete',
      summary: {
        total: jsonFiles.length,
        imported,
        failed
      }
    });
  } catch (error) {
    console.error('FHIR import error:', error);
    res.status(500).json({ 
      message: 'Failed to import FHIR data', 
      error: error.message 
    });
  }
});

module.exports = router;