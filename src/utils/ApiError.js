/**
 * Classe personnalisée pour les erreurs API
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - Code d'état HTTP
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   */
  constructor(statusCode, message, code, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.originalError = originalError;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Crée une erreur 400 Bad Request
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static badRequest(message = 'Requête invalide', code = 'BAD_REQUEST', originalError = null) {
    return new ApiError(400, message, code, originalError);
  }

  /**
   * Crée une erreur 401 Unauthorized
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static unauthorized(message = 'Non autorisé', code = 'UNAUTHORIZED', originalError = null) {
    return new ApiError(401, message, code, originalError);
  }

  /**
   * Crée une erreur 403 Forbidden
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static forbidden(message = 'Accès interdit', code = 'FORBIDDEN', originalError = null) {
    return new ApiError(403, message, code, originalError);
  }

  /**
   * Crée une erreur 404 Not Found
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static notFound(message = 'Ressource non trouvée', code = 'NOT_FOUND', originalError = null) {
    return new ApiError(404, message, code, originalError);
  }

  /**
   * Crée une erreur 409 Conflict
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static conflict(message = 'Conflit avec l\'état actuel de la ressource', code = 'CONFLICT', originalError = null) {
    return new ApiError(409, message, code, originalError);
  }

  /**
   * Crée une erreur 429 Too Many Requests
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static tooManyRequests(message = 'Trop de requêtes', code = 'TOO_MANY_REQUESTS', originalError = null) {
    return new ApiError(429, message, code, originalError);
  }

  /**
   * Crée une erreur 500 Internal Server Error
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static internal(message = 'Erreur interne du serveur', code = 'INTERNAL_SERVER_ERROR', originalError = null) {
    return new ApiError(500, message, code, originalError);
  }

  /**
   * Crée une erreur 503 Service Unavailable
   * @param {string} message - Message d'erreur
   * @param {string} code - Code d'erreur interne
   * @param {Error} originalError - Erreur d'origine (optionnelle)
   * @returns {ApiError}
   */
  static serviceUnavailable(message = 'Service temporairement indisponible', code = 'SERVICE_UNAVAILABLE', originalError = null) {
    return new ApiError(503, message, code, originalError);
  }
}

module.exports = ApiError;
