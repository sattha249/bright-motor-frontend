<template>
    <div class="form-container">
        <h2>ตั้งค่าระบบ</h2>
        <div class="settings-grid">
            <!-- <div class="setting-card">
                <h3>ข้อมูลส่วนตัว</h3>
                <p>จัดการโปรไฟล์และรหัสผ่านของคุณ</p>
                <router-link to="/qrcode" active-class="active">
                <button class="settings-btn">แก้ไข</button>
                </router-link>
            </div> -->
            <div class="setting-card">
                <h3>การตั้งค่า QR ชำระเงิน</h3>
                <p>เปลี่ยนแปลง QR ชำระเงิน</p>
                <router-link to="/qrcode" active-class="active">
                    <button class="settings-btn">แก้ไข</button>
                </router-link>
            </div>
            <div class="setting-card">
                <h3>แอปพลิเคชันสำหรับพนักงานขับรถ</h3>
                <p>โหลดแอพพลิเคชั่น (Android)</p>
                <a :href="androidAppUrl" target="_blank">
                    <button class="settings-btn">ดาวน์โหลด</button>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
const androidAppUrl = import.meta.env.VITE_ANDROID_APP_URL || '#';
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