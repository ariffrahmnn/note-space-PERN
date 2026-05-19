import { Router } from 'express';
import { getNotes, getArchivedNotes, createNote, updateNote, deleteNote, } from '../controllers/noteController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // semua route notes butuh auth

router.get('/', getNotes);
router.get('/archived', getArchivedNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
