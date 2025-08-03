<template>
    <header class="header">
        <div class="search-box">
            <input type="text" placeholder="ค้นหาสินค้า..." />
            <i class="fas fa-search"></i>
        </div>
        <div class="user-info">
            <span>สวัสดี, แอดมิน</span>
            <i class="fas fa-user-circle"></i>
        </div>
    </header>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
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
</style>