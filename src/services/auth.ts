import axios from '../lib/axios';


export const loginUser = async (username, password) => {
    try {
        const response = await axios.post(`/login`, {
            username,
            password,
        });

        if (response.data.token) {
            localStorage.setItem('userToken', response.data.token);
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