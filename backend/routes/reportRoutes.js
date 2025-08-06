import { Router } from 'express'
import { AdminOnly, protect } from '../middlewares/authMiddleware.js'
import { exportMyTasks, exportTaskReport, exportUserReport,importExcelTasks} from '../controllers/reportController.js'
import upload from "../middlewares/uploadMiddleware.js";


const router=Router()

router.get("/exports/todos",protect,AdminOnly,exportTaskReport)
router.get("/exports/users",protect,AdminOnly,exportUserReport)
router.get("/exports/my-tasks", protect, exportMyTasks)
// For admin
router.post("/upload/tasks", protect, AdminOnly, upload.single("excelfile"), importExcelTasks);

// For member (user)
router.post("/upload/my-tasks", protect, upload.single("excelfile"), importExcelTasks);



export const reportRoutes = router
