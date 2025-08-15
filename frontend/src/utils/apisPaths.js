export const BASE_URL = "http://localhost:5000/api";

export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        GET_PROFILE: "/auth/profile",
    },
    USERS: {
        GET_ALL_USERS: "/users",
        GET_USER_BY_ID: (userId) => `/users/${userId}`,
        CREATE_USER: "/users",
        UPDATE_USER: (userId) => `/users/${userId}`,
        DELETE_USER: (userId) => `/users/${userId}`,
    },
    TASKS: {
        GET_DASHBOARD_DATA: "/tasks/dashboard-data",
        GET_ALL_TASKS: "/tasks",
        GET_TASK_BY_ID: (taskId) => `/tasks/${taskId}`,
        CREATE_TASK: "/tasks",
        UPDATE_TASK: (taskId) => `/tasks/${taskId}`,
        DELETE_TASK: (taskId) => `/tasks/${taskId}`,
    },
    REPORTS: {
        EXPORT_ALL_TASKS: "/exports/todos",         // Admin only
        EXPORT_ALL_USERS: "/exports/users",         // Admin only
        EXPORT_MY_TASKS: "/exports/my-tasks",       // For logged-in user
    },
    IMPORTS: {
        UPLOAD_TASKS_ADMIN: "/upload/tasks",        // Admin only
        UPLOAD_MY_TASKS: "/upload/my-tasks",        // For logged-in user
    }
};
