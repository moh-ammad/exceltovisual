import Task from "../models/task.js";
import User from "../models/user.js"
import mongoose from "mongoose";

const getAllUsers = async (req, res) => {
    try {
        const users=await User.find({
            role:'member'
        }).select('-password');
        const userWithPassCounts=await Promise.all(users.map(async (user)=>{
            const pendingTasks=await Task.countDocuments({
                assignedTo: user._id,
                status: 'pending'
            })
            const inProgressTasks=await Task.countDocuments({
                assignedTo: user._id,
                status:"in-progress"
            })
            const completedTasks=await Task.countDocuments({
                assignedTo: user._id,
                status:"completed"
            })
            return {
                ...user.toObject(),
                pendingTasks,
                inProgressTasks,
                completedTasks
            }
        
        })
    )
    res.status(200).json(userWithPassCounts)

}catch (error) {
        res.status(500).json({
            message:"Error fetching users",
            error: error.message
        })
    }
}

const getUserById = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
    }
    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user",
            error: error.message
        })
    }
}

const deleteUser = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
    }
    try {
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
        res.status(500).json({
            message: "Error deleting user",
            error: error.message
        })
    }
}
export { getAllUsers, getUserById, deleteUser }