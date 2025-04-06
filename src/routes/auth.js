const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route GET /api/auth/url
 * @desc Génère une URL d'authentification Google OAuth2
 * @access Public
 */
router.get('/url', authController.getAuthUrl);

/**
 * @route POST /api/auth/token
 * @desc Échange un code d'autorisation contre des tokens
 * @access Public
 */
router.post('/token', authController.getToken);

/**
 * @route POST /api/auth/refresh
 * @desc Rafraîchit un token d'accès expiré
 * @access Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/revoke
 * @desc Révoque un token d'accès
 * @access Privé
 */
router.post('/revoke', authController.revokeToken);

/**
 * @route GET /api/auth/verify
 * @desc Vérifie la validité d'un token d'accès
 * @access Public
 */
router.get('/verify', authController.verifyToken);

module.exports = router;
