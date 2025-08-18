import fs from 'fs';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Task from '../models/task.js';
import User from '../models/user.js';

dotenv.config();

const generateAndSendExcel = (res, data, sheetName, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
};

// Format users for export
const formatUsers = (users) => {
  return users.map(user => ({
    ID: user._id.toString(),
    Name: user.name,
    Email: user.email,
    Password: user.password,
    Role: user.role,
    ProfileImage: user.profileImageUrl || 'N/A',
    CreatedAt: user.createdAt?.toISOString() || '',
    UpdatedAt: user.updatedAt?.toISOString() || '',
  }));
};

// Format tasks for export (✅ include _ids)
const formatTasks = (tasks) => {
  return tasks.map(task => ({
    ID: task._id.toString(),
    Title: task.title,
    Description: task.description || '',
    Priority: task.priority,
    Status: task.status,
    DueDate: task.dueDate?.toISOString() || '',
    Progress: task.progress,
    CreatedBy: task.createdBy?._id?.toString() || '',
    AssignedTo: task.assignedTo.map(u => u._id?.toString()).join(','),
    TodoChecklist: JSON.stringify(task.todoChecklist || []),
    CreatedAt: task.createdAt?.toISOString() || '',
    UpdatedAt: task.updatedAt?.toISOString() || '',
  }));
};

const exportUserReport = async (req, res) => {
  try {
    const users = await User.find().lean();
    generateAndSendExcel(res, formatUsers(users), 'Users', 'users-report.xlsx');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export users' });
  }
};

const exportTaskReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo').populate('createdBy').lean();
    generateAndSendExcel(res, formatTasks(tasks), 'Tasks', 'tasks-report.xlsx');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export tasks' });
  }
};

const exportUsersAndTasksReport = async (req, res) => {
  try {
    const users = await User.find().lean();
    const tasks = await Task.find().populate('assignedTo').populate('createdBy').lean();

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatUsers(users)), 'Users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatTasks(tasks)), 'Tasks');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename="users-tasks-report.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.end(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export users and tasks' });
  }
};

const exportEmptyTemplate = (req, res) => {
  const usersTemplate = [{
    Name: '',
    Email: '',
    Role: '',
    'Admin Key': '',
    ProfileImage: '',
  }];

  const tasksTemplate = [{
    Title: '',
    Description: '',
    Priority: '',
    Status: '',
    DueDate: '',
    AssignedTo: '',  // Comma-separated _ids
    CreatedBy: '',   // _id of creator
    TodoChecklist: 'Task A | false + Task B | true',
    Progress: ''
  }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersTemplate), 'Users');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasksTemplate), 'Tasks');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Disposition', `attachment; filename="empty-template.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
};

