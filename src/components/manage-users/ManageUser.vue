<template>
    <div class="manage-user-tab">
        <div v-if="loading" class="loading-state">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else>
            <div class="search-and-filter">
                <input type="text" v-model="searchQuery" placeholder="ค้นหาผู้ใช้งาน..." class="search-input" />
            </div>

            <table class="user-table">
                <thead>
                    <tr>
                        <th>ชื่อผู้ใช้งาน</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>เบอร์โทรศัพท์</th>
                        <th>สิทธิ์</th>
                        <th>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in paginatedUsers" :key="user.id">
                        <td>{{ user.username }}</td>
                        <td>{{ user.fullname }}</td>
                        <td>{{ user.tel || '-' }}</td>
                        <td><span :class="['role-badge', user.role]">{{ user.role }}</span></td>
                        <td>
                            <button class="action-btn edit-btn" @click="openEditModal(user)">
                                <i class="fas fa-pen"></i>
                            </button>

                            <button v-if="user.id !== userStore.userData?.id" class="action-btn delete-btn"
                                @click="confirmDelete(user)"> <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="pagination" v-if="filteredUsers.length > perPage">
                <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
                <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
            </div>
        </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal edit-modal">
            <h3>แก้ไขข้อมูลผู้ใช้งาน: {{ selectedUser.fullname }}</h3>
            <form @submit.prevent="updateUser">
                <div class="form-group">
                    <label>ชื่อผู้ใช้งาน</label>
                    <input type="text" v-model="selectedUser.username" required />
                </div>
                <div class="form-group">
                    <label>ชื่อ-นามสกุล</label>
                    <input type="text" v-model="selectedUser.fullname" required />
                </div>
                <div class="form-group">
                    <label>เบอร์โทรศัพท์</label>
                    <input type="tel" v-model="selectedUser.tel" />
                </div>
                <div class="form-group">
                    <label>สิทธิ์</label>
                    <select v-model="selectedUser.role" required>
                        <option value="admin">Admin</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="truck">Truck</option>
                    </select>
                </div>
                <div class="modal-buttons">
                    <button type="button" class="modal-cancel-btn" @click="closeEditModal">ยกเลิก</button>
                    <button type="submit" class="modal-confirm-btn" :disabled="loading">บันทึก</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const users = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = 10;

const showEditModal = ref(false);
const selectedUser = ref(null);

const filteredUsers = computed(() => {
    return users.value.filter(user => {
        // 1. Hardcode ซ่อน admin01
        if (user.username === 'admin01') return false;

        // 2. Logic ค้นหาปกติ
        return (
            user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            user.fullname.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });
});

const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / perPage);
});

const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * perPage;
    const end = start + perPage;
    return filteredUsers.value.slice(start, end);
});

watch(filteredUsers, () => {
    currentPage.value = 1;
});

const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await axios.get('/users');
        users.value = res.data.data;
    } catch (err) {
        error.value = 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const openEditModal = (user) => {
    selectedUser.value = { ...user };
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
    selectedUser.value = null;
};

const updateUser = async () => {
    loading.value = true;
    try {
        await axios.put(`/users/${selectedUser.value.id}`, selectedUser.value);
        Swal.fire('สำเร็จ!', 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว', 'success');
        closeEditModal();
        fetchUsers();
    } catch (err) {
        let errorMessage = 'ไม่สามารถแก้ไขข้อมูลผู้ใช้งานได้';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
        Swal.fire('ผิดพลาด!', errorMessage, 'error');
        console.error(err);
    } finally {
        loading.value = false;
    }
};


const confirmDelete = (user) => {
    Swal.fire({
        title: 'ยืนยันการลบผู้ใช้งาน',
        text: `คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานชื่อ "${user.fullname}"?`, // แสดงชื่อในข้อความ
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
        if (result.isConfirmed) {
            loading.value = true;
            try {
                // ส่ง API ลบข้อมูล
                await axios.delete(`/users/${user.id}`);

                Swal.fire('สำเร็จ!', 'ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
                fetchUsers(); // โหลดข้อมูลใหม่
            } catch (err) {
                let msg = 'ไม่สามารถลบผู้ใช้งานได้';
                if (err.response && err.response.data && err.response.data.message) {
                    msg = err.response.data.message;
                }
                Swal.fire('ผิดพลาด!', msg, 'error');
                console.error(err);
            } finally {
                loading.value = false;
            }
        }
    });
};

const deleteUser = async () => {
    loading.value = true;
    try {
        await axios.delete(`/users/${selectedUser.value.id}`);
        Swal.fire('สำเร็จ!', 'ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
        closeDeleteModal();
        fetchUsers();
    } catch (err) {
        Swal.fire('ผิดพลาด!', 'ไม่สามารถลบผู้ใช้งานได้', 'error');
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchUsers();
});
</script>

<style scoped>
.manage-user-tab {
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

.user-table {
    width: 100%;
    border-collapse: collapse;
}

.user-table th,
.user-table td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}

.user-table th {
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

.role-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: white;
}

.role-badge.admin {
    background-color: #e53e3e;
}

.role-badge.warehouse {
    background-color: #3182ce;
}

.role-badge.truck {
    background-color: #f6ad55;
}

.delete-confirm-btn {
    background-color: #e53e3e !important;
}

.delete-confirm-btn:hover {
    background-color: #c53030 !important;
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

/* Edit Modal Specific Styles */
.edit-modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: left;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
}

.edit-modal h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--text-color-primary);
}

.edit-modal .form-group {
    margin-bottom: 1rem;
}

.edit-modal .form-group label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: block;
    color: var(--text-color-secondary);
}

.edit-modal .form-group input,
.edit-modal .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 16px;
    background-color: var(--bg-color);
    color: var(--text-color-primary);
    transition: border-color 0.3s;
}

.edit-modal .form-group input:focus,
.edit-modal .form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.edit-modal .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

/* Modal Overlay (Shared) */
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
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
}

.modal h3 {
    margin-bottom: 1rem;
    color: #333;
}

.modal p {
    margin-bottom: 1.5rem;
    color: #555;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
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
</style>