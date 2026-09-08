<template>
    <header class="header">
        <div class="header-left">
            <button class="mobile-toggle-btn" @click="$emit('toggleSidebar')" aria-label="เปิดเมนู">
                <i class="fas fa-bars"></i>
            </button>
            <div class="breadcrumb-area">
                <span class="system-badge">BRIGHT MOTOR</span>
                <span class="page-title">{{ currentRouteTitle }}</span>
            </div>
        </div>

        <div class="user-info-area">
            <div class="user-profile-chip">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-text">
                    <span class="user-name">{{ userData?.fullname || 'ผู้ใช้งาน' }}</span>
                    <span class="role-tag" :class="userData?.role?.toLowerCase()">{{ userData?.role || 'User' }}</span>
                </div>
            </div>

            <button @click="handleLogout" class="logout-btn" title="ออกจากระบบ">
                <i class="fas fa-arrow-right-from-bracket"></i>
                <span class="logout-label">ออกจากระบบ</span>
            </button>
        </div>
    </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { logoutUser } from '@/services/auth';
import { useUserStore } from '@/stores/user';
import { onMounted, computed } from 'vue';
import axios from '@/lib/axios';

defineEmits(['toggleSidebar']);

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const userData = computed(() => userStore.userData || {});

// Map route path to clean Thai title
const currentRouteTitle = computed(() => {
    const titles = {
        '/': 'หน้าหลัก (ภาพรวม)',
        '/manage-users': 'จัดการผู้ใช้งาน & รถ',
        '/customer': 'จัดการลูกค้า',
        '/sale': 'บันทึกการขาย (หน้าโกดัง)',
        '/claim': 'รับคืนสินค้า / ใบคืน',
        '/credit/report': 'รายงานเครดิต',
        '/products': 'สินค้าในระบบ',
        '/purchase-orders': 'ใบสั่งซื้อสินค้า',
        '/warehouse': 'สินค้าในโกดังหลัก',
        '/add-to-truck': 'เบิกสินค้าเข้ารถขนส่ง',
        '/pre-orders': 'จัดการพรีออเดอร์',
        '/report': 'รายงานการขาย',
        '/settings': 'ตั้งค่าระบบ',
    };
    return titles[route.path] || 'ระบบจัดการสต็อก';
});

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
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 14px 24px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    position: sticky;
    top: 16px;
    z-index: 100;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 14px;
}

.mobile-toggle-btn {
    display: none;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #334155;
    font-size: 1.15rem;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.mobile-toggle-btn:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.breadcrumb-area {
    display: flex;
    align-items: center;
    gap: 10px;
}

.system-badge {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    background: var(--primary-light);
    color: var(--primary-color);
    border-radius: 6px;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
}

.user-info-area {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-profile-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 6px 14px 6px 8px;
    border-radius: var(--radius-full);
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
}

.user-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}

.user-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
}

.role-tag {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #2563eb;
}

.role-tag.admin {
    color: #7c3aed;
}

.logout-btn {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.logout-btn:hover {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

@media (max-width: 1024px) {
    .mobile-toggle-btn {
        display: flex;
    }

    .header {
        top: 0;
        margin-bottom: 16px;
        padding: 12px 16px;
    }

    .page-title {
        font-size: 0.98rem;
    }

    .system-badge {
        display: none;
    }

    .logout-label {
        display: none;
    }

    .logout-btn {
        padding: 8px 10px;
    }
}
</style>