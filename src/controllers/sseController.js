const logger = require('../utils/logger');
const sseService = require('../services/sseService');

/**
 * Contrôleur pour la gestion des connexions SSE
 */
const sseController = {
  /**
   * Établit une connexion SSE globale pour toutes les notifications
   */
  establishConnection(req, res, next) {
    try {
      const userId = req.auth.credentials.sub || 'anonymous';
      
      // Configuration des en-têtes SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Fonction pour envoyer des événements au client
      const sendEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Message initial pour confirmer la connexion
      sendEvent('connected', { message: 'Connexion SSE établie avec succès' });
      
      // Enregistrement du client SSE
      const clientId = sseService.addClient(userId, sendEvent);
      
      logger.info(`Nouvelle connexion SSE établie - Client ID: ${clientId}`);
      
      // Gestion de la fermeture de la connexion
      req.on('close', () => {
        sseService.removeClient(clientId);
        logger.info(`Connexion SSE fermée - Client ID: ${clientId}`);
        res.end();
      });
      
      // Ping périodique pour maintenir la connexion active
      const pingInterval = setInterval(() => {
        sendEvent('ping', { timestamp: new Date().toISOString() });
      }, 30000); // Toutes les 30 secondes
      
      // Nettoyage de l'intervalle à la fermeture
      req.on('close', () => {
        clearInterval(pingInterval);
      });
    } catch (error) {
      logger.error('Erreur lors de l\'établissement de la connexion SSE:', error);
      next(error);
    }
  },

  /**
   * Établit une connexion SSE pour un document spécifique
   */
  establishDocConnection(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.auth.credentials.sub || 'anonymous';
      
      // Configuration des en-têtes SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Fonction pour envoyer des événements au client
      const sendEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Message initial pour confirmer la connexion
      sendEvent('connected', { 
        message: 'Connexion SSE établie avec succès',
        documentId: id
      });
      
      // Enregistrement du client SSE avec filtrage par document
      const clientId = sseService.addDocClient(id, userId, sendEvent);
      
      logger.info(`Nouvelle connexion SSE établie pour le document ${id} - Client ID: ${clientId}`);
      
      // Gestion de la fermeture de la connexion
      req.on('close', () => {
        sseService.removeDocClient(id, clientId);
        logger.info(`Connexion SSE fermée pour le document ${id} - Client ID: ${clientId}`);
        res.end();
      });
      
      // Ping périodique pour maintenir la connexion active
      const pingInterval = setInterval(() => {
        sendEvent('ping', { timestamp: new Date().toISOString() });
      }, 30000); // Toutes les 30 secondes
      
      // Nettoyage de l'intervalle à la fermeture
      req.on('close', () => {
        clearInterval(pingInterval);
      });
    } catch (error) {
      logger.error(`Erreur lors de l'établissement de la connexion SSE pour le document ${req.params.id}:`, error);
      next(error);
    }
  }
};

module.exports = sseController;
