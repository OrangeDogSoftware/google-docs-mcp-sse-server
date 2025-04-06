const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

/**
 * @route GET /api/stats
 * @desc Récupère les statistiques globales du système
 * @access Privé
 */
router.get('/', authenticate, statsController.getStats);

/**
 * @route GET /api/stats/docs/:id
 * @desc Récupère les statistiques d'utilisation d'un document spécifique
 * @access Privé
 */
router.get('/docs/:id', authenticate, statsController.getDocStats);

/**
 * @route GET /api/stats/users
 * @desc Récupère les statistiques d'activité des utilisateurs
 * @access Privé (Admin)
 */
router.get('/users', authenticate, statsController.getUserStats);

/**
 * @route GET /api/stats/sse
 * @desc Récupère les statistiques des connexions SSE
 * @access Privé (Admin)
 */
router.get('/sse', authenticate, statsController.getSseStats);

module.exports = router;
