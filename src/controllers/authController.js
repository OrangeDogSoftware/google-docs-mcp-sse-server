const googleAuthService = require('../services/googleAuthService');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Contrôleur pour la gestion de l'authentification
 */
const authController = {
  /**
   * Génère une URL d'authentification Google OAuth2
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getAuthUrl(req, res, next) {
    try {
      const { scopes } = req.query;
      
      // Conversion des scopes s'ils sont fournis
      const scopesArray = scopes ? scopes.split(',') : [];
      
      const authUrl = googleAuthService.getAuthUrl(scopesArray);
      
      res.json({
        success: true,
        data: {
          authUrl
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la génération de l\'URL d\'authentification:', error);
      next(error);
    }
  },

  /**
   * Échange un code d'autorisation contre des tokens
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getToken(req, res, next) {
    try {
      const { code } = req.body;
      
      if (!code) {
        throw ApiError.badRequest('Code d\'autorisation requis', 'MISSING_AUTH_CODE');
      }
      
      const tokens = await googleAuthService.getTokensFromCode(code);
      
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      logger.error('Erreur lors de l\'échange du code d\'autorisation:', error);
      next(error);
    }
  },

  /**
   * Rafraîchit un token d'accès expiré
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async refreshToken(req, res, next) {
    try {
      const { access_token, refresh_token } = req.body;
      
      if (!refresh_token) {
        throw ApiError.badRequest('Token de rafraîchissement requis', 'MISSING_REFRESH_TOKEN');
      }
      
      const tokens = await googleAuthService.refreshAccessToken(access_token, refresh_token);
      
      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token:', error);
      next(error);
    }
  },

  /**
   * Révoque un token d'accès
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async revokeToken(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        throw ApiError.badRequest('Token requis', 'MISSING_TOKEN');
      }
      
      await googleAuthService.revokeToken(token);
      
      res.json({
        success: true,
        message: 'Token révoqué avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la révocation du token:', error);
      next(error);
    }
  },

  /**
   * Vérifie la validité d'un token d'accès
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
          success: false,
          valid: false,
          message: 'Token non fourni'
        });
      }
      
      const token = authHeader.split(' ')[1];
      const isValid = await googleAuthService.verifyAccessToken(token);
      
      res.json({
        success: true,
        valid: isValid,
        message: isValid ? 'Token valide' : 'Token invalide ou expiré'
      });
    } catch (error) {
      logger.error('Erreur lors de la vérification du token:', error);
      next(error);
    }
  }
};

module.exports = authController;
