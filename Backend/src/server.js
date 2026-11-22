import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateGuidance, validateEnvironment, getAIStatus } from './services/openRouterService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '500kb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GovEaseAI Backend', time: new Date().toISOString() });
});

// AI Configuration Status (Safe for client inspection - never exposes secrets)
app.get('/api/ai/status', (req, res) => {
  res.json(getAIStatus());
});

// AI Guidance Endpoint
app.post('/api/ai/guidance', async (req, res) => {
  try {
    const { message, serviceId, serviceContext, applicationContext, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid text query message is required.'
      });
    }

    const result = await generateGuidance({
      message,
      serviceId,
      serviceContext,
      applicationContext,
      conversationHistory
    });

    if (!result.success) {
      // Return 200 with success: false or 503 so frontend handles friendly error
      return res.status(200).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error('[AI Guidance Route] Unexpected internal error');
    return res.status(500).json({
      success: false,
      error: 'AI guidance is temporarily unavailable. Please try again.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`GovEaseAI Backend Service started on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/ai/guidance`);
  console.log(`==================================================`);
  validateEnvironment();
});
