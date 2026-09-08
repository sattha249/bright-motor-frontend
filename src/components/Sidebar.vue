<template>
    <div>
        <!-- Mobile backdrop overlay -->
        <div v-if="isOpen" class="sidebar-backdrop" @click="$emit('close')"></div>

        <aside :class="['sidebar', { 'sidebar-open': isOpen }]">
            <div class="sidebar-brand">
                <div class="brand-logo-box">
                    <i class="fas fa-cubes"></i>
                </div>
                <div class="brand-info">
                    <h2>BRIGHT MOTOR</h2>
                    <span>ระบบจัดการสต็อก</span>
                </div>
                <button class="mobile-close-btn" @click="$emit('close')">&times;</button>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <span class="nav-section-title">งานขาย & ภาพรวม</span>
                    <ul>
                        <li>
                            <router-link to="/" active-class="active" :class="{ disabled: userRole !== 'admin' }">
                                <i class="fas fa-chart-pie"></i>
                                <span>หน้าหลัก</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/sale" active-class="active">
                                <i class="fas fa-cash-register"></i>
                                <span>ขายหน้าโกดัง</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/claim" active-class="active">
                                <i class="fas fa-undo-alt"></i>
                                <span>รับคืนสินค้า</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/credit/report" active-class="active">
                                <i class="fas fa-file-invoice-dollar"></i>
                                <span>รายงานเครดิต</span>
                            </router-link>
                        </li>
                    </ul>
                </div>

                <div class="nav-section">
                    <span class="nav-section-title">สต็อก & ขนส่ง</span>
                    <ul>
                        <li>
                            <router-link to="/products" active-class="active">
                                <i class="fas fa-box-open"></i>
                                <span>สินค้าในระบบ</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/warehouse" active-class="active">
                                <i class="fas fa-warehouse"></i>
                                <span>สินค้าในโกดัง</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/add-to-truck" active-class="active">
                                <i class="fas fa-truck-fast"></i>
                                <span>เพิ่มสินค้าเข้ารถ</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/pre-orders" active-class="active">
                                <i class="fas fa-truck-arrow-right"></i>
                                <span>พรีออเดอร์</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/purchase-orders" active-class="active">
                                <i class="fas fa-receipt"></i>
                                <span>ใบสั่งซื้อ</span>
                            </router-link>
                        </li>
                    </ul>
                </div>

                <div class="nav-section">
                    <span class="nav-section-title">การจัดการ & รายงาน</span>
                    <ul>
                        <li>
                            <router-link to="/customer" active-class="active">
                                <i class="fas fa-users"></i>
                                <span>จัดการลูกค้า</span>
                            </router-link>
                        </li>
                        <li v-if="userRole === 'admin'">
                            <router-link to="/manage-users" active-class="active">
                                <i class="fas fa-user-gear"></i>
                                <span>จัดการผู้ใช้งาน & รถ</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/report" active-class="active" :class="{ disabled: userRole !== 'admin' }">
                                <i class="fas fa-chart-line"></i>
                                <span>รายงานการขาย</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/settings" active-class="active">
                                <i class="fas fa-sliders"></i>
                                <span>ตั้งค่า</span>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="footer-badge">
                    <span class="pulse-dot"></span>
                    <span>System Online</span>
                </div>
            </div>
        </aside>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/lib/axios';

defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
});

defineEmits(['close']);

const userRole = ref('');

const fetchUserRole = async () => {
    try {
        const response = await axios.get('/profile');
        userRole.value = response.data.role;
    } catch (error) {
        console.error('Failed to fetch user role:', error);
    }
};

onMounted(() => {
    fetchUserRole();
});
</script>

<style scoped>
.sidebar-backdrop {
    display: none;
}

.sidebar {
    width: 260px;
    height: 100vh;
    background: linear-gradient(180deg, #0b132b 0%, #1c2541 100%);
    color: #ffffff;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow-y: auto;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 8px 24px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 16px;
}

.brand-logo-box {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    flex-shrink: 0;
}

.brand-info h2 {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #ffffff;
    margin: 0;
    line-height: 1.2;
}

.brand-info span {
    font-size: 0.75rem;
    color: #94a3b8;
    letter-spacing: 0.02em;
}

.mobile-close-btn {
    display: none;
}

.sidebar-nav {
    flex: 1;
}

.nav-section {
    margin-bottom: 20px;
}

.nav-section-title {
    display: block;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
    padding: 0 12px;
    margin-bottom: 8px;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar-nav li {
    margin-bottom: 4px;
}

.sidebar-nav li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    color: #cbd5e1;
    text-decoration: none;
    border-radius: 10px;
    font-size: 0.92rem;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
}

.sidebar-nav li a i {
    width: 20px;
    text-align: center;
    font-size: 1rem;
    color: #94a3b8;
    transition: color 0.2s ease;
}

.sidebar-nav li a:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
}

.sidebar-nav li a:hover i {
    color: #38bdf8;
}

.sidebar-nav li a.active {
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0.1) 100%);
    color: #ffffff;
    font-weight: 700;
    box-shadow: inset 3px 0 0 #38bdf8;
}

.sidebar-nav li a.active i {
    color: #38bdf8;
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.5));
}

.sidebar-nav li a.disabled {
    opacity: 0.35;
    pointer-events: none;
}

.sidebar-footer {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    font-size: 0.75rem;
    color: #94a3b8;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Mobile & Tablet Drawer */
@media (max-width: 1024px) {
    .sidebar-backdrop {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 999;
    }

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        transform: translateX(-100%);
        z-index: 1000;
        width: 270px;
    }

    .sidebar.sidebar-open {
        transform: translateX(0);
    }

    .mobile-close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 6px;
    }

    .mobile-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
}
</style>