// ✅ Import Logic Updated: Uses _id for AssignedTo and CreatedBy
const importUsersAndTasks = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const usersSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Users"] || {});
    const tasksSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Tasks"] || {});
    const errors = [];

    const importedEmailsSet = new Set();

    // === Import Users ===
    for (let i = 0; i < usersSheet.length; i++) {
      const row = usersSheet[i];
      const rowNum = i + 2;

      const id = row.ID?.trim() || null;
      const name = row.Name?.trim();
      const emailRaw = row.Email?.trim().toLowerCase();
      const roleRaw = row.Role?.trim().toLowerCase();
      const adminKey = row['Admin Key']?.trim();
      const profileImageUrl = row.ProfileImage?.trim() || '';

      if (!name || !emailRaw || !roleRaw) {
        errors.push(`[User Import] row ${rowNum}: Missing required fields (Name, Email, Role)`);
        continue;
      }

      if (!['admin', 'member'].includes(roleRaw)) {
        errors.push(`[User Import] row ${rowNum}: Invalid role "${roleRaw}"`);
        continue;
      }

      if (roleRaw === 'admin' && adminKey !== process.env.ADMIN_IMPORT_KEY) {
        errors.push(`[User Import] row ${rowNum}: Invalid Admin Key`);
        continue;
      }

      if (!id && importedEmailsSet.has(emailRaw)) {
        errors.push(`[User Import] row ${rowNum}: Duplicate email in upload "${emailRaw}"`);
        continue;
      }
      importedEmailsSet.add(emailRaw);

      const existingUser = id ? await User.findById(id) : await User.findOne({ email: emailRaw });

      try {
        if (existingUser) {
          await User.findByIdAndUpdate(existingUser._id, {
            name,
            email: emailRaw,
            role: roleRaw,
            profileImageUrl,
          });
        } else {
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          await User.create({
            name,
            email: emailRaw,
            role: roleRaw,
            password: hashedPassword,
            profileImageUrl,
          });
        }
      } catch (err) {
        errors.push(`[User Import] row ${rowNum}: ${err.message}`);
      }
    }

    // === Load user ID map (for validation) ===
    const userIds = await User.find().select('_id').lean();
    const userIdSet = new Set(userIds.map(u => u._id.toString()));

    // === Import Tasks ===
    for (let i = 0; i < tasksSheet.length; i++) {
      const row = tasksSheet[i];
      const rowNum = i + 2;

      const title = row.Title?.trim();
      const description = row.Description?.trim() || '';
      const priority = row.Priority?.trim().toLowerCase() || 'medium';
      const status = row.Status?.trim().toLowerCase() || 'pending';
      const dueDateRaw = row.DueDate?.trim();
      const assignedRaw = row.AssignedTo || '';
      const createdById = row.CreatedBy?.trim();
      const progress = Number(row.Progress) || 0;

      if (!title || !dueDateRaw || !assignedRaw || !createdById) {
        errors.push(`[Task Import] row ${rowNum}: Missing required fields`);
        continue;
      }

      const dueDate = new Date(dueDateRaw);
      if (isNaN(dueDate.getTime())) {
        errors.push(`[Task Import] row ${rowNum}: Invalid DueDate`);
        continue;
      }

      const assignedToIds = assignedRaw
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      const invalidAssignees = assignedToIds.filter(id => !userIdSet.has(id));
      if (invalidAssignees.length) {
        errors.push(`[Task Import] row ${rowNum}: Invalid assignee IDs: ${invalidAssignees.join(', ')}`);
        continue;
      }

      if (!userIdSet.has(createdById)) {
        errors.push(`[Task Import] row ${rowNum}: Invalid CreatedBy ID`);
        continue;
      }

      const allowedPriorities = ['low', 'medium', 'high'];
      const allowedStatuses = ['pending', 'in-progress', 'completed'];

      if (!allowedPriorities.includes(priority)) {
        errors.push(`[Task Import] row ${rowNum}: Invalid Priority "${priority}"`);
        continue;
      }

      if (!allowedStatuses.includes(status)) {
        errors.push(`[Task Import] row ${rowNum}: Invalid Status "${status}"`);
        continue;
      }

      let checklist = [];
      if (row.TodoChecklist) {
        try {
          checklist = JSON.parse(row.TodoChecklist);
        } catch {
          errors.push(`[Task Import] row ${rowNum}: Invalid JSON in TodoChecklist`);
          continue;
        }
      }

      try {
        await Task.create({
          title,
          description,
          priority,
          status,
          dueDate,
          progress,
          assignedTo: assignedToIds,
          createdBy: createdById,
          todoChecklist: checklist
        });
      } catch (err) {
        errors.push(`[Task Import] row ${rowNum}: ${err.message}`);
      }
    }

    await fs.promises.unlink(filePath);

    if (errors.length) {
      return res.status(400).json({ message: 'Import completed with errors', errors });
    }

    return res.status(200).json({ message: 'Users and tasks imported successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Import failed', error: err.message });
  }
};

export {
  exportUserReport,
  exportTaskReport,
  exportUsersAndTasksReport,
  exportEmptyTemplate,
  importUsersAndTasks
};
