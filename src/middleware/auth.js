const { google } = require('googleapis');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Middleware d'authentification Google OAuth2
 */
async function authenticate(req, res, next) {
  try {
    // Récupération du token d'accès depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new ApiError(401, 'Authentification requise', 'UNAUTHORIZED')
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Configuration du client OAuth2
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    
    // Vérification du token
    try {
      const tokenInfo = await auth.getTokenInfo(token);
      
      // Vérification que le token a les scopes nécessaires
      const requiredScopes = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ];
      
      const hasRequiredScopes = requiredScopes.every(scope => 
        tokenInfo.scopes.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        return next(
          new ApiError(403, 'Autorisations insuffisantes', 'INSUFFICIENT_PERMISSIONS')
        );
      }
      
      // Ajouter le client authentifié à l'objet de requête
      req.auth = auth;
      req.auth.credentials = tokenInfo;
      next();
    } catch (error) {
      logger.error('Erreur lors de la vérification du token:', error);
      return next(
        new ApiError(401, 'Token invalide ou expiré', 'INVALID_TOKEN', error)
      );
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate };