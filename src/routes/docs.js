const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const docsController = require('../controllers/docsController');

/**
 * @route GET /api/docs
 * @desc Récupérer la liste des documents
 * @access Privé
 */
router.get('/', authenticate, docsController.getAllDocs);

/**
 * @route GET /api/docs/:id
 * @desc Récupérer un document spécifique
 * @access Privé
 */
router.get('/:id', authenticate, docsController.getDocById);

/**
 * @route POST /api/docs
 * @desc Créer un nouveau document
 * @access Privé
 */
router.post('/', authenticate, docsController.createDoc);

/**
 * @route PUT /api/docs/:id
 * @desc Mettre à jour un document
 * @access Privé
 */
router.put('/:id', authenticate, docsController.updateDoc);

/**
 * @route DELETE /api/docs/:id
 * @desc Supprimer un document
 * @access Privé
 */
router.delete('/:id', authenticate, docsController.deleteDoc);

/**
 * @route GET /api/docs/:id/history
 * @desc Récupérer l'historique des modifications d'un document
 * @access Privé
 */
router.get('/:id/history', authenticate, docsController.getDocHistory);

/**
 * @route POST /api/docs/:id/share
 * @desc Partager un document avec d'autres utilisateurs
 * @access Privé
 */
router.post('/:id/share', authenticate, docsController.shareDoc);

module.exports = router;
