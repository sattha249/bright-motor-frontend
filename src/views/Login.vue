<template>
    <div class="login-container">
        <div class="login-box">
            <h2>เข้าสู่ระบบ</h2>
            <form @submit.prevent="login">
                <div class="form-group">
                    <label for="username">ชื่อผู้ใช้</label>
                    <input type="text" id="username" v-model="username" required>
                </div>
                <div class="form-group">
                    <label for="password">รหัสผ่าน</label>
                    <input type="password" id="password" v-model="password" required>
                </div>
                <button type="submit" class="login-btn">เข้าสู่ระบบ</button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser } from '@/services/auth';

const username = ref('');
const password = ref('');
const router = useRouter();

const login = async () => {
    try {
        const success = await loginUser(username.value, password.value);
        if (success) {
            router.push('/');
        }
    } catch (error) {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: var(--secondary-color);
}

.login-box {
    background-color: var(--card-bg);
    padding: 40px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.login-box h2 {
    margin-bottom: 30px;
    color: var(--primary-color);
}

.form-group {
    text-align: left;
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.login-btn {
    width: 100%;
    padding: 12px;
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.login-btn:hover {
    background-color: #43a047;
}
</style>