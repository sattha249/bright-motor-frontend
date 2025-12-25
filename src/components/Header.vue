<template>
    <header class="header">
        <div class="search-box">
        </div>
        <div class="user-info">
            <span>สวัสดี, {{ userData?.fullname || 'ผู้ใช้งาน' }}</span>
            <i class="fas fa-user-circle"></i>
            <button @click="handleLogout" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i> ออกจากระบบ
            </button>
        </div>
    </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { logoutUser } from '@/services/auth';
import { useUserStore } from '@/stores/user';
import { onMounted, computed } from 'vue'; // [แก้ไข] import computed
import axios from '@/lib/axios'; // [แก้ไข] import axios สำหรับดึงข้อมูลใหม่
const router = useRouter();
const userStore = useUserStore();
const userData = computed(() => userStore.userData || {});
const handleLogout = () => {
    logoutUser();
    router.push('/login');
};
onMounted(async () => {
    if (!userStore.userData || !userStore.userData.id) {
        try {
            const token = localStorage.getItem('userToken');
            if (token) {
                const res = await axios.get('/profile');
                userStore.setUserData(res.data);
            }
        } catch (error) {
            console.error("Failed to restore session in Header:", error);
            handleLogout();
        }
    }
});
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    background-color: var(--card-bg);
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.search-box {
    position: relative;
}

.search-box input {
    width: 300px;
    padding: 10px 15px;
    padding-left: 40px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 14px;
}

.search-box i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.user-info {
    display: flex;
    align-items: center;
}

.user-info span {
    margin-right: 15px;
    font-size: 16px;
    font-weight: 500;
}

.user-info i {
    font-size: 24px;
    color: var(--primary-color);
}

.logout-btn {
    background: none;
    border: none;
    color: #f44336;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 20px;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background-color 0.2s, color 0.2s;
}

.logout-btn:hover {
    background-color: #f44336;
    color: var(--white-color);
}

.logout-btn i {
    margin-right: 8px;
    font-size: 14px;
    color: inherit;
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        padding: 15px;
    }

    .search-box,
    .search-box input {
        width: 100%;
    }

    .user-info {
        width: 100%;
        justify-content: space-between;
    }

    .user-info span {
        font-size: 14px;
        margin-right: 10px;
    }

    .logout-btn {
        margin-left: auto;
        padding: 6px 10px;
    }
}

.header {
    position: relative;
    top: 0;
    z-index: 100;
}
</style>