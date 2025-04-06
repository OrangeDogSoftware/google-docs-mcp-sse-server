/**
 * Méthodes supplémentaires pour le service SSE
 */

const sseService = require('./services/sseService');

/**
 * Obtient le nombre total de connexions SSE globales
 * @returns {number} Nombre de connexions globales
 */
sseService.getGlobalConnectionsCount = function() {
  return this.clients.size;
};

/**
 * Obtient le nombre total de connexions SSE par document
 * @returns {Object} Map des connexions par document
 */
sseService.getDocConnectionsCount = function() {
  const counts = {};
  
  this.docClients.forEach((clients, docId) => {
    counts[docId] = clients.size;
  });
  
  return counts;
};

/**
 * Obtient la liste des utilisateurs connectés pour un document spécifique
 * @param {string} docId - ID du document
 * @returns {Array<string>} Liste des IDs utilisateur
 */
sseService.getConnectedUsers = function(docId) {
  if (!this.docClients.has(docId)) {
    return [];
  }
  
  const userIds = new Set();
  
  this.docClients.get(docId).forEach((client) => {
    userIds.add(client.userId);
  });
  
  return Array.from(userIds);
};

/**
 * Diffuse un message personnalisé à tous les clients connectés à un document
 * @param {string} docId - ID du document
 * @param {string} event - Type d'événement
 * @param {Object} data - Données à envoyer
 */
sseService.broadcastToDocument = function(docId, event, data) {
  if (this.docClients.has(docId)) {
    this.docClients.get(docId).forEach((client) => {
      try {
        client.sendEvent(event, data);
      } catch (error) {
        console.error(`Erreur lors de l'envoi d'un événement personnalisé au client:`, error);
      }
    });
  }
};

module.exports = sseService;
