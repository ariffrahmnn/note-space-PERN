// server/routes/collabRoutes.js
import { Router } from 'express';
import { inviteCollaborator, getCollaborators, removeCollaborator, } from '../controllers/collabController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true }); // penting untuk akses :noteId dari parent
router.use(protect);

router.post('/invite', inviteCollaborator);           // POST /api/notes/:id/invite
router.get('/collaborators', getCollaborators);       // GET  /api/notes/:id/collaborators
router.delete('/collaborators/:collabId', removeCollaborator); // DELETE /api/notes/:noteId/collaborators/:collabId

export default router;
