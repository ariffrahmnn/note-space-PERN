import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote, getNoteHistory, getArchivedNotes } from '../controllers/noteController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/',           getNotes);
router.post('/',          createNote);
router.get('/archived',   getArchivedNotes);
router.put('/:id',        updateNote);
router.delete('/:id',     deleteNote);
router.get('/:id/history', getNoteHistory);  // <-- route baru

export default router;
