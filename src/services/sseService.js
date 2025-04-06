const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Service de gestion des connexions SSE et diffusion des notifications
 */
class SSEService {
  constructor() {
    // Clients SSE globaux
    this.clients = new Map();
    
    // Clients SSE par document
    this.docClients = new Map();
  }

  /**
   * Ajoute un nouveau client SSE global
   * @param {string} userId - ID de l'utilisateur
   * @param {function} sendEvent - Fonction pour envoyer des événements au client
   * @returns {string} ID du client
   */
  addClient(userId, sendEvent) {
    const clientId = uuidv4();
    
    this.clients.set(clientId, {
      userId,
      sendEvent,
      connectedAt: new Date()
    });
    
    return clientId;
  }

  /**
   * Supprime un client SSE global
   * @param {string} clientId - ID du client à supprimer
   */
  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  /**
   * Ajoute un client SSE pour un document spécifique
   * @param {string} docId - ID du document
   * @param {string} userId - ID de l'utilisateur
   * @param {function} sendEvent - Fonction pour envoyer des événements au client
   * @returns {string} ID du client
   */
  addDocClient(docId, userId, sendEvent) {
    const clientId = uuidv4();
    
    if (!this.docClients.has(docId)) {
      this.docClients.set(docId, new Map());
    }
    
    this.docClients.get(docId).set(clientId, {
      userId,
      sendEvent,
      connectedAt: new Date()
    });
    
    return clientId;
  }

  /**
   * Supprime un client SSE pour un document spécifique
   * @param {string} docId - ID du document
   * @param {string} clientId - ID du client à supprimer
   */
  removeDocClient(docId, clientId) {
    if (this.docClients.has(docId)) {
      this.docClients.get(docId).delete(clientId);
      
      // Nettoyage si plus aucun client pour ce document
      if (this.docClients.get(docId).size === 0) {
        this.docClients.delete(docId);
      }
    }
  }

  /**
   * Notifie tous les clients de la création d'un document
   * @param {string} docId - ID du document créé
   * @param {string} title - Titre du document
   */
  notifyDocCreated(docId, title) {
    const eventData = {
      type: 'created',
      documentId: docId,
      title,
      timestamp: new Date().toISOString()
    };
    
    this._notifyAllClients('document_event', eventData);
  }

  /**
   * Notifie tous les clients de la mise à jour d'un document
   * @param {string} docId - ID du document mis à jour
   * @param {Array} updates - Tableau des mises à jour effectuées
   */
  notifyDocUpdated(docId, updates) {
    const eventData = {
      type: 'updated',
      documentId: docId,
      updatesCount: updates.length,
      timestamp: new Date().toISOString()
    };
    
    this._notifyAllClients('document_event', eventData);
    this._notifyDocClients(docId, 'document_updated', {
      documentId: docId,
      updates,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifie tous les clients de la suppression d'un document
   * @param {string} docId - ID du document supprimé
   */
  notifyDocDeleted(docId) {
    const eventData = {
      type: 'deleted',
      documentId: docId,
      timestamp: new Date().toISOString()
    };
    
    this._notifyAllClients('document_event', eventData);
    this._notifyDocClients(docId, 'document_deleted', {
      documentId: docId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifie tous les clients du partage d'un document
   * @param {string} docId - ID du document partagé
   * @param {string} email - Adresse email de l'utilisateur avec qui le document est partagé
   * @param {string} role - Rôle attribué à l'utilisateur
   */
  notifyDocShared(docId, email, role) {
    const eventData = {
      type: 'shared',
      documentId: docId,
      email,
      role,
      timestamp: new Date().toISOString()
    };
    
    this._notifyAllClients('document_event', eventData);
    this._notifyDocClients(docId, 'document_shared', {
      documentId: docId,
      email,
      role,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Méthode privée pour notifier tous les clients globaux
   * @param {string} event - Type d'événement
   * @param {object} data - Données à envoyer
   * @private
   */
  _notifyAllClients(event, data) {
    this.clients.forEach((client) => {
      try {
        client.sendEvent(event, data);
      } catch (error) {
        logger.error(`Erreur lors de l'envoi d'un événement à un client:`, error);
      }
    });
  }

  /**
   * Méthode privée pour notifier les clients d'un document spécifique
   * @param {string} docId - ID du document
   * @param {string} event - Type d'événement
   * @param {object} data - Données à envoyer
   * @private
   */
  _notifyDocClients(docId, event, data) {
    if (this.docClients.has(docId)) {
      this.docClients.get(docId).forEach((client) => {
        try {
          client.sendEvent(event, data);
        } catch (error) {
          logger.error(`Erreur lors de l'envoi d'un événement à un client du document ${docId}:`, error);
        }
      });
    }
  }

  /**
   * Obtient le nombre total de connexions SSE globales
   * @returns {number} Nombre de connexions globales
   */
  getGlobalConnectionsCount() {
    return this.clients.size;
  }

  /**
   * Obtient le nombre total de connexions SSE par document
   * @returns {Object} Map des connexions par document
   */
  getDocConnectionsCount() {
    const counts = {};
    
    this.docClients.forEach((clients, docId) => {
      counts[docId] = clients.size;
    });
    
    return counts;
  }

  /**
   * Obtient la liste des utilisateurs connectés pour un document spécifique
   * @param {string} docId - ID du document
   * @returns {Array<string>} Liste des IDs utilisateur
   */
  getConnectedUsers(docId) {
    if (!this.docClients.has(docId)) {
      return [];
    }
    
    const userIds = new Set();
    
    this.docClients.get(docId).forEach((client) => {
      userIds.add(client.userId);
    });
    
    return Array.from(userIds);
  }

  /**
   * Diffuse un message personnalisé à tous les clients connectés à un document
   * @param {string} docId - ID du document
   * @param {string} event - Type d'événement
   * @param {Object} data - Données à envoyer
   */
  broadcastToDocument(docId, event, data) {
    if (this.docClients.has(docId)) {
      this.docClients.get(docId).forEach((client) => {
        try {
          client.sendEvent(event, data);
        } catch (error) {
          logger.error(`Erreur lors de l'envoi d'un événement personnalisé au client:`, error);
        }
      });
    }
  }
}

// Exporte une instance unique du service (Singleton)
module.exports = new SSEService();
