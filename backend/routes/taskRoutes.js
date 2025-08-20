import { Router } from "express"
import { AdminOnly, protect } from "../middlewares/authMiddleware.js"
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardData,
  updateTaskStatus,
  updateTaskChecklist,
} from "../controllers/taskController.js"

const router = Router()

// === Dashboard ===
router.get("/dashboard-data", protect, getDashboardData)

// === Task Creation ===
router.post("/create", protect, AdminOnly, createTask)

// === Task Updates (more specific routes first) ===
router.put("/:id/status", protect, updateTaskStatus)
router.put("/:id/checklist", protect, updateTaskChecklist) // ✅ renamed from /todo

// === Task Read/Update/Delete ===
router.get("/", protect, getAllTasks)
router.get("/:id", protect, getTaskById)
router.put("/:id", protect, updateTask)
router.delete("/:id", protect, AdminOnly, deleteTask)

export { router as taskRoutes }
