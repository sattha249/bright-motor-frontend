<template>
    <div class="add-truck-tab">
        <form @submit.prevent="openConfirmModal">
            <div class="form-group">
                <label for="plateNumber">ทะเบียนรถ *</label>
                <input type="text" id="plateNumber" v-model="formData.plateNumber" required
                    placeholder="เช่น 1กข 1234" />
            </div>
            <div class="form-group">
                <label for="plateProvince">จังหวัดป้ายทะเบียน *</label>
                <input type="text" id="plateProvince" v-model="formData.plateProvince" required
                    placeholder="เช่น กรุงเทพมหานคร" />
            </div>
            <div class="form-group">
                <label for="model">รุ่นรถ *</label>
                <input type="text" id="model" v-model="formData.model" required placeholder="เช่น Isuzu D-Max" />
            </div>
            <div class="form-group">
                <label for="loadCapacity">ความจุ (กก.) *</label>
                <input type="number" id="loadCapacity" v-model.number="formData.loadCapacity" required
                    placeholder="เช่น 2000" />
            </div>
            <div class="button-group">
                <button type="submit" class="save-btn" :disabled="loading">
                    <span v-if="loading">กำลังเพิ่ม...</span>
                    <span v-else>เพิ่มรถใหม่</span>
                </button>
            </div>
        </form>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
            <h3>ยืนยันการเพิ่มรถ</h3>
            <p>คุณต้องการเพิ่มรถทะเบียน **{{ formData.plateNumber }}** ใช่หรือไม่?</p>
            <div class="modal-buttons">
                <button class="modal-cancel-btn" @click="closeModal">ยกเลิก</button>
                <button class="modal-confirm-btn" @click="addTruck">ยืนยัน</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const formData = ref({
    plateNumber: '',
    plateProvince: '',
    model: '',
    loadCapacity: null,
    userId: null,
});

const loading = ref(false);
const showModal = ref(false);

const openConfirmModal = () => {
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const addTruck = async () => {
    closeModal();
    loading.value = true;
    try {
        await axios.post('/trucks', formData.value);
        Swal.fire('สำเร็จ!', 'เพิ่มรถใหม่เรียบร้อยแล้ว', 'success');
        formData.value = {
            plateNumber: '',
            plateProvince: '',
            model: '',
            loadCapacity: null,
            userId: null,
        };
    } catch (err) {
        let errorMessage = 'เกิดข้อผิดพลาดในการเพิ่มรถ';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
        Swal.fire('ผิดพลาด!', errorMessage, 'error');
        console.error('Add truck error:', err);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Form styles similar to other components */
.add-truck-tab {
    padding: 1rem;
}

.form-group {
    margin-bottom: 1.2rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color-secondary);
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    background-color: var(--bg-color);
    color: var(--text-color-primary);
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.button-group {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.modal {
    max-width: 400px;
    text-align: center;
}

.modal p {
    margin-bottom: 1.5rem;
    color: #555;
}
</style>