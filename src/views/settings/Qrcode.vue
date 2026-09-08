<template>
    <div class="page-container qrcode-page">
        <!-- Page Header -->
        <div class="page-header-card">
            <div class="header-content-wrap">
                <div class="header-left-group">
                    <router-link to="/settings" class="btn btn-secondary btn-icon-only" title="กลับไปหน้าตั้งค่า">
                        <i class="fas fa-arrow-left"></i>
                    </router-link>
                    <div class="page-icon-badge">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <div>
                        <h1 class="page-title">การตั้งค่า QR Code ชำระเงิน</h1>
                        <p class="page-subtitle">อัปโหลดและอัปเดตภาพ QR Code สำหรับการสแกนจ่ายเงินของลูกค้า</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main QR Card -->
        <div class="card qrcode-main-card">
            <div class="qr-preview-section">
                <div v-if="qrCodeUrl" class="qr-frame-box">
                    <img :src="qrCodeUrl" alt="QR Code พร้อมเพย์" class="qr-code-img" />
                    <span class="qr-status-pill">
                        <i class="fas fa-check-circle"></i> ภาพปัจจุบันในระบบ
                    </span>
                </div>
                <div v-else class="qr-frame-box loading-box">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                    <p>กำลังโหลด QR Code ล่าสุด...</p>
                </div>
            </div>

            <div class="qr-upload-section">
                <div class="upload-dropzone" :class="{ 'has-file': selectedFile }">
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        @change="onFileChange"
                        class="file-upload-input"
                    />
                    <label for="file-upload" class="upload-label">
                        <i class="fas" :class="selectedFile ? 'fa-file-image' : 'fa-cloud-upload-alt'"></i>
                        <span class="upload-text font-bold">
                            {{ selectedFile ? selectedFile.name : 'เลือกไฟล์ภาพ QR Code ใหม่' }}
                        </span>
                        <span class="upload-subtext">รองรับรูปแบบไฟล์ JPG หรือ PNG</span>
                    </label>
                </div>

                <div class="upload-actions">
                    <button class="btn btn-primary" @click="upload" :disabled="!selectedFile">
                        <i class="fas fa-upload"></i>
                        <span>อัปโหลด QR Code</span>
                    </button>
                </div>

                <div v-if="statusMessage" class="status-alert-box" :class="isSuccess ? 'success' : 'error'">
                    <i class="fas" :class="isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'"></i>
                    <span>{{ statusMessage }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/lib/axios'

const qrCodeUrl = ref('')
const selectedFile = ref(null)
const statusMessage = ref('')
const isSuccess = ref(true)

async function fetchQrCode() {
    try {
        const response = await axios.get('/settings/qrcode', {
            responseType: 'blob',
        })

        const blob = response.data
        // แปลง blob → base64 เพื่อเก็บ localStorage
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
            const base64data = reader.result // string base64
            localStorage.setItem('qrCodeImage', base64data)
            qrCodeUrl.value = base64data
        }
    } catch (err) {
        console.error('Failed to fetch QR Code:', err)

        // โหลดรูปจาก localStorage แทนถ้ามี
        const savedImage = localStorage.getItem('qrCodeImage')
        if (savedImage) {
            qrCodeUrl.value = savedImage
        } else {
            qrCodeUrl.value = ''
        }
    }
}

onMounted(() => {
    fetchQrCode()
})

function onFileChange(event) {
    const file = event.target.files[0]
    if (file) {
        selectedFile.value = file
        statusMessage.value = ''
    }
}

async function upload() {
    if (!selectedFile.value) return

    const formData = new FormData()
    formData.append('qrcode', selectedFile.value)

    try {
        await axios.post('/settings/qrcode', formData)
        statusMessage.value = 'อัปโหลดภาพ QR Code สำเร็จแล้ว!'
        isSuccess.value = true
        selectedFile.value = null
        await fetchQrCode()
    } catch (error) {
        console.error('อัปโหลดล้มเหลว:', error)
        statusMessage.value = 'อัปโหลดล้มเหลว โปรดลองอีกครั้ง'
        isSuccess.value = false
    }
}
</script>

<style scoped>
.qrcode-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 650px;
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

.btn-icon-only {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: var(--radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

.qrcode-main-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
}

.qr-preview-section {
    width: 100%;
    display: flex;
    justify-content: center;
}

.qr-frame-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--bg-main);
    border: 2px dashed var(--border);
    border-radius: var(--radius-xl);
}

.qr-code-img {
    width: 240px;
    height: 240px;
    object-fit: contain;
    background: white;
    padding: 8px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.qr-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: 600;
}

.loading-box {
    width: 260px;
    height: 260px;
    justify-content: center;
    color: var(--text-muted);
}

.qr-upload-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.upload-dropzone {
    border: 2px dashed var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    text-align: center;
    background: var(--bg-main);
    transition: all var(--transition-fast);
    cursor: pointer;
}

.upload-dropzone:hover {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.03);
}

.upload-dropzone.has-file {
    border-color: var(--success);
    background: rgba(16, 185, 129, 0.04);
}

.upload-dropzone.has-file i {
    color: var(--success);
}

.file-upload-input {
    display: none;
}

.upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.upload-label i {
    font-size: 2rem;
    color: var(--primary);
}

.upload-text {
    font-size: 0.95rem;
    color: var(--text-primary);
}

.upload-subtext {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.upload-actions {
    display: flex;
    justify-content: center;
}

.upload-actions .btn {
    width: 100%;
    max-width: 280px;
    justify-content: center;
    padding: 0.75rem 1.5rem;
}

.status-alert-box {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-lg);
    font-size: 0.9rem;
    font-weight: 500;
}

.status-alert-box.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
}

.status-alert-box.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.25);
}
</style>