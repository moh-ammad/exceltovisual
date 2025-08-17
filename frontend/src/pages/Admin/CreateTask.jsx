import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_ENDPOINTS } from '../../utils/apisPaths';
import toast from 'react-hot-toast';

import UserSelection from '../../createtasks/UserSelection';
import AttachmentList from '../../createtasks/AttachmentList';
import TodoList from '../../createtasks/TodoList';
import { UserRoundPlus } from 'lucide-react';
import UserAvatar from '../../createtasks/Useravatar';

const CreateTask = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [todoChecklist, setTodoChecklist] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.USERS.GET_ALL_USERS);
        setUsers(data);
      } catch {
        toast.error('Error fetching users');
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      toast.error('Invalid priority selected');
      return;
    }

    try {
      const sanitizedChecklist = todoChecklist.map(todo => ({
        text: todo.text,
        completed: false, // default for creation
      }));

      const payload = {
        title,
        description,
        priority,
        dueDate,
        assignedTo: selectedUsers.map((u) => u._id),
        todoChecklist: sanitizedChecklist,
        attachments,
        progress: 0, // status will be computed on backend
      };

      await axiosInstance.post(API_ENDPOINTS.TASKS.CREATE_TASK, payload);
      toast.success('Task created successfully');

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSelectedUsers([]);
      setTodoChecklist([]);
      setAttachments([]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create task');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto sm:px-4">
      <h1 className="text-3xl font-bold mb-8 dark:text-white text-gray-900">Create New Task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Title */}
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          aria-label="Task Title"
        />

        {/* Task Description */}
        <textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          aria-label="Task Description"
        />

        {/* Priority & Due Date */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 gap-4">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            aria-label="Select Priority"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            aria-label="Due Date"
          />
        </div>

        {/* Assigned Users */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold dark:text-white text-gray-700">Assigned Users</label>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition text-sm font-medium"
            aria-label="Add users to task"
          >
            <UserRoundPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Selected Users with Avatar */}
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((user) => (
            <div
              key={user._id}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap flex items-center gap-2"
            >
              <UserAvatar src={user.profileImageUrl} alt={user.name} />
              {user.name}
            </div>
          ))}
        </div>

        {/* Todo Checklist */}
        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Todos</label>
          <TodoList todos={todoChecklist} setTodos={setTodoChecklist} />
        </div>

        {/* Attachments */}
        <div>
          <label className="block mb-2 font-semibold dark:text-white text-gray-700">Attachments</label>
          <AttachmentList attachments={attachments} setAttachments={setAttachments} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Task
        </button>
      </form>

      {/* User Selection Modal */}
      {showModal && (
        <UserSelection
          users={users}
          selectedUsers={selectedUsers}
          onToggleUser={toggleUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CreateTask;
