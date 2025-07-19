const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    res.status(200).json({ status: 'OK', message: 'Service is healthy' });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

module.exports = router; 