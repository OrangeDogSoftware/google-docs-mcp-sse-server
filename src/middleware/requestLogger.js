const logger = require('../utils/logger');
const analyticsService = require('../services/analyticsService');

/**
 * Middleware pour journaliser les requêtes
 */
function requestLogger(req, res, next) {
  // Enregistrer l'heure de début de la requête
  const startTime = Date.now();
  
  // Générer un ID unique pour la requête
  const requestId = require('crypto').randomBytes(16).toString('hex');
  req.requestId = requestId;
  
  // Ajouter l'ID de requête aux en-têtes de réponse
  res.setHeader('X-Request-ID', requestId);
  
  // Extraire des informations de base sur la requête
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent') || 'Inconnu';
  
  // Récupérer l'ID utilisateur si disponible
  const userId = req.auth ? (req.auth.credentials && req.auth.credentials.sub) : 'anonymous';
  
  // Journaliser le début de la requête
  logger.info(`Début de la requête ${method} ${originalUrl}`, {
    requestId,
    method,
    url: originalUrl,
    ip,
    userAgent,
    userId
  });
  
  // Enregistrer la requête dans les statistiques
  analyticsService.recordRequest(method, originalUrl, userId);
  
  // Écouter l'événement de fin de réponse
  res.on('finish', () => {
    // Calculer la durée de la requête
    const duration = Date.now() - startTime;
    
    // Journaliser la fin de la requête avec le code d'état
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`Fin de la requête ${method} ${originalUrl}`, {
      requestId,
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    });
    
    // Si la réponse est une erreur, enregistrer dans les statistiques
    if (res.statusCode >= 400) {
      analyticsService.recordError(res.statusCode, res.locals.errorCode);
    }
  });
  
  next();
}

module.exports = requestLogger;
