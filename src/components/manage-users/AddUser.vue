<template>
    <div class="manage-user-tab">
        <h2><i class="fas fa-user-plus"></i> เพิ่มผู้ใช้งานใหม่</h2>
        <br></br>
        <form @submit.prevent="openConfirmModal">
            <div class="form-group">
                <label for="username">ชื่อผู้ใช้งาน (Username) *</label>
                <input type="text" id="username" v-model="formData.username" required />
            </div>
            <div class="form-group">
                <label for="email">อีเมล (Email)</label>
                <input type="email" id="email" v-model="formData.email" />
            </div>
            <div class="form-group">
                <label for="password">รหัสผ่าน (Password) *</label>
                <input type="password" id="password" v-model="formData.password" required />
            </div>
            <div class="form-group">
                <label for="fullname">ชื่อ-นามสกุล (Full Name) *</label>
                <input type="text" id="fullname" v-model="formData.fullname" required />
            </div>
            <div class="form-group">
                <label for="tel">เบอร์โทรศัพท์ (Telephone)</label>
                <input type="tel" id="tel" v-model="formData.tel" required />
            </div>
            <div class="form-group">
                <label for="role">สิทธิ์การใช้งาน (Role) *</label>
                <select id="role" v-model="formData.role" required>
                    <option value="admin">Admin</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="truck">Truck</option>
                </select>
            </div>
            <div class="button-group">
                <button type="submit" class="save-btn" :disabled="loading">
                    <span v-if="loading">กำลังสร้าง...</span>
                    <span v-else>สร้างผู้ใช้งาน</span>
                </button>
                <button type="button" class="cancel-btn" @click="resetForm">ยกเลิก</button>
            </div>
        </form>


        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
                <h3>ยืนยันการสร้างผู้ใช้งาน</h3>
                <p>คุณต้องการสร้างผู้ใช้งานชื่อ **{{ formData.fullname }}** ใช่หรือไม่?</p>
                <div class="modal-buttons">
                    <button class="modal-cancel-btn" @click="closeModal">ยกเลิก</button>
                    <button class="modal-confirm-btn" @click="registerUser">ยืนยัน</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const formData = ref({
    username: '',
    email: '',
    password: '',
    fullname: '',
    tel: '',
    role: 'user', // กำหนดค่าเริ่มต้นเป็น user
});

const loading = ref(false);
const showModal = ref(false);

const openConfirmModal = () => {
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const resetForm = () => {
    formData.value = {
        username: '',
        email: '',
        password: '',
        fullname: '',
        tel: '',
        role: 'user',
    };
};

const registerUser = async () => {
    closeModal();
    loading.value = true;
    try {
        await axios.post('/register', formData.value);
        Swal.fire({
            title: 'สำเร็จ!',
            text: 'สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonText: 'ตกลง',
        });
        resetForm();
    } catch (error) {
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }
        Swal.fire({
            title: 'ผิดพลาด!',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'ตกลง',
        });
        console.error('Registration error:', error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.add-user-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.add-user-container h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--text-color-primary);
    font-size: 28px;
}

.form-card {
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 10px;
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

.form-group input,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    background-color: var(--bg-color);
    color: var(--text-color-primary);
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
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