<template>
    <div class="manage-truck-tab">
        <div v-if="loading" class="loading-state">กำลังโหลดข้อมูลรถ...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else>
            <div class="search-and-filter">
                <input type="text" v-model="searchQuery" placeholder="ค้นหาทะเบียนรถ..." class="search-input" />
            </div>

            <table class="truck-table">
                <thead>
                    <tr>
                        <th>ทะเบียนรถ</th>
                        <th>จังหวัด</th>
                        <th>รุ่นรถ</th>
                        <th>ความจุ (กก.)</th>
                        <th>คนขับ</th>
                        <th>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="truck in paginatedTrucks" :key="truck.id">
                        <td>{{ truck.plate_number }}</td>
                        <td>{{ truck.plate_province || '-' }}</td>
                        <td>{{ truck.model || '-' }}</td>
                        <td>{{ truck.load_capacity || '-' }}</td>
                        <td>{{ truck.user ? truck.user.fullname : 'ยังไม่ได้มอบหมาย' }}</td>
                        <td>
                            <button class="action-btn edit-btn" @click="openEditModal(truck)">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="action-btn delete-btn" @click="openDeleteModal(truck)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="pagination" v-if="filteredTrucks.length > perPage">
                <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
                <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
            </div>
        </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal edit-modal">
            <h3>แก้ไขข้อมูลรถ: {{ selectedTruck.plate_number }}</h3>
            <form @submit.prevent="updateTruck">
                <div class="form-group">
                    <label>ทะเบียนรถ</label>
                    <input type="text" v-model="selectedTruck.plate_number" required />
                </div>
                <div class="form-group">
                    <label>จังหวัดป้ายทะเบียน</label>
                    <input type="text" v-model="selectedTruck.plate_province" />
                </div>
                <div class="form-group">
                    <label>รุ่นรถ</label>
                    <input type="text" v-model="selectedTruck.model" />
                </div>
                <div class="form-group">
                    <label>ความจุ (กก.)</label>
                    <input type="number" v-model.number="selectedTruck.load_capacity" />
                </div>
                <div class="form-group">
                    <label>คนขับ</label>
                    <select v-model="selectedTruck.user_id">
                        <option :value="null">-- ยังไม่ได้มอบหมาย --</option>
                        <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
                            {{ driver.fullname }} ({{ driver.username }})
                        </option>
                    </select>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="modal-cancel-btn" @click="closeEditModal">ยกเลิก</button>
                    <button type="submit" class="modal-confirm-btn" :disabled="loading">บันทึก</button>
                </div>
            </form>
        </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal">
            <h3>ยืนยันการลบรถ</h3>
            <p>คุณแน่ใจหรือไม่ที่จะลบรถทะเบียน **{{ selectedTruck.plate_number }}**?</p>
            <div class="modal-buttons">
                <button class="modal-cancel-btn" @click="closeDeleteModal">ยกเลิก</button>
                <button class="modal-confirm-btn delete-confirm-btn" @click="deleteTruck">ยืนยัน</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const trucks = ref([]);
const drivers = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = 10;

const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedTruck = ref(null);

const filteredTrucks = computed(() => {
    // ป้องกัน trucks.value เป็น undefined
    if (!trucks.value) return [];

    return trucks.value.filter(truck =>
        truck.plate_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (truck.plate_province && truck.plate_province.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

const totalPages = computed(() => {
    return Math.ceil(filteredTrucks.value.length / perPage);
});

const paginatedTrucks = computed(() => {
    const start = (currentPage.value - 1) * perPage;
    const end = start + perPage;
    return filteredTrucks.value.slice(start, end);
});

watch(filteredTrucks, () => {
    currentPage.value = 1;
});

const fetchTrucks = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await axios.get('/trucks');
        trucks.value = res.data; // ดึงข้อมูลจาก res.data โดยตรง
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
        drivers.value = res.data.data;
    } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลคนขับได้', err);
    }
};

const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

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
        console.log('value is', selectedTruck.value)
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
        fetchTrucks();
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
        fetchTrucks();
    } catch (err) {
        Swal.fire('ผิดพลาด!', 'ไม่สามารถลบรถได้', 'error');
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchTrucks();
    fetchDrivers();
});
</script>


<style scoped>
.manage-truck-tab {
    padding: 1rem;
}

.search-and-filter {
    margin-bottom: 1.5rem;
}

.search-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
}

.truck-table {
    width: 100%;
    border-collapse: collapse;
}

.truck-table th,
.truck-table td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}

.truck-table th {
    background-color: var(--secondary-color);
    font-weight: 600;
}

.action-btn {
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 18px;
    margin-right: 10px;
    transition: color 0.3s;
}

.edit-btn {
    color: #4299e1;
}

.edit-btn:hover {
    color: #2b6cb0;
}

.delete-btn {
    color: #e53e3e;
}

.delete-btn:hover {
    color: #c53030;
}

/* Pagination Styles */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 2rem;
}

.pagination button {
    background-color: var(--secondary-color);
    color: #4a5568;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
}

.pagination button:hover:not(:disabled) {
    background-color: var(--primary-color);
    color: white;
}

.pagination button:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
    color: #a0aec0;
}

.pagination span {
    font-weight: 600;
    color: #4a5568;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    text-align: center;
}

.edit-modal {
    max-width: 500px;
    text-align: left;
}

.modal h3 {
    margin-bottom: 1rem;
    color: #333;
    text-align: center;
}

.modal p {
    margin-bottom: 1.5rem;
    color: #555;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.edit-modal .modal-buttons {
    justify-content: flex-end;
}

.modal-confirm-btn,
.modal-cancel-btn {
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s;
}

.modal-confirm-btn {
    background-color: #48bb78;
    color: white;
}

.modal-confirm-btn:hover {
    background-color: #38a169;
}

.modal-cancel-btn {
    background-color: #e53e3e;
    color: white;
}

.modal-cancel-btn:hover {
    background-color: #c53030;
}

.delete-confirm-btn {
    background-color: #e53e3e !important;
}

.delete-confirm-btn:hover {
    background-color: #c53030 !important;
}

.form-group {
    margin-bottom: 1rem;
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
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
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
</style>