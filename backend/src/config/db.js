const mongoose = require('mongoose');
const dns = require('dns');

let isMongoConnected = false;

// Configure DNS fallback for MongoDB Atlas SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if system DNS does not allow custom override
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intelligent_house_design';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log(`[MongoDB Atlas] Connected Successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB Notice] MongoDB not connected (${error.message}).`);
    if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers')) {
      console.warn(`[MongoDB Atlas Security Notice] Please ensure your current IP or '0.0.0.0/0' is added to MongoDB Atlas -> Network Access -> IP Access List.`);
    }
    console.log('[Persistence] Active: Resilient persistent JSON fallback storage engine is running.');
    isMongoConnected = false;
    return false;
  }
};

const getMongoStatus = () => isMongoConnected;

module.exports = { connectDB, getMongoStatus };

