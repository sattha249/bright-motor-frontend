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
            <div class="form-grid">
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

            <div class="form-actions">
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
.add-truck-tab {
    padding: 0.5rem 0;
}

.form-header-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
}

.form-icon-circle {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(99, 102, 241, 0.15));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.form-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.form-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.2rem 0 0 0;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
}

.required {
    color: var(--danger);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
}

.confirm-prompt-text {
    font-size: 0.95rem;
    color: var(--text-secondary);
    padding: 1rem 0;
}
</style>