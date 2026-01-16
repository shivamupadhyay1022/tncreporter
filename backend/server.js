// ConsentLens Backend Server - AI-Powered Contract Analysis API
const express = require('express');
const cors = require('cors');
const { ConsentLensAIEngine } = require('./aiEngine');

class ConsentLensServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.aiEngine = new ConsentLensAIEngine();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security and performance middleware
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'chrome-extension://*',
        'http://localhost:*',
        'https://localhost:*'
      ],
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
          clause_segmentation: true,
          multi_label_classification: true,
          risk_scoring: true,
          xai: true,
          benchmark: true
        }
      });
    });

    // Main analysis endpoint
    this.app.post('/api/analyze', this.analyzeLegalText.bind(this));
    
    // Batch analysis endpoint
    this.app.post('/api/analyze/batch', this.analyzeBatch.bind(this));
    
    // Model information endpoint
    this.app.get('/api/model/info', this.getModelInfo.bind(this));
    
    // Categories endpoint
    this.app.get('/api/categories', this.getCategories.bind(this));
  }

  async analyzeLegalText(req, res) {
    try {
      const { text, url, language = 'en', user_preferences = {} } = req.body;
      
      // Validate input
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Text parameter is required and must be a non-empty string'
        });
      }
      
      if (text.length > 50000) { // 50KB limit
        return res.status(413).json({
          error: 'Payload too large',
          message: 'Text must be less than 50,000 characters'
        });
      }

      // Normalize user preferences
      const preferences = this.normalizePreferences(user_preferences);
      
      console.log(`Analyzing text from ${url || 'unknown source'} (${text.length} chars)`);
      
      // Perform AI analysis
      const startTime = Date.now();
      const analysis = await this.aiEngine.analyze(text, {
        url,
        language,
        user_preferences: preferences
      });
      const processingTime = Date.now() - startTime;
      
      console.log(`Analysis completed in ${processingTime}ms`);
      
      res.json({
        ...analysis,
        metadata: {
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString(),
          text_length: text.length,
          language: language
        }
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message,
        fallback: this.aiEngine.getFallbackAnalysis()
      });
    }
  }

  async analyzeBatch(req, res) {
    try {
      const { texts, language = 'en', user_preferences = {} } = req.body;
      
      if (!Array.isArray(texts) || texts.length === 0 || texts.length > 10) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Texts must be an array with 1-10 items'
        });
      }
      
      const preferences = this.normalizePreferences(user_preferences);
      const analyses = [];
      
      for (const item of texts) {
        const { text, url } = item;
        const analysis = await this.aiEngine.analyze(text, {
          url,
          language,
          user_preferences: preferences
        });
        analyses.push(analysis);
      }
      
      res.json({
        analyses,
        metadata: {
          batch_size: texts.length,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      res.status(500).json({
        error: 'Batch analysis failed',
        message: error.message
      });
    }
  }

  getModelInfo(req, res) {
    res.json({
      model: 'ConsentLens Deterministic Engine v1.0',
      type: 'Rule-based with optional embeddings',
      capabilities: [
        'Clause segmentation',
        'Multi-label classification',
        'Risk scoring with user preferences',
        'Explainability (XAI)',
        'Fairness benchmarks'
      ],
      version: '1.0.0',
      deterministic: true,
      supports_embeddings: true
    });
  }

  getCategories(req, res) {
    res.json(this.aiEngine.getCategories());
  }

  normalizePreferences(user_preferences) {
    const defaults = {
      privacy_weight: 0.4,
      legal_rights_weight: 0.4,
      convenience_weight: 0.2,
      risk_threshold: 50,
      enable_notifications: true
    };
    
    return { ...defaults, ...user_preferences };
  }

  errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 ConsentLens AI Service running on port ${this.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🧠 AI Engine: Deterministic Rule-Based Analysis`);
      console.log(`🔒 Privacy: Stateless processing (no data storage)`);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new ConsentLensServer();
  server.start();
}

module.exports = { ConsentLensServer };