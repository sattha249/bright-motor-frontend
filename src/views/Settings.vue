<template>
    <div class="form-container">
        <h2>ตั้งค่าระบบ</h2>
        <div class="settings-grid">
            <div class="setting-card">
                <h3>ข้อมูลส่วนตัว</h3>
                <p>จัดการโปรไฟล์และรหัสผ่านของคุณ</p>
                <button class="settings-btn">แก้ไข</button>
            </div>
            <div class="setting-card">
                <h3>การตั้งค่าบริษัท</h3>
                <p>ข้อมูลชื่อบริษัท, ที่อยู่, และโลโก้</p>
                <button class="settings-btn">แก้ไข</button>
            </div>
            <div class="setting-card">
                <h3>การแจ้งเตือน</h3>
                <p>ตั้งค่าการแจ้งเตือนสินค้าใกล้หมด</p>
                <button class="settings-btn">ตั้งค่า</button>
            </div>
        </div>
    </div>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
</script>

<style scoped>
.form-container {
    background-color: var(--card-bg);
    padding: 30px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    max-width: 800px;
    margin: 0 auto;
}

.form-container h2 {
    text-align: center;
    margin-bottom: 25px;
    font-size: 24px;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.setting-card {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.setting-card h3 {
    font-size: 20px;
    margin-bottom: 10px;
    color: #444;
}

.setting-card p {
    color: #777;
    flex-grow: 1;
    margin-bottom: 20px;
}

.settings-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 12px 25px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
    width: fit-content;
}

.settings-btn:hover {
    background-color: #43a047;
}
</style>