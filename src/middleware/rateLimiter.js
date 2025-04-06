const logger = require('../utils/logger');

/**
 * Classe pour gérer la limitation de taux de requêtes
 */
class RateLimiter {
  constructor(options = {}) {
    // Paramètres par défaut
    this.options = {
      windowMs: options.windowMs || 60 * 1000, // Fenêtre de temps (1 minute par défaut)
      maxRequests: options.maxRequests || 100, // Nombre maximum de requêtes par fenêtre
      message: options.message || 'Trop de requêtes, veuillez réessayer plus tard.',
      statusCode: options.statusCode || 429, // Code d'état HTTP pour les requêtes limitées
      keyGenerator: options.keyGenerator || ((req) => req.ip) // Fonction pour générer la clé (IP par défaut)
    };
    
    // Stockage des informations de requêtes par clé
    this.requestCounts = new Map();
    
    // Nettoyage périodique des anciennes entrées
    this.interval = setInterval(() => this.resetExpiredWindows(), this.options.windowMs);
  }

  /**
   * Middleware Express pour la limitation de taux
   * @returns {Function} Middleware Express
   */
  middleware() {
    return (req, res, next) => {
      const key = this.options.keyGenerator(req);
      
      // Initialiser ou mettre à jour l'entrée pour cette clé
      if (!this.requestCounts.has(key)) {
        this.requestCounts.set(key, {
          count: 0,
          resetTime: Date.now() + this.options.windowMs
        });
      }
      
      const requestData = this.requestCounts.get(key);
      
      // Réinitialiser si la fenêtre de temps est expirée
      if (Date.now() > requestData.resetTime) {
        requestData.count = 0;
        requestData.resetTime = Date.now() + this.options.windowMs;
      }
      
      // Vérifier si la limite est atteinte
      if (requestData.count >= this.options.maxRequests) {
        // Ajouter les en-têtes de limitation de taux
        res.setHeader('Retry-After', Math.ceil((requestData.resetTime - Date.now()) / 1000));
        res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));
        
        logger.warn(`Limite de taux atteinte pour ${key}`);
        
        return res.status(this.options.statusCode).json({
          error: {
            message: this.options.message,
            code: 'RATE_LIMIT_EXCEEDED'
          }
        });
      }
      
      // Incrémenter le compteur et continuer
      requestData.count++;
      
      // Ajouter les en-têtes de limitation de taux
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.options.maxRequests - requestData.count);
      res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));
      
      next();
    };
  }

  /**
   * Nettoie les entrées expirées dans la map
   */
  resetExpiredWindows() {
    const now = Date.now();
    
    this.requestCounts.forEach((data, key) => {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
      }
    });
  }

  /**
   * Nettoie les ressources lors de l'arrêt du service
   */
  cleanup() {
    clearInterval(this.interval);
  }
}

// Middleware global avec paramètres par défaut
const globalLimiter = new RateLimiter();

// Middleware plus strict pour les routes sensibles
const strictLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30 // 30 requêtes par 15 minutes
});

module.exports = {
  global: globalLimiter.middleware(),
  strict: strictLimiter.middleware(),
  RateLimiter // Exporte la classe pour des personnalisations spécifiques
};
