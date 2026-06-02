
import { Router } from 'express';
import {
  inviteCollaborator,
  getCollaborators,
  removeCollaborator,
  leaveCollaborator,
} from '../controllers/collabController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true }); 
router.use(protect);

router.post('/invite', inviteCollaborator);           
router.get('/collaborators', getCollaborators);       
router.delete('/collaborators/:collabId', removeCollaborator); 
router.delete('/leave', leaveCollaborator);           

export default router;
