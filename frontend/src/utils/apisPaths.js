export const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        GET_PROFILE: "/auth/profile",
        UPDATE_PROFILE: "/auth/profile",
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
        CREATE_TASK: "/tasks/create",
        UPDATE_TASK: (taskId) => `/tasks/${taskId}`,
        DELETE_TASK: (taskId) => `/tasks/${taskId}`,
    },
    REPORTS: {
        EXPORT_EMPTY_TEMPLATE: "/reports/exports/template",
        EXPORT_ALL_USERS: "/reports/exports/users",
        EXPORT_ALL_TASKS: "/reports/exports/tasks",
        EXPORT_USERS_AND_TASKS: "/reports/exports/users-tasks",
    },
    IMPORTS: {
        UPLOAD_USERS_TASKS: "/reports/upload/users-tasks",
    }
};
