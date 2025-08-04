import axios from '../lib/axios';
import { useUserStore } from '@/stores/user';


export const loginUser = async (username, password) => {
    try {
        const userStore = useUserStore();
        const response = await axios.post(`/login`, {
            username,
            password,
        });

        if (response.data.token) {
            userStore.setToken(response.data.token);
            let userData = await axios.get(`/profile`);
            userStore.setUserData(userData.data);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

export const logoutUser = () => {
    localStorage.removeItem('userToken');
};

export const getToken = () => {
    return localStorage.getItem('userToken');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('userToken');
};