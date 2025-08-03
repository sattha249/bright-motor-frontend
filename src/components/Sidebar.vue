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
                <li>
                    <router-link to="/products" active-class="active">
                        <i class="fas fa-box-open"></i> สินค้า
                    </router-link>
                </li>
                <li>
                    <router-link to="/movements" active-class="active">
                        <i class="fas fa-exchange-alt"></i> การเคลื่อนไหว
                    </router-link>
                </li>
                <li>
                    <a href="#" class="disabled">
                        <i class="fas fa-chart-bar"></i> รายงาน
                    </a>
                </li>
                <li>
                    <router-link to="/settings" active-class="active">
                        <i class="fas fa-cog"></i> ตั้งค่า
                    </router-link>
                </li>
            </ul>
        </nav>
    </aside>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
</script>

<style scoped>
.sidebar {
    width: 250px;
    height: 100vh;
    background-color: #2c3e50;
    color: var(--white-color);
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
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
</style>