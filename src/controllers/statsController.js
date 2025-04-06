const analyticsService = require('../services/analyticsService');
const sseService = require('../services/sseService');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Contrôleur pour les statistiques et l'analyse
 */
const statsController = {
  /**
   * Récupère les statistiques globales du système
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getStats(req, res, next) {
    try {
      // Vérifier si l'utilisateur a les droits nécessaires (simplifié pour l'exemple)
      // En production, implémenter un système de rôles et d'autorisations
      
      const stats = analyticsService.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques globales:', error);
      next(error);
    }
  },

  /**
   * Récupère les statistiques d'utilisation d'un document spécifique
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getDocStats(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw ApiError.badRequest('ID du document requis', 'MISSING_DOC_ID');
      }
      
      const stats = analyticsService.getDocStats(id);
      
      if (!stats) {
        return res.status(404).json({
          error: {
            message: 'Aucune statistique trouvée pour ce document',
            code: 'DOC_STATS_NOT_FOUND'
          }
        });
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques du document ${req.params.id}:`, error);
      next(error);
    }
  },

  /**
   * Récupère les statistiques d'activité des utilisateurs
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getUserStats(req, res, next) {
    try {
      // Vérifier si l'utilisateur a les droits administrateur (simplifié pour l'exemple)
      // En production, implémenter un système de rôles et d'autorisations
      
      // Pour l'exemple, nous renvoyons seulement le nombre d'utilisateurs actifs
      const stats = {
        activeUsers: analyticsService.getStats().activeUsers,
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques utilisateurs:', error);
      next(error);
    }
  },

  /**
   * Récupère les statistiques des connexions SSE
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   * @param {NextFunction} next - Middleware suivant
   */
  async getSseStats(req, res, next) {
    try {
      // Vérifier si l'utilisateur a les droits administrateur (simplifié pour l'exemple)
      // En production, implémenter un système de rôles et d'autorisations
      
      const stats = {
        globalConnections: sseService.getGlobalConnectionsCount(),
        docConnections: sseService.getDocConnectionsCount(),
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques SSE:', error);
      next(error);
    }
  }
};

module.exports = statsController;
