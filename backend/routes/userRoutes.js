import { Router } from "express";
import { AdminOnly, protect } from "../middlewares/authMiddleware.js";
import { getAllUsers, getUserById, deleteUser } from "../controllers/userController.js";

const router= Router();

router.get("/",protect,AdminOnly,getAllUsers);
router.get("/:id",protect,getUserById);
router.delete("/:id",protect,AdminOnly,deleteUser);

export const userRoutes = router;