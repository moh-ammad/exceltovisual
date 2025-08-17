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
 * Format user data for Excel export
 */
const formatUsers = (users) => {
  return users.map(user => ({
    ID: user._id.toString(),
    Name: user.name,
    Email: user.email,
    Role: user.role,
    ProfileImage: user.profileImageUrl || 'N/A',
    CreatedAt: user.createdAt ? user.createdAt.toISOString() : '',
    UpdatedAt: user.updatedAt ? user.updatedAt.toISOString() : '',
  }));
};

/**
 * Format task data for Excel export
 */
const formatTasks = (tasks) => {
  return tasks.map(task => ({
    ID: task._id.toString(),
    Title: task.title,
    Description: task.description || 'N/A',
    Priority: task.priority,
    Status: task.status,
    DueDate: task.dueDate ? task.dueDate.toISOString() : '',
    Progress: task.progress,
    CreatedBy: task.createdBy?.name || 'Unknown',
    CreatedByEmail: task.createdBy?.email || 'Unknown',
    AssignedToEmails: Array.isArray(task.assignedTo) && task.assignedTo.length > 0
      ? task.assignedTo.map(u => u.email).join(', ')
      : 'Unassigned',
    TodoChecklist: JSON.stringify(task.todoChecklist || []),
    CreatedAt: task.createdAt ? task.createdAt.toISOString() : '',
    UpdatedAt: task.updatedAt ? task.updatedAt.toISOString() : '',
  }));
};

/**
 * Controller: Export all users as XLSX
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
 * Controller: Export all tasks as XLSX
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
 * Controller: Export both users and tasks in one XLSX file with two sheets
 */
const exportUsersAndTasksReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admins only." });
    }

    const users = await User.find().select('-password -__v').lean();
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const formattedUsers = formatUsers(users);
    const formattedTasks = formatTasks(tasks);

    const workbook = XLSX.utils.book_new();
    const wsUsers = XLSX.utils.json_to_sheet(formattedUsers);
    const wsTasks = XLSX.utils.json_to_sheet(formattedTasks);

    XLSX.utils.book_append_sheet(workbook, wsUsers, 'Users');
    XLSX.utils.book_append_sheet(workbook, wsTasks, 'Tasks');

    const excelBinary = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const buffer = Buffer.from(excelBinary, 'binary');

    res.setHeader('Content-Disposition', 'attachment; filename="users-tasks-report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.end(buffer);

  } catch (err) {
    console.error('Error exporting users and tasks:', err);
    res.status(500).json({ message: 'Failed to export users and tasks' });
  }
};

/**
 * Controller: Export empty XLSX template with headers only
 */
const exportEmptyTemplate = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied: Admins only." });
  }

  const emptyUsersHeaders = [
    { ID: '', Name: '', Email: '', Role: '', ProfileImage: '', CreatedAt: '', UpdatedAt: '' }
  ];

  const emptyTasksHeaders = [
    {
      ID: '',
      Title: '',
      Description: '',
      Priority: '',
      Status: '',
      DueDate: '',
      Progress: '',
      CreatedBy: '',
      CreatedByEmail: '',
      AssignedToEmails: '',
      TodoChecklist: '',
      CreatedAt: '',
      UpdatedAt: '',
    }
  ];

  const workbook = XLSX.utils.book_new();
  const wsUsers = XLSX.utils.json_to_sheet(emptyUsersHeaders);
  const wsTasks = XLSX.utils.json_to_sheet(emptyTasksHeaders);

  XLSX.utils.book_append_sheet(workbook, wsUsers, 'Users');
  XLSX.utils.book_append_sheet(workbook, wsTasks, 'Tasks');

  const excelBinary = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  const buffer = Buffer.from(excelBinary, 'binary');

  res.setHeader('Content-Disposition', 'attachment; filename="empty-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
};

/**
 * Controller: Import users and tasks from XLSX (Admin only)
 */
const importUsersAndTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded." });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can import users and tasks." });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);

    const usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || {});
    const tasksSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Tasks"] || {});

    const errors = [];

    // 1) Process Users sheet: create or update users
    for (let i = 0; i < usersSheet.length; i++) {
      const row = usersSheet[i];
      const rowNum = i + 2;

      const name = row.Name?.trim();
      const email = row.Email?.trim().toLowerCase();
      const role = row.Role?.trim().toLowerCase();

      if (!name || !email || !role) {
        errors.push(`Users sheet row ${rowNum}: Missing required fields.`);
        continue;
      }

      if (!["admin", "member"].includes(role)) {
        errors.push(`Users sheet row ${rowNum}: Invalid role "${role}".`);
        continue;
      }

      try {
        let user = await User.findOne({ email });
        if (user) {
          // Update user data except password
          user.name = name;
          user.role = role;
          await user.save();
        } else {
          // Create new user with a temporary password (you should handle password reset flow)
          user = new User({
            name,
            email,
            role,
            password: 'changeme123', // Change or notify user to reset later
          });
          await user.save();
        }
      } catch (err) {
        errors.push(`Users sheet row ${rowNum}: Failed to create/update user - ${err.message}`);
      }
    }

    // 2) Build email to userId map after updates
    const usersInDB = await User.find().select('_id email').lean();
    const userEmailToId = {};
    usersInDB.forEach(u => {
      userEmailToId[u.email.toLowerCase()] = u._id;
    });

    // 3) Process Tasks sheet
    for (let i = 0; i < tasksSheet.length; i++) {
      const row = tasksSheet[i];
      const rowNum = i + 2;

      const title = row.Title?.trim();
      const description = row.Description?.trim() || '';
      const priority = (row.Priority?.trim().toLowerCase()) || 'medium';
      const status = (row.Status?.trim().toLowerCase()) || 'pending';
      const dueDateRaw = row.DueDate;
      const progress = Number(row.Progress) || 0;
      const createdByEmail = row.CreatedByEmail?.trim().toLowerCase();
      const assignedToEmailsRaw = row.AssignedToEmails || '';
      const todoChecklistRaw = row.TodoChecklist || '';

      if (!title || !dueDateRaw || !assignedToEmailsRaw) {
        errors.push(`Tasks sheet row ${rowNum}: Missing required fields (Title, DueDate, AssignedToEmails).`);
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

      const parsedDueDate = new Date(dueDateRaw);
      if (isNaN(parsedDueDate)) {
        errors.push(`Tasks sheet row ${rowNum}: Invalid DueDate.`);
        continue;
      }

      let createdById = userEmailToId[createdByEmail];
      if (!createdById) {
        createdById = req.user._id; // fallback to importer user
      }

      const assignedEmails = assignedToEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
      const assignedToIds = [];

      for (const email of assignedEmails) {
        const userId = userEmailToId[email];
        if (!userId) {
          errors.push(`Tasks sheet row ${rowNum}: Assigned user "${email}" not found.`);
        } else {
          assignedToIds.push(userId);
        }
      }

      if (assignedToIds.length === 0) {
        errors.push(`Tasks sheet row ${rowNum}: No valid assigned users found.`);
        continue;
      }

      let todosArray = [];
      if (todoChecklistRaw) {
        try {
          todosArray = JSON.parse(todoChecklistRaw);
          if (!Array.isArray(todosArray)) {
            errors.push(`Tasks sheet row ${rowNum}: TodoChecklist must be a JSON array.`);
            continue;
          }
        } catch {
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
          progress,
          createdBy: createdById,
          assignedTo: assignedToIds,
          todoChecklist: todosArray
        });
      } catch (err) {
        errors.push(`Tasks sheet row ${rowNum}: Failed to create task - ${err.message}`);
      }
    }

    // Delete uploaded file after processing
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn("Failed to delete uploaded file:", err.message);
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Import completed with errors.", errors });
    }

    return res.status(200).json({ message: "Users and tasks imported successfully." });

  } catch (err) {
    console.error("Error importing users and tasks:", err);
    return res.status(500).json({ message: "Server error during import.", error: err.message });
  }
};

export {
  exportUserReport,
  exportTaskReport,
  exportUsersAndTasksReport,
  exportEmptyTemplate,
  importUsersAndTasks
};
