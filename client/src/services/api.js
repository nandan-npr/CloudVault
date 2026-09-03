import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api"),
  withCredentials: true,
});

let accessToken = null;
let refreshRequest = null;

export const setAuthToken = (token) => {
  accessToken = token || null;
};

export const clearAuthToken = () => {
  accessToken = null;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = api
      .post("/auth/refresh", undefined, { skipAuthRefresh: true })
      .then((response) => {
        setAuthToken(response.data.accessToken);
        return response.data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (
      isUnauthorized &&
      !originalRequest?._retry &&
      !originalRequest?.skipAuthRefresh &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return api(originalRequest);
      } catch {
        clearAuthToken();
        window.dispatchEvent(new Event("cloudvault:session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export const loginUser = (data) => api.post("/auth/login", data, { skipAuthRefresh: true });
export const registerUser = (data) => api.post("/auth/register", data, { skipAuthRefresh: true });
export const logoutUser = () => api.post("/auth/logout", undefined, { skipAuthRefresh: true });
export const getCurrentUser = () => api.get("/auth/me");
export const requestPasswordReset = (data) =>
  api.post("/auth/forgot-password", data, { skipAuthRefresh: true });
export const resetPassword = (data) =>
  api.post("/auth/reset-password", data, { skipAuthRefresh: true });

export const uploadFile = (formData, onUploadProgress) =>
  api.post("/files", formData, { onUploadProgress });
export const listFiles = (params) => api.get("/files", { params });
export const getFileMetadata = (id) => api.get(`/files/${id}`);
export const deleteFile = (id) => api.delete(`/files/${id}`);
export const downloadFile = (id) => api.get(`/files/${id}/download`, { responseType: "blob" });

export default api;
