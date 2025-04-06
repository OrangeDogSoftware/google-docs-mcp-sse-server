const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 */
function errorHandler(err, req, res, next) {
  // Journalisation de l'erreur
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Détermination du code d'état HTTP
  const statusCode = err.statusCode || 500;
  
  // Préparation de la réponse
  const errorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Une erreur est survenue' 
        : err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  };

  // Ajout de la pile d'erreurs en développement
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  // Stockage du code d'erreur pour les statistiques
  res.locals.errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;