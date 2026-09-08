<template>
    <div class="add-user-container">
        <div class="form-header-box">
            <div class="form-icon-circle">
                <i class="fas fa-user-plus"></i>
            </div>
            <div>
                <h3 class="form-title">สร้างบัญชีผู้ใช้งานใหม่</h3>
                <p class="form-desc">กรอกข้อมูลผู้ใช้งานและกำหนดระดับสิทธิ์การเข้าถึงระบบ</p>
            </div>
        </div>

        <form @submit.prevent="openConfirmModal" class="user-form">
            <div class="form-sections-wrap">
                <!-- Section 1: Credentials & Role -->
                <div class="form-section-card">
                    <div class="section-badge-title">
                        <i class="fas fa-key"></i>
                        <span>ข้อมูลบัญชีผู้ใช้และสิทธิ์</span>
                    </div>
                    <div class="section-grid">
                        <div class="form-group">
                            <label for="username" class="form-label">
                                <i class="fas fa-user"></i> ชื่อผู้ใช้งาน (Username) <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                class="form-control"
                                placeholder="เช่น somchai_k"
                                v-model="formData.username"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">
                                <i class="fas fa-lock"></i> รหัสผ่าน (Password) <span class="required">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                class="form-control"
                                placeholder="กำหนดรหัสผ่านเข้าสู่ระบบ"
                                v-model="formData.password"
                                required
                            />
                        </div>

                        <div class="form-group full-width">
                            <label for="role" class="form-label">
                                <i class="fas fa-shield-alt"></i> สิทธิ์การใช้งาน (Role) <span class="required">*</span>
                            </label>
                            <select id="role" class="form-control" v-model="formData.role" required>
                                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                <option value="warehouse">Warehouse (เจ้าหน้าที่คลัง)</option>
                                <option value="truck">Truck (พนักงานประจำรถขนส่ง)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Personal Profile & Contact -->
                <div class="form-section-card">
                    <div class="section-badge-title">
                        <i class="fas fa-address-card"></i>
                        <span>ข้อมูลส่วนบุคคลและการติดต่อ</span>
                    </div>
                    <div class="section-grid">
                        <div class="form-group full-width">
                            <label for="fullname" class="form-label">
                                <i class="fas fa-id-card"></i> ชื่อ-นามสกุล (Full Name) <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullname"
                                class="form-control"
                                placeholder="เช่น สมชาย ใจดี"
                                v-model="formData.fullname"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="tel" class="form-label">
                                <i class="fas fa-phone"></i> เบอร์โทรศัพท์ (Telephone) <span class="required">*</span>
                            </label>
                            <input
                                type="tel"
                                id="tel"
                                class="form-control"
                                placeholder="เช่น 0812345678"
                                v-model="formData.tel"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="email" class="form-label">
                                <i class="fas fa-envelope"></i> อีเมล (Email)
                            </label>
                            <input
                                type="email"
                                id="email"
                                class="form-control"
                                placeholder="เช่น somchai@example.com"
                                v-model="formData.email"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="resetForm">
                    <i class="fas fa-undo"></i> รีเซ็ตฟอร์ม
                </button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-check-circle"></i>
                    <span>{{ loading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน' }}</span>
                </button>
            </div>
        </form>

        <!-- Confirmation Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div>
                            <h3>ยืนยันการสร้างผู้ใช้งาน</h3>
                            <span class="modal-subtitle">โปรดตรวจสอบความถูกต้อง</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeModal">&times;</button>
                </div>
                <div class="modal-body text-center">
                    <p class="confirm-prompt-text">
                        คุณต้องการสร้างผู้ใช้งานชื่อ <strong class="text-primary">{{ formData.fullname }}</strong> ในระบบใช่หรือไม่?
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeModal">ยกเลิก</button>
                    <button class="btn btn-primary" @click="registerUser">
                        <i class="fas fa-check"></i> ยืนยัน
                    </button>
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
    padding: 0.5rem 0;
    max-width: 920px;
    margin: 0 auto;
}

.form-header-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1.25rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid var(--border);
}

.form-icon-circle {
    width: 46px;
    height: 46px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.16));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.08);
}

.form-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.form-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin: 0.25rem 0 0 0;
}

.form-sections-wrap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section-card {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    transition: border-color var(--transition-fast);
}

.form-section-card:hover {
    border-color: #cbd5e1;
}

.form-control {
    background-color: #ffffff !important;
    border: 1.5px solid #94a3b8 !important;
    color: #0f172a !important;
    box-shadow: 0 1.5px 3px rgba(15, 23, 42, 0.06);
}

.form-control:hover {
    border-color: #64748b !important;
}

.form-control:focus {
    border-color: #2563eb !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.16) !important;
}

.section-badge-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    color: #1e293b;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
}

.section-badge-title i {
    color: var(--primary);
    font-size: 0.95rem;
}

.section-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
}

.full-width {
    grid-column: 1 / -1;
}

.required {
    color: var(--danger);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
}

.confirm-prompt-text {
    font-size: 0.95rem;
    color: var(--text-secondary);
    padding: 1rem 0;
}

@media (max-width: 640px) {
    .section-grid {
        grid-template-columns: 1fr;
    }
    .form-actions {
        flex-direction: column;
    }
    .form-actions .btn {
        width: 100%;
    }
}
</style>