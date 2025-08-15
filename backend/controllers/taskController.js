import syncTaskStatusWithTodos, { getTaskStats } from "../helper.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import mongoose from "mongoose";

const getAllTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const isAdmin = req.user.role === 'admin';

    const taskFilter = {};
    if (status) taskFilter.status = status;
    if (!isAdmin) taskFilter.assignedTo = req.user._id;

    let tasks = await Task.find(taskFilter).populate('assignedTo', 'name email profileImageUrl');


    tasks = tasks.map(task => {
      const completedCount = task.todoChecklist.filter(todo => todo.completed).length;
      return {
        ...task.toObject(),
        completedTodoCount: completedCount
      };
    });

    const baseFilter = isAdmin ? {} : { assignedTo: req.user._id };

    const [totalTasks, pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
      Task.countDocuments(baseFilter),
      Task.countDocuments({ ...baseFilter, status: 'pending' }),
      Task.countDocuments({ ...baseFilter, status: 'in-progress' }),
      Task.countDocuments({ ...baseFilter, status: 'completed' })
    ]);

    res.status(200).json({
      tasks,
      statusSummary: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      }
    });

  } catch (error) {
    console.error("Error in getDashboardData:", error.message);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
};




const getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id).populate('assignedTo', 'name email profileImageUrl');
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !task.assignedTo.some(user => user._id.equals(req.user._id))) {
      return res.status(403).json({ message: "You are not authorized to view this task" });
    }

    const completedCount = task.todoChecklist.filter(todo => todo.completed).length;
    const enrichedTask = {
      ...task.toObject(),
      completedTodoCount: completedCount
    };

    res.status(200).json(enrichedTask);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching task",
      error: error.message
    });
  }
};




const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      progress,
    } = req.body;
    const existingTask = await Task.findOne({
      title,
      dueDate,
      createdBy: req.user._id
    });
    if (existingTask) {
      return res.status(409).json({ message: "Task with same title and due date already exists" });
    }


    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({ message: "assignedTo must be an array" });
    }
    for (const userId of assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: `Invalid user ID: ${userId}` });
      }
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({ message: `User not found: ${userId}` });
      }
    }


    const newTask = await Task.create({
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      attachments,
      todoChecklist,
      progress,
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: "Invalid Task Data", error: error.message });
  }
};



const updateTask = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  const allowedFields = ["title", "description", "dueDate", "priority", "todoChecklist", "attachments"];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
  );

  try {
    const task = await Task.findById(id).populate('assignedTo', 'name email profileImageUrl');
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        task[key] = updates[key];
      }
    }


    syncTaskStatusWithTodos(task);

    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Error updating task",
      error: error.message
    });
  }
};




const deleteTask = async (req, res) => {
  const { id } = req.params;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Only admin can delete tasks" });
  }

  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting task",
      error: error.message
    });
  }
};


const getDashboardData = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

    // 📊 Group by Status (excluding 'completed')
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          ...filter,
          status: { $ne: 'completed' },
          dueDate: { $lt: new Date() }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // 🚦 Group by Priority
    const tasksByPriority = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    // 🕒 Recent Tasks
    const recentTasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority createdAt");

    res.status(200).json({
      statusSummary: tasksByStatus,
      prioritySummary: tasksByPriority,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};




const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { todoChecklist } = req.body; // e.g. updated todos

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    if (todoChecklist) {
      task.todoChecklist = todoChecklist;
    }

    syncTaskStatusWithTodos(task);

    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Error updating task status",
      error: error.message,
    });
  }
};



const updateTaskChecklist = async (req, res) => {
  const { id } = req.params;
  const { checklist } = req.body;

  if (!Array.isArray(checklist)) {
    return res.status(400).json({ message: "Checklist must be an array." });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ message: "Access denied: Only admin or assigned users can update this task." });
    }

    // Append new todos
    task.todoChecklist = [...task.todoChecklist, ...checklist];

    // Optional: sync status/progress if you have such a function
    // syncTaskStatusWithTodos(task);

    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Error updating checklist",
      error: error.message,
    });
  }
};



export {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardData,
  updateTaskStatus,
  updateTaskChecklist
};
