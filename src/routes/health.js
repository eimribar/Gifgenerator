const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', (req, res) => {
  const healthcheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Image Assembly API',
    version: '2.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(os.totalmem() / 1024 / 1024)
    },
    cpu: os.loadavg()[0]
  };
  
  res.status(200).json(healthcheck);
});

module.exports = router;
