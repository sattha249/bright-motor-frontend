<template>
    <div class="manage-truck-tab">
        <div v-if="loading && trucks.length === 0" class="empty-table-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>กำลังโหลดข้อมูลรถ...</p>
        </div>
        <div v-else-if="error" class="empty-table-state text-danger">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
        </div>
        <div v-else>
            <!-- Search Bar -->
            <div class="search-and-filter">
                <div class="search-input-wrap">
                    <i class="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        v-model="searchQuery"
                        placeholder="ค้นหาทะเบียนรถ, รุ่นรถ..."
                        class="form-control with-icon"
                    />
                </div>
            </div>

            <!-- Truck Table Card -->
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 170px;">ทะเบียนรถ</th>
                            <th>จังหวัดป้ายทะเบียน</th>
                            <th>รุ่นรถ</th>
                            <th class="text-right" style="width: 140px;">ความจุ (กก.)</th>
                            <th>ผู้รับผิดชอบ (คนขับ)</th>
                            <th class="text-center" style="width: 110px;">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="truck in trucks" :key="truck.id">
                            <td>
                                <div class="truck-plate-cell">
                                    <div class="truck-icon-badge">
                                        <i class="fas fa-truck"></i>
                                    </div>
                                    <span class="font-bold text-primary tabular-nums">{{ truck.plate_number }}</span>
                                </div>
                            </td>
                            <td>{{ truck.plate_province || '-' }}</td>
                            <td class="font-medium">{{ truck.model || '-' }}</td>
                            <td class="text-right tabular-nums font-semibold">{{ truck.load_capacity ? truck.load_capacity.toLocaleString() : '-' }}</td>
                            <td>
                                <span v-if="truck.user" class="driver-badge assigned">
                                    <i class="fas fa-user-check"></i>
                                    {{ truck.user.fullname }}
                                </span>
                                <span v-else class="driver-badge unassigned">
                                    <i class="fas fa-user-clock"></i>
                                    ยังไม่มอบหมาย
                                </span>
                            </td>
                            <td class="text-center">
                                <div class="btn-group-actions">
                                    <button class="btn-icon-action edit" @click="openEditModal(truck)" title="แก้ไขข้อมูลรถ">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <button class="btn-icon-action delete" @click="openDeleteModal(truck)" title="ลบข้อมูลรถ">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-wrapper" v-if="totalPages > 1">
                <button
                    class="btn btn-secondary btn-sm"
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                >
                    <i class="fas fa-chevron-left"></i> ก่อนหน้า
                </button>
                <div class="page-indicator">
                    หน้า <span class="font-bold tabular-nums">{{ currentPage }}</span> จาก <span class="tabular-nums">{{ totalPages }}</span>
                </div>
                <button
                    class="btn btn-secondary btn-sm"
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                >
                    ถัดไป <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <!-- Edit Modal -->
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
            <div class="modal modal-md">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div>
                            <h3>แก้ไขข้อมูลรถ</h3>
                            <span class="modal-subtitle">ทะเบียน: {{ selectedTruck.plate_number }}</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeEditModal">&times;</button>
                </div>
                <form @submit.prevent="updateTruck">
                    <div class="modal-body">
                        <div class="form-grid-modal">
                            <div class="form-group">
                                <label class="form-label">ทะเบียนรถ <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" v-model="selectedTruck.plate_number" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">จังหวัดป้ายทะเบียน</label>
                                <input type="text" class="form-control" v-model="selectedTruck.plate_province" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">รุ่นรถ</label>
                                <input type="text" class="form-control" v-model="selectedTruck.model" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">ความจุบรรทุก (กก.)</label>
                                <input type="number" class="form-control" v-model.number="selectedTruck.load_capacity" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">ผู้รับผิดชอบ (คนขับ)</label>
                                <select class="form-control" v-model="selectedTruck.user_id">
                                    <option :value="null">-- ยังไม่ได้มอบหมาย --</option>
                                    <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
                                        {{ driver.fullname }} ({{ driver.username }})
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeEditModal">ยกเลิก</button>
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-save"></i>
                            <span>บันทึกการเปลี่ยนแปลง</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Modal -->
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge danger">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <h3>ยืนยันการลบรถ</h3>
                            <span class="modal-subtitle">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeDeleteModal">&times;</button>
                </div>
                <div class="modal-body text-center">
                    <p class="confirm-prompt-text">
                        คุณแน่ใจหรือไม่ที่จะลบรถทะเบียน <strong class="text-danger">{{ selectedTruck.plate_number }}</strong> ออกจากระบบ?
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeDeleteModal">ยกเลิก</button>
                    <button class="btn btn-danger" @click="deleteTruck" :disabled="loading">
                        <i class="fas fa-trash-alt"></i> ลบข้อมูลรถ
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

// State
const trucks = ref([]);
const drivers = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

