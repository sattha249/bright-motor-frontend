// src/stores/user.js

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('userToken'));
    const userData = ref(null);

    function setToken(newToken) {
        token.value = newToken;
        if (newToken) {
            localStorage.setItem('userToken', newToken);
        } else {
            localStorage.removeItem('userToken');
        }
    }

    function setUserData(data) {
        userData.value = data;
    }

    return { token, userData, setToken, setUserData };
});