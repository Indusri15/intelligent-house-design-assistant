const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seed } = require('./data/seedData');
const imageGenService = require('./services/imageGenerationService');

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
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const designsDir = path.join(__dirname, '../uploads/designs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(designsDir)) fs.mkdirSync(designsDir, { recursive: true });

// Dynamic Design Image Handler: Serves real architectural photography and survives Render restarts
const publicDesignsDir = path.join(__dirname, '../public/designs');
app.get('/uploads/designs/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const uploadFilePath = path.join(designsDir, filename);
  const publicFilePath = path.join(publicDesignsDir, filename);

  // 1. If file exists on local uploads disk, serve it immediately
  if (fs.existsSync(uploadFilePath)) {
    return res.sendFile(uploadFilePath);
  }

  // 2. If file exists in permanent public designs repository, serve it
  if (fs.existsSync(publicFilePath)) {
    return res.sendFile(publicFilePath);
  }

  // 3. If file is missing after ephemeral container restart, serve matching architectural photograph
  const isExterior = filename.toLowerCase().includes('exterior') || filename.toLowerCase().includes('elevation');
  const isSage = filename.toLowerCase().includes('sage') || filename.toLowerCase().includes('green');
  let fallbackPhoto;

  if (isExterior) {
    fallbackPhoto = isSage ? 'exterior_sage_cream.jpg' : 'exterior_white_teak.jpg';
  } else {
    fallbackPhoto = isSage ? 'interior_living_sage.jpg' : 'interior_living_white.jpg';
  }

  const fallbackPath = path.join(publicDesignsDir, fallbackPhoto);
  if (fs.existsSync(fallbackPath)) {
    res.type('image/jpeg');
    return res.sendFile(fallbackPath);
  }

  // 4. Dynamic SVG fallback with 200 OK
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#1e293b"/>
    <text x="400" y="290" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc" text-anchor="middle">Conceptual Architectural Visualization</text>
    <text x="400" y="330" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${filename}</text>
  </svg>`;
  res.type('image/svg+xml').send(svg);
});

// Static uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Intelligent House Design Assistant Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'
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
app.use('/api/ai', aiRoutes);

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
    console.log(`  AI Microservice Bridge: ${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}`);
    console.log(`==========================================================`);
  });
};

startServer();

module.exports = app;
