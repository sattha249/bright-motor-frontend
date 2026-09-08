<template>
    <div class="manage-user-tab">
        <div v-if="loading && filteredUsers.length === 0" class="empty-table-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>กำลังโหลดข้อมูลผู้ใช้งาน...</p>
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
                        placeholder="ค้นหาชื่อผู้ใช้งาน, ชื่อ-นามสกุล..."
                        class="form-control with-icon"
                    />
                </div>
            </div>

            <!-- Table Card -->
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 160px;">ชื่อผู้ใช้งาน</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th style="width: 150px;">เบอร์โทรศัพท์</th>
                            <th style="width: 130px;">สิทธิ์การใช้งาน</th>
                            <th class="text-center" style="width: 110px;">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-initial">
                                        {{ user.fullname?.charAt(0) || user.username?.charAt(0) }}
                                    </div>
                                    <span class="font-bold text-primary">{{ user.username }}</span>
                                </div>
                            </td>
                            <td class="font-medium">{{ user.fullname }}</td>
                            <td class="tabular-nums text-secondary">{{ user.tel || '-' }}</td>
                            <td>
                                <span :class="['role-pill', user.role]">
                                    <i class="fas" :class="user.role === 'admin' ? 'fa-user-shield' : (user.role === 'warehouse' ? 'fa-warehouse' : 'fa-truck')"></i>
                                    {{ user.role }}
                                </span>
                            </td>
                            <td class="text-center">
                                <div class="btn-group-actions">
                                    <button class="btn-icon-action edit" @click="openEditModal(user)" title="แก้ไขข้อมูล">
                                        <i class="fas fa-pen"></i>
                                    </button>

                                    <button
                                        v-if="user.username !== userStore.userData.username"
                                        class="btn-icon-action delete"
                                        @click="confirmDelete(user)"
                                        title="ลบผู้ใช้งาน"
                                    >
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
                            <i class="fas fa-user-edit"></i>
                        </div>
                        <div>
                            <h3>แก้ไขข้อมูลผู้ใช้งาน</h3>
                            <span class="modal-subtitle">{{ selectedUser.fullname }}</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeEditModal">&times;</button>
                </div>
                <form @submit.prevent="updateUser">
                    <div class="modal-body">
                        <div class="form-grid-modal">
                            <div class="form-group">
                                <label class="form-label">ชื่อผู้ใช้งาน</label>
                                <input type="text" class="form-control" v-model="selectedUser.username" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">ชื่อ-นามสกุล</label>
                                <input type="text" class="form-control" v-model="selectedUser.fullname" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">เบอร์โทรศัพท์</label>
                                <input type="tel" class="form-control" v-model="selectedUser.tel" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">สิทธิ์การใช้งาน</label>
                                <select class="form-control" v-model="selectedUser.role" required>
                                    <option value="admin">Admin</option>
                                    <option value="warehouse">Warehouse</option>
                                    <option value="truck">Truck</option>
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
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();

// State
const filteredUsers = ref([]); // เก็บข้อมูล User ที่จะแสดง (ตัด admin01 ออกแล้ว)
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');

// Pagination State (จาก API)
const currentPage = ref(1);
const totalPages = ref(1);
const perPage = ref(10);

const showEditModal = ref(false);
const selectedUser = ref(null);

// ฟังก์ชันดึงข้อมูล (รับ parameter page)
const fetchUsers = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
        // ส่ง params ไปให้ Backend (search, page)
        // หมายเหตุ: เช็คกับ Backend ว่าใช้ชื่อ param ว่า 'search', 'keyword' หรือ 'q'
        const res = await axios.get('/users', {
            params: {
                page: page,
                search: searchQuery.value // ส่งคำค้นหาไปที่ API
            }
        });

        const rawData = res.data.data;

        // กรอง admin01 ออก (Client-side logic)
        filteredUsers.value = rawData.filter(user => user.username !== 'admin01');

        // อัปเดตข้อมูล Pagination จาก Meta ที่ API ส่งมา
        if (res.data.meta) {
            currentPage.value = res.data.meta.current_page;
            totalPages.value = res.data.meta.last_page;
            perPage.value = res.data.meta.per_page;
        }

    } catch (err) {
        error.value = 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// เปลี่ยนหน้า
const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchUsers(page);
    }
};

// Watch search query (Debounce: รอให้หยุดพิมพ์ 500ms ค่อยยิง API)
let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // กลับไปหน้า 1 ทุกครั้งที่ค้นหาใหม่
        fetchUsers(1);
    }, 500);
});

// Modal Logic
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
        fetchUsers(currentPage.value); // โหลดข้อมูลหน้าปัจจุบันใหม่
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
        text: `คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานชื่อ "${user.fullname}"?`,
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
                await axios.delete(`/users/${user.id}`);
                Swal.fire('สำเร็จ!', 'ลบผู้ใช้งานเรียบร้อยแล้ว', 'success');
                fetchUsers(currentPage.value); // โหลดข้อมูลหน้าปัจจุบันใหม่
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

onMounted(async () => {
    fetchUsers(1);
    if (!userStore.userData || Object.keys(userStore.userData).length === 0) {
        try {
            const res = await axios.get('/profile');
            userStore.setUserData(res.data);
            console.log("Restored User Data:", userStore.userData);
        } catch (err) {
            console.error("Failed to restore user session:", err);
        }
    }
});
</script>

<style scoped>
.manage-user-tab {
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

/* User cell with avatar initial */
.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-avatar-initial {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    border: 1px solid rgba(37, 99, 235, 0.25);
    text-transform: uppercase;
}

/* Role Pills */
.role-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.65rem;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
}

.role-pill.admin {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.2);
}

.role-pill.warehouse {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.role-pill.truck {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.25);
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