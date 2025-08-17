import express from 'express';
import multer from 'multer';
import {
  exportUserReport,
  exportTaskReport,
  exportUsersAndTasksReport,
  exportEmptyTemplate,
  importUsersAndTasks
} from '../controllers/reportController.js';

import { protect,AdminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Export routes
router.get('/exports/users', protect, AdminOnly, exportUserReport);
router.get('/exports/tasks', protect, AdminOnly, exportTaskReport);
router.get('/exports/users-tasks', protect, AdminOnly, exportUsersAndTasksReport);
router.get('/exports/empty-template', protect, AdminOnly, exportEmptyTemplate);

// Import route (upload Excel file)
router.post('/upload/users-tasks', protect, AdminOnly, upload.single('excelfile'), importUsersAndTasks);

export { router as reportRoutes };