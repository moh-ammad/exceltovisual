import fs from 'fs';
import XLSX from 'xlsx';
import Task from '../models/task.js';
import User from '../models/user.js';


/**
 * Utility: Generate Excel file from JSON data and send as response
 */
const generateAndSendExcel = (res, data, sheetName, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write as binary string
  const excelBinary = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

  // Convert binary string to Buffer
  const buffer = Buffer.from(excelBinary, 'binary');

  // Set correct headers
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  // Send the file buffer
  res.end(buffer);
};

/**
 * Format user data
 */
const formatUsers = (users) => {
  return users.map(user => ({
    ID: user._id.toString(),
    Name: user.name,
    Email: user.email,
    Role: user.role,
    ProfileImage: user.profileImageUrl || 'N/A',
    CreatedAt: user.createdAt,
    UpdatedAt: user.updatedAt
  }));
};

/**
 * Format task data with todoChecklist as JSON string
 */
const formatTasks = (tasks) => {
  return tasks.map(task => ({
    ID: task._id.toString(),
    Title: task.title,
    Description: task.description || 'N/A',
    Priority: task.priority,
    Status: task.status,
    DueDate: task.dueDate,
    Progress: task.progress,
    CreatedBy: task.createdBy?.name || 'Unknown',
    CreatedByEmail: task.createdBy?.email || 'Unknown',
    AssignedTo: Array.isArray(task.assignedTo) && task.assignedTo.length > 0
      ? task.assignedTo.map(u => u.email).join(', ')
      : 'Unassigned',
    TodoChecklist: JSON.stringify(task.todoChecklist || []),
    CreatedAt: task.createdAt,
    UpdatedAt: task.updatedAt
  }));
};

/**
 * Controller: Admin exports all users
 */
const exportUserReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admins only." });
    }
    const users = await User.find().select('-password -__v').lean();
    const formattedUsers = formatUsers(users);
    generateAndSendExcel(res, formattedUsers, 'Users', 'users-report.xlsx');
  } catch (err) {
    console.error('Error exporting users:', err);
    res.status(500).json({ message: 'Failed to export users' });
  }
};

/**
 * Controller: Admin exports all tasks
 */
const exportTaskReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admins only." });
    }
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const formattedTasks = formatTasks(tasks);
    generateAndSendExcel(res, formattedTasks, 'Tasks', 'tasks-report.xlsx');
  } catch (err) {
    console.error('Error exporting tasks:', err);
    res.status(500).json({ message: 'Failed to export tasks' });
  }
};

/**
 * Controller: User exports only their own created tasks
 */
const exportMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const tasks = await Task.find({ createdBy: userId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const formattedTasks = formatTasks(tasks);

    generateAndSendExcel(res, formattedTasks, 'My Tasks', 'my-tasks.xlsx');
  } catch (err) {
    console.error('Error exporting user tasks:', err);
    res.status(500).json({ message: 'Failed to export your tasks' });
  }
};


const importExcelTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded." });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const isAdmin = req.user.role.toLowerCase() === 'admin';

    const usersSheet = isAdmin ? XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || {}) : [];
    const tasksSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Tasks"] || {});

    const errors = [];
    const userEmailToId = {};

    // Step 1: Validate and map users (if admin)
    if (isAdmin) {
      for (let i = 0; i < usersSheet.length; i++) {
        const row = usersSheet[i];
        const rowNum = i + 2;
        const name = row.name?.trim();
        const email = row.email?.trim().toLowerCase();
        const role = row.role?.trim().toLowerCase();

        if (!name || !email || !role) {
          errors.push(`Users sheet row ${rowNum}: Missing required fields.`);
          continue;
        }

        if (!["admin", "member"].includes(role)) {
          errors.push(`Users sheet row ${rowNum}: Invalid role "${role}".`);
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          errors.push(`Users sheet row ${rowNum}: User "${email}" not found. Register them first.`);
        } else {
          userEmailToId[email] = existingUser._id;
        }
      }
    } else {
      if (usersSheet.length > 0) {
        errors.push("You are not allowed to upload or import users.");
      }
      userEmailToId[req.user.email.toLowerCase()] = req.user._id;
    }

    // Step 2: Process tasks
    for (let i = 0; i < tasksSheet.length; i++) {
      const row = tasksSheet[i];
      const rowNum = i + 2;

      const title = row.title?.trim();
      const description = row.description?.trim();
      const priority = row.priority?.trim().toLowerCase() || 'medium';
      const status = row.status?.trim().toLowerCase() || 'pending';
      const dueDate = row.dueDate;
      const assignedToEmails = row.assignedToEmails;
      const progress = row.progress || 0;
      const checklistRaw = row.todoChecklist;

      if (!title || !dueDate || !assignedToEmails) {
        errors.push(`Tasks sheet row ${rowNum}: Missing required fields.`);
        continue;
      }

      if (!["low", "medium", "high"].includes(priority)) {
        errors.push(`Tasks sheet row ${rowNum}: Invalid priority "${priority}".`);
        continue;
      }

      if (!["pending", "in-progress", "completed"].includes(status)) {
        errors.push(`Tasks sheet row ${rowNum}: Invalid status "${status}".`);
        continue;
      }

      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate)) {
        errors.push(`Tasks sheet row ${rowNum}: Invalid dueDate.`);
        continue;
      }

      const emailList = assignedToEmails.split(',').map(email => email.trim().toLowerCase());
      const assignedToIds = [];

      for (const email of emailList) {
        const userId = userEmailToId[email];
        if (!userId) {
          errors.push(`Tasks sheet row ${rowNum}: Assigned user "${email}" not found.`);
        } else {
          assignedToIds.push(userId);
        }
      }

      if (assignedToIds.length === 0) {
        errors.push(`Tasks sheet row ${rowNum}: No valid users found for assignment.`);
        continue;
      }

      if (!isAdmin && !assignedToIds.includes(req.user._id)) {
        errors.push(`Tasks sheet row ${rowNum}: You can only assign tasks to yourself.`);
        continue;
      }

      let todosArray = [];
      if (checklistRaw) {
        try {
          todosArray = JSON.parse(checklistRaw);
          if (!Array.isArray(todosArray)) {
            errors.push(`Tasks sheet row ${rowNum}: TodoChecklist must be an array.`);
            continue;
          }
        } catch (err) {
          errors.push(`Tasks sheet row ${rowNum}: Invalid TodoChecklist JSON.`);
          continue;
        }
      }

      try {
        await Task.create({
          title,
          description,
          priority,
          status,
          dueDate: parsedDueDate,
          assignedTo: assignedToIds,
          createdBy: req.user._id,
          progress,
          todoChecklist: todosArray
        });
      } catch (err) {
        errors.push(`Tasks sheet row ${rowNum}: Failed to create task - ${err.message}`);
      }
    }

    // Step 3: Clean up uploaded file
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn("Failed to delete uploaded file:", err.message);
    }

    // Final response
    if (errors.length > 0) {
      return res.status(400).json({ message: "Excel processed with errors.", errors });
    }

    return res.status(200).json({ message: "Excel imported successfully." });

  } catch (err) {
    console.error("Excel import error:", err);
    return res.status(500).json({
      message: "Internal server error during Excel import.",
      error: err.message
    });
  }
};




export {
  exportUserReport,
  exportTaskReport,
  exportMyTasks,
  importExcelTasks
};
