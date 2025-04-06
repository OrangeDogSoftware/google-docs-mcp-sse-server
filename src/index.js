require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const docRoutes = require('./routes/docs');
const sseRoutes = require('./routes/sse');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const googleAuthService = require('./services/googleAuthService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing du corps des requêtes
app.use(express.json());

// Logging des requêtes
app.use(requestLogger);

// Limitation de taux global
app.use(rateLimiter.global);

// Routes
app.use('/api/docs', docRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Gestion des erreurs
app.use(errorHandler);

// Initialisation du service d'authentification Google
async function initializeApp() {
  try {
    await googleAuthService.initialize();
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      logger.info(`Serveur MCP SSE démarré sur le port ${PORT}`);
    });
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de l\'application:', error);
    process.exit(1);
  }
}

// Lancement de l'application
initializeApp();

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  logger.info('Arrêt du serveur...');
  process.exit(0);
});

module.exports = app;