require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const convertRoutes = require('./src/routes/convert');
const healthRoutes = require('./src/routes/health');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// Middleware with increased limits for large files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Serve static files from outputs directory
app.use('/outputs', express.static('outputs'));

// Routes
app.use('/api/convert', convertRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Image Assembly API running on port ${PORT}`);
});

// Set server timeout to 10 minutes for large files
server.timeout = 600000;