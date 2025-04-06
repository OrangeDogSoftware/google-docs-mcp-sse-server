const { google } = require('googleapis');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Modèle pour interagir avec les documents Google Docs
 * Implémente la couche Modèle du pattern MCP
 */
class DocModel {
  /**
   * Récupère la liste des documents Google Docs accessibles par l'utilisateur
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Array>} Liste des documents
   */
  static async listDocs(auth) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document'",
        fields: 'files(id, name, createdTime, modifiedTime, owners, shared)'
      });
      
      return response.data.files || [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des documents:', error);
      throw this._handleGoogleApiError(error);
    }
  }

  /**
   * Récupère un document par son ID
   * @param {string} docId - ID du document Google Docs
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Object>} Document Google Docs
   */
  static async getDoc(docId, auth) {
    try {
      const docs = google.docs({ version: 'v1', auth });
      
      const document = await docs.documents.get({
        documentId: docId
      });
      
      return document.data;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Crée un nouveau document Google Docs
   * @param {string} title - Titre du document
   * @param {string} content - Contenu initial du document (optionnel)
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Object>} Document créé
   */
  static async createDoc(title, content, auth) {
    try {
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
      
      return document.data;
    } catch (error) {
      logger.error('Erreur lors de la création du document:', error);
      throw this._handleGoogleApiError(error);
    }
  }

  /**
   * Met à jour un document existant
   * @param {string} docId - ID du document
   * @param {Array} updates - Tableau des mises à jour à effectuer
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  static async updateDoc(docId, updates, auth) {
    try {
      const docs = google.docs({ version: 'v1', auth });
      
      const result = await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: updates
        }
      });
      
      return result.data;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Supprime un document
   * @param {string} docId - ID du document à supprimer
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<void>}
   */
  static async deleteDoc(docId, auth) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      
      await drive.files.delete({
        fileId: docId
      });
    } catch (error) {
      logger.error(`Erreur lors de la suppression du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Récupère l'historique des modifications d'un document
   * @param {string} docId - ID du document
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Array>} Liste des révisions
   */
  static async getDocHistory(docId, auth) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.revisions.list({
        fileId: docId,
        fields: 'revisions(id, modifiedTime, lastModifyingUser)'
      });
      
      return response.data.revisions || [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'historique du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Partage un document avec un utilisateur
   * @param {string} docId - ID du document
   * @param {string} email - Adresse email de l'utilisateur
   * @param {string} role - Rôle à attribuer (reader, writer, commenter, owner...)
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Object>} Résultat du partage
   */
  static async shareDoc(docId, email, role, auth) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      
      const permission = await drive.permissions.create({
        fileId: docId,
        sendNotificationEmail: true,
        requestBody: {
          type: 'user',
          role,
          emailAddress: email
        }
      });
      
      return permission.data;
    } catch (error) {
      logger.error(`Erreur lors du partage du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Récupère les commentaires d'un document
   * @param {string} docId - ID du document
   * @param {OAuth2Client} auth - Client OAuth2 authentifié
   * @returns {Promise<Array>} Liste des commentaires
   */
  static async getDocComments(docId, auth) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      
      const response = await drive.comments.list({
        fileId: docId,
        fields: 'comments(id, content, createdTime, author, resolved)'
      });
      
      return response.data.comments || [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération des commentaires du document ${docId}:`, error);
      throw this._handleGoogleApiError(error, docId);
    }
  }

  /**
   * Gère les erreurs de l'API Google
   * @param {Error} error - Erreur d'origine
   * @param {string} docId - ID du document (optionnel)
   * @returns {ApiError} Erreur API formatée
   * @private
   */
  static _handleGoogleApiError(error, docId = null) {
    const docInfo = docId ? ` (ID: ${docId})` : '';
    
    // Vérification du code d'erreur
    if (error.code === 404) {
      return ApiError.notFound(`Document non trouvé${docInfo}`, 'DOC_NOT_FOUND', error);
    }
    
    if (error.code === 403) {
      return ApiError.forbidden(`Accès refusé au document${docInfo}`, 'ACCESS_DENIED', error);
    }
    
    if (error.code === 401) {
      return ApiError.unauthorized('Authentification requise', 'UNAUTHENTICATED', error);
    }
    
    if (error.code === 429) {
      return ApiError.tooManyRequests('Quota d\'API dépassé', 'QUOTA_EXCEEDED', error);
    }
    
    // Par défaut, on renvoie une erreur interne
    return ApiError.internal(`Erreur lors de l'opération sur le document${docInfo}`, 'GOOGLE_API_ERROR', error);
  }
}

module.exports = DocModel;
