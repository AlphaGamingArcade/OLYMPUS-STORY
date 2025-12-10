import axios, { AxiosInstance } from 'axios';
import { userAuth } from '../../utils/userAuth';

// Axios instance with base URL and default headers
const axiosInstance: AxiosInstance = axios.create({
    baseURL:
        /** @ts-expect-error Axios type mismatch due to custom config*/
        import.meta.env.MODE === 'development'
            ? /** @ts-expect-error Axios type mismatch due to custom config*/
              `${import.meta.env.VITE_DEV_API_URL}/api`
            : /** @ts-expect-error Axios type mismatch due to custom config*/
              `${import.meta.env.VITE_PROD_API_URL}/api`,
    timeout: 30000, // 30 seconds
    withCredentials: true,
});

// Axios interceptor to attach token to outgoing requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = userAuth.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

/**
 * 
 * If I get this response it means I need to refresh my token by calling this /api/auth/refresh-token {
    "Code": 401,
    "Message": "Invalid or expired access token.",
    "Error": null
  }

  and if success then I can use the previous  Invalid or expired access token
 * 
 */

let isRefreshing = false;

// Strongly-typed queue
type FailedQueueItem = {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
};

let failedQueue: FailedQueueItem[] = [];

// Process queue
const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Axios interceptor
axiosInstance.interceptors.response.use(
    (response) => response,

    async (error: unknown) => {
        // Type guard to ensure it’s an Axios error
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const originalRequest: any = error.config;

        const status = error.response?.status;
        const message = error.response?.data?.Message;

        const isAuthError = status === 401 && message === 'Invalid or expired access token.' && !originalRequest._retry;

        if (!isAuthError) {
            return Promise.reject(error);
        }

        // mark retry
        originalRequest._retry = true;

        // If a refresh request is already in progress
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(axiosInstance(originalRequest));
                    },
                    reject,
                });
            });
        }

        // Start token refresh
        isRefreshing = true;

        try {
            const res = await axios.post('/auth/refresh', null, {
                baseURL: axiosInstance.defaults.baseURL,
                withCredentials: true,
            });

            const newAccessToken: string | null = res.data?.data?.accessToken ?? null;

            if (!newAccessToken) {
                throw new Error('No new access token returned');
            }

            // Save & resume queued requests
            userAuth.set(newAccessToken);
            processQueue(null, newAccessToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default axiosInstance;