// Pagination State (รับค่าจาก API)
const currentPage = ref(1);
const totalPages = ref(1);
const perPage = ref(10);

// Modal State
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedTruck = ref(null);

// Fetch Functions
const fetchTrucks = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
        // ส่ง params: page และ search ไปให้ Backend
        const res = await axios.get('/trucks', {
            params: {
                page: page,
                search: searchQuery.value
            }
        });

        // รับข้อมูล Array รถ
        trucks.value = res.data.data;

        // อัปเดต Pagination จาก Meta Data
        if (res.data.meta) {
            currentPage.value = res.data.meta.current_page;
            totalPages.value = res.data.meta.last_page;
            perPage.value = res.data.meta.per_page;
        }
    } catch (err) {
        error.value = 'ไม่สามารถโหลดข้อมูลรถได้';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const fetchDrivers = async () => {
    try {
        const res = await axios.get('/users?role=truck');
        // ตรวจสอบโครงสร้าง response ของ users ว่ามาแบบ paginate หรือ list ธรรมดา
        // ถ้า users ทำ pagination แล้ว ตรงนี้อาจต้องแก้ให้ดึงทั้งหมด หรือ search เอา
        // เบื้องต้นสมมติว่าดึง data ออกมาได้
        drivers.value = res.data.data || res.data;
    } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลคนขับได้', err);
    }
};

// Search Watcher (Debounce)
let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // เมื่อค้นหา ให้กลับไปหน้า 1 เสมอ
        fetchTrucks(1);
    }, 500);
});

// Pagination Change
const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchTrucks(page);
    }
};

// Modal Logic
const openEditModal = (truck) => {
    selectedTruck.value = { ...truck };
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
    selectedTruck.value = null;
};

const updateTruck = async () => {
    loading.value = true;
    try {
        let updateData = {
            plateNumber: selectedTruck.value.plate_number,
            userId: selectedTruck.value.user_id,
            plateProvince: selectedTruck.value.plate_province,
            model: selectedTruck.value.model,
            loadCapacity: selectedTruck.value.load_capacity
        }
        await axios.put(`/trucks/${selectedTruck.value.id}`, updateData);
        Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลรถเรียบร้อยแล้ว', 'success');
        closeEditModal();
        fetchTrucks(currentPage.value); // รีเฟรชหน้าปัจจุบัน
    } catch (err) {
        let errorMessage = 'ไม่สามารถแก้ไขข้อมูลรถได้';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
        Swal.fire('ผิดพลาด!', errorMessage, 'error');
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const openDeleteModal = (truck) => {
    selectedTruck.value = truck;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    selectedTruck.value = null;
};

const deleteTruck = async () => {
    loading.value = true;
    try {
        await axios.delete(`/trucks/${selectedTruck.value.id}`);
        Swal.fire('สำเร็จ!', 'ลบรถเรียบร้อยแล้ว', 'success');
        closeDeleteModal();
        fetchTrucks(currentPage.value); // รีเฟรชหน้าปัจจุบัน
    } catch (err) {
        Swal.fire('ผิดพลาด!', 'ไม่สามารถลบรถได้', 'error');
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    fetchTrucks(1);
    fetchDrivers();
});
</script>

<style scoped>
.manage-truck-tab {
    padding: 0.5rem 0;
}

.search-and-filter {
    margin-bottom: 1.25rem;
}

.search-input-wrap {
    position: relative;
    max-width: 380px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 0.9rem;
    pointer-events: none;
}

.form-control.with-icon {
    padding-left: 36px;
}

/* Truck plate cell */
.truck-plate-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.truck-icon-badge {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.18));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

/* Driver badges */
.driver-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.65rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: 500;
}

.driver-badge.assigned {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
}

.driver-badge.unassigned {
    background: var(--bg-main);
    color: var(--text-muted);
    border: 1px solid var(--border);
}

/* Action buttons */
.btn-group-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-icon-action {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all var(--transition-fast);
}

.btn-icon-action.edit {
    background: rgba(37, 99, 235, 0.08);
    color: var(--primary);
    border-color: rgba(37, 99, 235, 0.2);
}

.btn-icon-action.edit:hover {
    background: var(--primary);
    color: white;
}

.btn-icon-action.delete {
    background: rgba(239, 68, 68, 0.08);
    color: var(--danger);
    border-color: rgba(239, 68, 68, 0.2);
}

.btn-icon-action.delete:hover {
    background: var(--danger);
    color: white;
}

/* Form modal grid */
.form-grid-modal {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Pagination */
.pagination-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
    margin-top: 1rem;
}

.page-indicator {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.confirm-prompt-text {
    font-size: 0.95rem;
    color: var(--text-secondary);
    padding: 1rem 0;
}

.empty-table-state {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-muted);
}

.empty-table-state i {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.5;
}
</style>