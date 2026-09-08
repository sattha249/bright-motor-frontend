<template>
    <div class="login-page">
        <div class="login-ambient-glow"></div>
        <div class="login-card">
            <div class="brand-header">
                <div class="brand-badge">
                    <i class="fas fa-cubes"></i>
                </div>
                <h1 class="brand-title">BRIGHT MOTOR</h1>
                <p class="brand-subtitle">ระบบบริหารจัดการคลังสินค้าและสต็อก</p>
            </div>

            <form @submit.prevent="login" class="login-form">
                <div class="input-group">
                    <label for="username">
                        <i class="fas fa-user"></i>
                        <span>ชื่อผู้ใช้งาน</span>
                    </label>
                    <div class="input-wrapper">
                        <i class="fas fa-user-circle input-icon"></i>
                        <input
                            type="text"
                            id="username"
                            v-model="username"
                            placeholder="กรอกชื่อผู้ใช้ของคุณ"
                            required
                            autocomplete="username"
                        />
                    </div>
                </div>

                <div class="input-group">
                    <label for="password">
                        <i class="fas fa-key"></i>
                        <span>รหัสผ่าน</span>
                    </label>
                    <div class="input-wrapper">
                        <i class="fas fa-lock input-icon"></i>
                        <input
                            type="password"
                            id="password"
                            v-model="password"
                            placeholder="กรอกรหัสผ่าน"
                            required
                            autocomplete="current-password"
                        />
                    </div>
                </div>

                <button type="submit" class="login-submit-btn">
                    <span>เข้าสู่ระบบ</span>
                    <i class="fas fa-arrow-right-to-bracket"></i>
                </button>
            </form>

            <div class="login-footer">
                <i class="fas fa-shield-halved"></i>
                <span>Secure Warehouse Management System</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser } from '@/services/auth';
import axios from '../lib/axios';

const username = ref('');
const password = ref('');
const router = useRouter();
const userRole = ref('');

const login = async () => {
    try {
        const success = await loginUser(username.value, password.value);
        if (success) {
            await getProfile();
            if (userRole.value === 'admin') {
                router.push('/');
            } else {
                router.push('/customer');
            }
        }
    } catch (error) {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
};

const getProfile = async () => {
    try {
        const response = await axios.get('/profile');
        userRole.value = response.data.role;
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
    }
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 15% 20%, #1e293b 0%, #0b132b 50%, #060b18 100%);
    position: relative;
    padding: 24px;
    overflow: hidden;
}

.login-ambient-glow {
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: blur(40px);
    pointer-events: none;
}

.login-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 440px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    padding: 44px 36px 36px 36px;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
    animation: cardAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardAppear {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.brand-header {
    text-align: center;
    margin-bottom: 32px;
}

.brand-badge {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px auto;
    background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    color: #ffffff;
    box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.45);
}

.brand-title {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #0f172a;
    margin: 0 0 6px 0;
}

.brand-subtitle {
    font-size: 0.88rem;
    color: #64748b;
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
}

.input-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 6px;
}

.input-group label i {
    color: #2563eb;
    font-size: 0.85rem;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    font-size: 1rem;
    pointer-events: none;
    transition: color 0.2s;
}

.input-wrapper input {
    width: 100%;
    padding: 12px 14px 12px 42px;
    font-size: 0.95rem;
    font-family: inherit;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    color: #0f172a;
    transition: all 0.2s ease;
}

.input-wrapper input:focus {
    outline: none;
    border-color: #2563eb;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.input-wrapper input:focus + .input-icon,
.input-wrapper input:focus ~ .input-icon {
    color: #2563eb;
}

.login-submit-btn {
    margin-top: 8px;
    width: 100%;
    padding: 13px 20px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    transition: all 0.2s ease;
}

.login-submit-btn:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    transform: translateY(-1px);
}

.login-submit-btn:active {
    transform: translateY(0);
}

.login-footer {
    margin-top: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 500;
}

@media (max-width: 480px) {
    .login-card {
        padding: 32px 24px 28px 24px;
    }
}
</style>