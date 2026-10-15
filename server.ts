/**
 * KYC-AI — Intelligent Customer Onboarding and Document Verification Platform
 * Server Entry Point (Express + Vite Middleware integration on Port 3000)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { kycRouter } from './server/routes.js';
import { authRouter } from './server/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check route
  app.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'KYC-AI Verification Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      ocrEngine: 'Tesseract.js OCR (LSTM Neural Net)',
    });
  });

  // Mount KYC and Auth API routers
  app.use('/api/kyc', kycRouter);
  app.use('/api', authRouter);

  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KYC-AI] Server active on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[KYC-AI] Fatal server startup error:', err);
  process.exit(1);
});
