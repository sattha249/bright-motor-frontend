import axios from 'axios';
import { useUserStore } from '@/stores/user'; // นำเข้า Pinia Store

const apiClient = axios.create({
    baseURL: `/api`,
    withCredentials: false,
});

// ใช้ Interceptor เพื่อเพิ่ม Token ในทุกคำขอ
apiClient.interceptors.request.use(
    (config) => {
        // เข้าถึง Pinia Store เพื่อดึง Token
        const userStore = useUserStore();
        const token = userStore.token;

        if (token) {
            // เพิ่ม Authorization Header ถ้ามี Token
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;