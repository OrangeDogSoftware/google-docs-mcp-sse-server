const { google } = require('googleapis');
const logger = require('../utils/logger');
const sseService = require('../services/sseService');

/**
 * Contrôleur pour la gestion des documents Google Docs
 */
const docsController = {
  /**
   * Récupère la liste des documents accessibles par l'utilisateur
   */
  async getAllDocs(req, res, next) {
    try {
      const auth = req.auth;
      const drive = google.drive({ version: 'v3', auth });
      
      // Recherche des documents Google Docs uniquement
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document'",
        fields: 'files(id, name, createdTime, modifiedTime, owners, shared)'
      });
      
      res.json({
        success: true,
        data: response.data.files
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des documents:', error);
      next(error);
    }
  },

  /**
   * Récupère un document spécifique par son ID
   */
  async getDocById(req, res, next) {
    try {
      const { id } = req.params;
      const auth = req.auth;
      const docs = google.docs({ version: 'v1', auth });
      
      const document = await docs.documents.get({ documentId: id });
      
      res.json({
        success: true,
        data: document.data
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération du document ${req.params.id}:`, error);
      
      if (error.code === 404) {
        return res.status(404).json({
          error: {
            message: 'Document non trouvé',
            code: 'DOC_NOT_FOUND'
          }
        });
      }
      
      next(error);
    }
  },

  /**
   * Crée un nouveau document Google Docs
   */
  async createDoc(req, res, next) {
    try {
      const { title, content } = req.body;
      const auth = req.auth;
      const docs = google.docs({ version: 'v1', auth });
      
      // Création du document vide
      const document = await docs.documents.create({
        requestBody: {
          title: title || 'Document sans titre'
        }
      });
      
      const documentId = document.data.documentId;
      
      // Si du contenu est fourni, on l'ajoute au document
      if (content) {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: 1
                  },
                  text: content
                }
              }
            ]
          }
        });
      }
      
      // Notification aux clients SSE
      sseService.notifyDocCreated(documentId, title || 'Document sans titre');
      
      res.status(201).json({
        success: true,
        data: document.data
      });
    } catch (error) {
      logger.error('Erreur lors de la création du document:', error);
      next(error);
    }
  },

  /**
   * Met à jour un document existant
   */
  async updateDoc(req, res, next) {
    try {
      const { id } = req.params;
      const { updates } = req.body;
      const auth = req.auth;
      const docs = google.docs({ version: 'v1', auth });
      
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          error: {
            message: 'Aucune mise à jour fournie',
            code: 'NO_UPDATES'
          }
        });
      }
      
      const result = await docs.documents.batchUpdate({
        documentId: id,
        requestBody: {
          requests: updates
        }
      });
      
      // Notification aux clients SSE
      sseService.notifyDocUpdated(id, updates);
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du document ${req.params.id}:`, error);
      
      if (error.code === 404) {
        return res.status(404).json({
          error: {
            message: 'Document non trouvé',
            code: 'DOC_NOT_FOUND'
          }
        });
      }
      
      next(error);
    }
  },

  /**
   * Supprime un document
   */
  async deleteDoc(req, res, next) {
    try {
      const { id } = req.params;
      const auth = req.auth;
      const drive = google.drive({ version: 'v3', auth });
      
      await drive.files.delete({
        fileId: id
      });
      
      // Notification aux clients SSE
      sseService.notifyDocDeleted(id);
      
      res.status(204).end();
    } catch (error) {
      logger.error(`Erreur lors de la suppression du document ${req.params.id}:`, error);
      
      if (error.code === 404) {
        return res.status(404).json({
          error: {
            message: 'Document non trouvé',
            code: 'DOC_NOT_FOUND'
          }
        });
      }
      
      next(error);
    }
  },

  /**
   * Récupère l'historique des modifications d'un document
   */
  async getDocHistory(req, res, next) {
    try {
      const { id } = req.params;
      const auth = req.auth;
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.revisions.list({
        fileId: id,
        fields: 'revisions(id, modifiedTime, lastModifyingUser)'
      });
      
      res.json({
        success: true,
        data: response.data.revisions || []
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'historique du document ${req.params.id}:`, error);
      
      if (error.code === 404) {
        return res.status(404).json({
          error: {
            message: 'Document non trouvé',
            code: 'DOC_NOT_FOUND'
          }
        });
      }
      
      next(error);
    }
  },

  /**
   * Partage un document avec d'autres utilisateurs
   */
  async shareDoc(req, res, next) {
    try {
      const { id } = req.params;
      const { email, role = 'reader' } = req.body;
      const auth = req.auth;
      const drive = google.drive({ version: 'v3', auth });
      
      if (!email) {
        return res.status(400).json({
          error: {
            message: 'Adresse email requise',
            code: 'EMAIL_REQUIRED'
          }
        });
      }
      
      // Vérification que le rôle est valide
      const validRoles = ['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: {
            message: 'Rôle invalide',
            code: 'INVALID_ROLE'
          }
        });
      }
      
      const permission = await drive.permissions.create({
        fileId: id,
        sendNotificationEmail: true,
        requestBody: {
          type: 'user',
          role,
          emailAddress: email
        }
      });
      
      // Notification aux clients SSE
      sseService.notifyDocShared(id, email, role);
      
      res.status(201).json({
        success: true,
        data: permission.data
      });
    } catch (error) {
      logger.error(`Erreur lors du partage du document ${req.params.id}:`, error);
      
      if (error.code === 404) {
        return res.status(404).json({
          error: {
            message: 'Document non trouvé',
            code: 'DOC_NOT_FOUND'
          }
        });
      }
      
      next(error);
    }
  }
};

module.exports = docsController;
