const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seed } = require('./data/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const floorPlanRoutes = require('./routes/floorPlanRoutes');
const vastuRoutes = require('./routes/vastuRoutes');
const estimationRoutes = require('./routes/estimationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const designRoutes = require('./routes/designRoutes');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Intelligent House Design Assistant Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/floor-plans', floorPlanRoutes);
app.use('/api/vastu', vastuRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/design', designRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Attempt Mongo Connection
  await connectDB();
  
  // Auto-seed baseline admin and demo project
  try {
    await seed();
  } catch (err) {
    console.warn('[Seed Notice] Initial seed check completed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`==========================================================`);
    console.log(`  🏠 Intelligent House Design Assistant API Server running `);
    console.log(`  Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log(`==========================================================`);
  });
};

startServer();

module.exports = app;
