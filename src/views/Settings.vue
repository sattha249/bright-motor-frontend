<template>
    <div class="page-container settings-page">
        <!-- Page Header -->
        <div class="page-header-card">
            <div class="header-content-wrap">
                <div class="header-left-group">
                    <div class="page-icon-badge">
                        <i class="fas fa-sliders-h"></i>
                    </div>
                    <div>
                        <h1 class="page-title">ตั้งค่าระบบ</h1>
                        <p class="page-subtitle">จัดการการตั้งค่าทั่วไป การชำระเงิน และแอปพลิเคชันพนักงาน</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Cards Grid -->
        <div class="settings-grid">
            <div class="card setting-card">
                <div class="setting-card-top">
                    <div class="setting-icon-box qr-theme">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <div class="setting-info">
                        <h3 class="setting-title">การตั้งค่า QR ชำระเงิน</h3>
                        <p class="setting-desc">เปลี่ยนแปลงและอัปโหลดรูปภาพ QR Code พร้อมเพย์สำหรับรับชำระเงิน</p>
                    </div>
                </div>
                <div class="setting-card-bottom">
                    <router-link to="/qrcode">
                        <button class="btn btn-primary">
                            <i class="fas fa-pen"></i>
                            <span>จัดการ QR Code</span>
                        </button>
                    </router-link>
                </div>
            </div>

            <div class="card setting-card">
                <div class="setting-card-top">
                    <div class="setting-icon-box android-theme">
                        <i class="fab fa-android"></i>
                    </div>
                    <div class="setting-info">
                        <h3 class="setting-title">แอปสำหรับพนักงานประจำรถ</h3>
                        <p class="setting-desc">ดาวน์โหลดไฟล์ติดตั้งแอปพลิเคชัน (Android APK) สำหรับพนักงานขับรถขนส่ง</p>
                    </div>
                </div>
                <div class="setting-card-bottom">
                    <button class="btn btn-secondary" @click="downloadApp">
                        <i class="fas fa-download"></i>
                        <span>ดาวน์โหลด APK</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
function downloadApp() {
    window.location.href = '/api/settings/download-app'
}
</script>

<style scoped>
.settings-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
}

.page-header-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.header-content-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.page-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.15));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.page-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.page-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.2rem 0 0 0;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.setting-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.5rem;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.setting-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.setting-card-top {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
}

.setting-icon-box {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
}

.setting-icon-box.qr-theme {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.18));
    color: var(--primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.setting-icon-box.android-theme {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.18));
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.setting-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.35rem 0;
}

.setting-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
}

.setting-card-bottom {
    display: flex;
    justify-content: flex-end;
}
</style>