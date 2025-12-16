import axiosInstance from './config/axios';

export class AuthAPI {
    /**
     * Calls the backend API to perform a spin operation.
     * @param type - The type of spin ('n' for new, 'r' for refill, 'f' for free).
     * @returns {Promise<{reels: number[][]}>} A promise that resolves with the reels data.
     */
    static async tryRefreshToken() {
        try {
            const refreshResponse = await axiosInstance.post(`/auth/refresh`, {}, { withCredentials: true });
            return refreshResponse.data;
        } catch (error: any) {
            throw new Error('Session expired. Please login again.');
        }
    }

    static async login(token: string | undefined | null) {
        if (!token) {
            return await this.tryRefreshToken();
        }

        try {
            const authResponse = await axiosInstance.post(`/auth/login`, { token }, { withCredentials: true });
            return authResponse.data;
        } catch (error: any) {
            alert(JSON.stringify(error));
            const message = error?.response?.data?.message || 'Login failed';
            throw new Error(message);
        }
    }
}
