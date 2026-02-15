<template>
    <aside class="sidebar">
        <div class="logo">
            <h2>ระบบจัดการสต็อก</h2>
        </div>
        <nav class="sidebar-nav">
            <ul>
                <li>
                    <router-link to="/" active-class="active">
                        <i class="fas fa-home"></i> หน้าหลัก
                    </router-link>
                </li>
                <li v-if="userRole === 'admin'">
                    <router-link to="/manage-users">
                        <i class="fas fa-user-plus"></i> เพิ่มผู้ใช้งาน
                    </router-link>
                </li>
                <li>
                    <router-link to="/customer" active-class="active">
                        <i class="fas fa-users"></i> จัดการลูกค้า
                    </router-link>
                </li>
                <li>
                    <router-link to="/sale" active-class="active">
                        <i class="fas fa-money-bill-transfer"></i> ขายหน้าโกดัง
                    </router-link>
                </li>
                <li>
                    <router-link to="/claim" active-class="active">
                        <i class="fas fa-undo-alt"></i> รับคืนสินค้า
                    </router-link>
                </li>
                <li>
                    <router-link to="/credit/report">
                        <i class="fas fa-chart-pie"></i> รายงานเครดิต
                    </router-link>
                </li>
                <li>
                    <router-link to="/products" active-class="active">
                        <i class="fas fa-box-open"></i> สินค้าในระบบ
                    </router-link>
                </li>
                <li>
                    <router-link to="/purchase-orders" active-class="active">
                        <i class="fa-solid fa-cubes-stacked"></i>ใบสั่งซื้อ
                    </router-link>
                </li>
                <li>
                    <router-link to="/warehouse" active-class="active">
                        <i class="fas fa-warehouse"></i> สินค้าในโกดัง
                    </router-link>
                </li>
                <li>
                    <router-link to="/add-to-truck" active-class="active">
                        <i class="fas fa-truck-fast"></i> เพิ่มสินค้าเข้ารถ
                    </router-link>
                </li>
                <li>
                    <router-link to="/pre-orders" active-class="active">
                        <i class="fa-solid fa-truck-arrow-right"></i>พรีออเดอร์
                    </router-link>
                </li>
                <li>
                    <router-link to="/report" active-class="active">
                        <i class="fa-solid fa-file-invoice-dollar"></i> รายงานการขาย
                    </router-link>
                </li>
                <li>
                    <router-link to="/settings" active-class="active">
                        <i class="fa-solid fa-cog"></i> ตั้งค่า
                    </router-link>
                </li>
            </ul>
        </nav>
    </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/lib/axios';

const userRole = ref('');

const fetchUserRole = async () => {
    try {
        const response = await axios.get('/profile');
        userRole.value = response.data.role;
        console.log('User role:', userRole.value);
    } catch (error) {
        console.error('Failed to fetch user role:', error);
    }
};

onMounted(() => {
    fetchUserRole();
});
</script>

<style scoped>
.sidebar {
    width: 250px;
    height: 100vh;
    /* สูงเต็มจอ */
    background-color: #2c3e50;
    color: var(--white-color);
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    /* เอา fixed หรือ sticky ออกเพื่อให้มันอยู่ใน flow ปกติของ layout (หรือจะใส่ fixed ก็ได้ถ้า layout เดิมคุณเป็นแบบนั้น) */
    flex-shrink: 0;
    /* สำคัญ: ป้องกัน sidebar หดตัวเมื่อหน้าจอเล็ก */
    overflow-y: auto;
    /* ให้ scroll ได้ถ้าเมนูยาวเกินความสูงจอ */
}

.logo {
    text-align: center;
    margin-bottom: 30px;
}

.logo h2 {
    font-size: 24px;
    font-weight: 600;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
}

.sidebar-nav li a {
    display: block;
    padding: 15px 20px;
    margin-bottom: 10px;
    color: #ecf0f1;
    text-decoration: none;
    border-radius: 8px;
    transition: background-color 0.3s;
    font-size: 16px;
}

.sidebar-nav li a:hover,
.sidebar-nav li a.active {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--white-color);
}

.sidebar-nav li a i {
    margin-right: 15px;
    width: 20px;
    text-align: center;
}

.sidebar-nav li a.disabled {
    pointer-events: none;
    cursor: default;
    opacity: 0.5;
    background-color: transparent;
}

.sidebar-nav li a.disabled:hover {
    background-color: transparent;
}

/* เพิ่มส่วนนี้เพื่อให้บนจอมือถือ Sidebar ไม่กินพื้นที่เต็มจนเกินไป (Optional: ปรับลดขนาดลงเล็กน้อย) */
@media (max-width: 768px) {
    .sidebar {
        width: 200px;
        /* ลดความกว้างลงหน่อยบนมือถือ */
        padding: 10px;
    }

    .logo h2 {
        font-size: 20px;
    }

    .sidebar-nav li a {
        padding: 12px 15px;
        font-size: 14px;
    }
}
</style>