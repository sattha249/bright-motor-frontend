<template>
    <div class="add-truck-tab">
        <div class="form-header-box">
            <div class="form-icon-circle">
                <i class="fas fa-truck"></i>
            </div>
            <div>
                <h3 class="form-title">เพิ่มข้อมูลรถขนส่งใหม่</h3>
                <p class="form-desc">กรอกรายละเอียดรถขนส่ง ทะเบียน และความจุในการบรรทุก</p>
            </div>
        </div>

        <form @submit.prevent="openConfirmModal" class="truck-form">
            <div class="form-sections-wrap">
                <div class="form-section-card">
                    <div class="section-badge-title">
                        <i class="fas fa-truck-ramp-box"></i>
                        <span>ข้อมูลยานพาหนะและทะเบียน</span>
                    </div>
                    <div class="section-grid">
                        <div class="form-group">
                            <label for="plateNumber" class="form-label">
                                <i class="fas fa-id-card"></i> ทะเบียนรถ <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="plateNumber"
                                class="form-control"
                                v-model="formData.plateNumber"
                                required
                                placeholder="เช่น 1กข 1234"
                            />
                        </div>

                        <div class="form-group">
                            <label for="plateProvince" class="form-label">
                                <i class="fas fa-map-marker-alt"></i> จังหวัดป้ายทะเบียน <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="plateProvince"
                                class="form-control"
                                v-model="formData.plateProvince"
                                required
                                placeholder="เช่น กรุงเทพมหานคร"
                            />
                        </div>

                        <div class="form-group">
                            <label for="model" class="form-label">
                                <i class="fas fa-truck-pickup"></i> รุ่นรถ <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="model"
                                class="form-control"
                                v-model="formData.model"
                                required
                                placeholder="เช่น Isuzu D-Max"
                            />
                        </div>

                        <div class="form-group">
                            <label for="loadCapacity" class="form-label">
                                <i class="fas fa-weight-hanging"></i> ความจุบรรทุก (กก.) <span class="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="loadCapacity"
                                class="form-control"
                                v-model.number="formData.loadCapacity"
                                required
                                placeholder="เช่น 2000"
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
                    <i v-else class="fas fa-plus-circle"></i>
                    <span>{{ loading ? 'กำลังเพิ่ม...' : 'เพิ่มรถใหม่' }}</span>
                </button>
            </div>
        </form>

        <!-- Confirmation Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div>
                            <h3>ยืนยันการเพิ่มรถ</h3>
                            <span class="modal-subtitle">ตรวจสอบข้อมูลก่อนบันทึก</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeModal">&times;</button>
                </div>
                <div class="modal-body text-center">
                    <p class="confirm-prompt-text">
                        คุณต้องการเพิ่มรถทะเบียน <strong class="text-primary">{{ formData.plateNumber }}</strong> เข้าสู่ระบบใช่หรือไม่?
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeModal">ยกเลิก</button>
                    <button class="btn btn-primary" @click="addTruck">
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

const resetForm = () => {
    formData.value = {
        plateNumber: '',
        plateProvince: '',
        model: '',
        loadCapacity: null,
        userId: null,
    };
};

const addTruck = async () => {
    closeModal();
    loading.value = true;
    try {
        await axios.post('/trucks', formData.value);
        Swal.fire('สำเร็จ!', 'เพิ่มรถใหม่เรียบร้อยแล้ว', 'success');
        resetForm();
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
.add-truck-tab {
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