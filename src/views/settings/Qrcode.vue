<template>
    <div class="card-container">
        <div class="card">
            <h2 class="card-title">QR Code Settings</h2>

            <div v-if="qrCodeUrl" class="qr-code-box">
                <img :src="qrCodeUrl" alt="QR Code" class="qr-code-img" />
            </div>
            <div v-else class="qr-code-box loading-box">
                <p>กำลังโหลด QR Code...</p>
            </div>

            <label for="file-upload" class="file-upload-label">
                เลือกไฟล์ภาพ QR Code
            </label>
            <input id="file-upload" type="file" accept="image/png, image/jpeg" @change="onFileChange"
                class="file-upload-input" />

            <button class="primary-btn" @click="upload" :disabled="!selectedFile">
                Upload
            </button>

            <p v-if="statusMessage" :class="isSuccess ? 'success-message' : 'error-message'">
                {{ statusMessage }}
            </p>
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
    }
}

async function upload() {
    if (!selectedFile.value) return

    const formData = new FormData()
    formData.append('qrcode', selectedFile.value)

    try {
        await axios.post('/settings/qrcode', formData)
        statusMessage.value = 'อัปโหลดสำเร็จ!'
        isSuccess.value = true
        await fetchQrCode()
    } catch (error) {
        console.error('อัปโหลดล้มเหลว:', error)
        statusMessage.value = 'อัปโหลดล้มเหลว'
        isSuccess.value = false
    }
}
</script>

<style scoped>
.card-container {
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

.card {
    background-color: var(--card-bg);
    padding: 30px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    max-width: 450px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.card-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color-primary);
}

.qr-code-box {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
    background-color: var(--white-color);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 250px;
}

.loading-box {
    color: var(--text-color-secondary);
    font-style: italic;
}

.qr-code-img {
    width: 256px;
    height: 256px;
    border: 1px solid #eee;
    border-radius: 4px;
}

.file-upload-label {
    display: block;
    cursor: pointer;
    background-color: var(--primary-color);
    color: var(--white-color);
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.3s ease;
}

.file-upload-label:hover {
    background-color: #43a047;
}

.file-upload-input {
    display: none;
}

.primary-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.primary-btn:hover:enabled {
    background-color: #43a047;
}

.primary-btn:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
}

.success-message {
    color: var(--success-color);
}

.error-message {
    color: var(--danger-color);
}
</style>