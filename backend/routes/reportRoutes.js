import express from 'express';
import multer from 'multer';
import {
  exportUserReport,
  exportTaskReport,
  exportUsersAndTasksReport,
  exportEmptyTemplate,
  importUsersAndTasks
} from '../controllers/reportController.js';

import { protect, AdminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// EXPORT ROUTES
router.get('/exports/template', protect, AdminOnly, exportEmptyTemplate);        // 1. Empty template
router.get('/exports/users', protect, AdminOnly, exportUserReport);             // 2. Just users
router.get('/exports/tasks', protect, AdminOnly, exportTaskReport);             // 3. Just tasks
router.get('/exports/users-tasks', protect, AdminOnly, exportUsersAndTasksReport); // 4. Users + tasks

// IMPORT ROUTE
router.post('/upload/users-tasks', protect, AdminOnly, upload.single('excelfile'), importUsersAndTasks); // 5. Import combined file

export { router as reportRoutes };
