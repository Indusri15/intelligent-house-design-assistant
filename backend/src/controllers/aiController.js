const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const getAiServiceUrl = () => {
  return (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
};

/**
 * Health check endpoint for FastAPI AI Microservice
 */
exports.checkHealth = async (req, res) => {
  const aiServiceUrl = getAiServiceUrl();
  try {
    const response = await axios.get(`${aiServiceUrl}/health`, { timeout: 5000 });
    return res.status(200).json({
      success: true,
      serviceUrl: aiServiceUrl,
      data: response.data
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      serviceUrl: aiServiceUrl,
      status: 'OFFLINE',
      message: `AI Microservice is unreachable at ${aiServiceUrl}. Please ensure the Python FastAPI service is running. Error: ${error.message}`,
      code: 'AI_MICROSERVICE_UNAVAILABLE'
    });
  }
};

/**
 * Bridge endpoint: Forward site survey image to FastAPI for boundary detection
 */
exports.analyzeSiteImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image file for site boundary analysis' });
  }

  const aiServiceUrl = getAiServiceUrl();
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResp = await axios.post(`${aiServiceUrl}/api/ai/analyze-site-image`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    return res.status(200).json(aiResp.data);
  } catch (error) {
    const isConnError = error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED');
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
    const msg = isConnError
      ? `AI Microservice is unreachable at ${aiServiceUrl}. Please ensure the Python FastAPI service is running on port 8000.`
      : `AI Microservice error: ${errorDetail}`;
    return res.status(error.response?.status || 503).json({
      success: false,
      message: msg,
      code: 'AI_MICROSERVICE_ERROR'
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

/**
 * Bridge endpoint: Forward floorplan drawing to FastAPI for CubiCasa5K semantic segmentation
 */
exports.segmentFloorplan = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a floorplan drawing file for segmentation' });
  }

  const aiServiceUrl = getAiServiceUrl();
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResp = await axios.post(`${aiServiceUrl}/api/ai/segment-floorplan`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    return res.status(200).json(aiResp.data);
  } catch (error) {
    const isConnError = error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED');
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
    const msg = isConnError
      ? `AI Microservice is unreachable at ${aiServiceUrl}. Please ensure the Python FastAPI service is running on port 8000.`
      : `AI Microservice error: ${errorDetail}`;
    return res.status(error.response?.status || 503).json({
      success: false,
      message: msg,
      code: 'AI_MICROSERVICE_ERROR'
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

/**
 * Bridge endpoint: Get ADE20K dataset metadata
 */
exports.getAde20kInfo = async (req, res, next) => {
  const aiServiceUrl = getAiServiceUrl();
  try {
    const aiResp = await axios.get(`${aiServiceUrl}/api/ai/ade20k/info`, { timeout: 5000 });
    return res.status(200).json(aiResp.data);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: `AI Microservice is unreachable at ${aiServiceUrl}. Error: ${error.message}`,
      code: 'AI_MICROSERVICE_UNAVAILABLE'
    });
  }
};
