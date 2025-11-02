<template>
    <div class="main-content-container">
        <h2 class="section-title">ใบสั่งซื้อ (Purchase Orders)</h2>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">รายการใบสั่งซื้อ</h3>

                <router-link :to="{ name: 'CreatePO' }" class="primary-btn">
                    <i class="fas fa-plus"></i> สร้างใบสั่งซื้อใหม่
                </router-link>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ผู้สร้าง</th>
                            <th>ผู้จำหน่าย</th>
                            <th>สถานะ</th>
                            <th>ผู้อนุมัติ</th>
                            <th>วันที่สร้าง</th>
                            <th>ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="po in purchaseOrders" :key="po.id">
                            <td>PO-{{ po.id }}</td>
                            <td>{{ po.creator?.fullname || 'N/A' }}</td>
                            <td>{{ po.supplier_name || '-' }}</td>
                            <td>
                                <span :class="['status-badge', po.status.toLowerCase()]">
                                    {{ po.status }}
                                </span>
                            </td>
                            <td>{{ po.approver?.fullname || '-' }}</td>
                            <td>{{ new Date(po.created_at).toLocaleDateString() }}</td>
                            <td class="action-buttons">
                                <router-link :to="{ name: 'EditPO', params: { id: po.id } }" class="action-btn edit-btn"
                                    v-if="po.status === 'Pending'">
                                    แก้ไข
                                </router-link>

                                <button class="action-btn approve-btn" @click="openApproveModal(po)"
                                    v-if="userStore.role === 'admin' && po.status === 'Pending'">
                                    อนุมัติ
                                </button>
                                <button class="action-btn delete-btn" @click="openCancelModal(po)"
                                    v-if="po.status === 'Pending'">
                                    ยกเลิก
                                </button>
                                <br v-else></br>
                            </td>
                        </tr>
                        <tr v-if="!loading && purchaseOrders.length === 0">
                            <td colspan="7" style="text-align: center;">ไม่พบข้อมูลใบสั่งซื้อ</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="loading" class="loading-indicator">
                กำลังโหลดข้อมูล...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Import useRouter
import axios from '@/lib/axios';
import Swal from 'sweetalert2';
// import { useUserStore } from '@/stores/user'; // สมมติว่ามี User Store

// const userStore = useUserStore(); // ใช้ store เพื่อเช็ค Role
const userStore = ref({ role: 'admin' }); // *** Dummy User Store - ลบออกเมื่อเชื่อมต่อจริง ***
const router = useRouter(); // Initialize router

const purchaseOrders = ref([]);
const loading = ref(false);

const fetchPurchaseOrders = async () => {
    loading.value = true;
    try {
        const res = await axios.get('/purchase-orders');
        purchaseOrders.value = res.data.data;

    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูล PO ได้', 'error');
        console.error("Fetch PO Error:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchPurchaseOrders);

// Approve
const openApproveModal = (po) => {
    Swal.fire({
        title: 'ยืนยันการอนุมัติ',
        text: `คุณต้องการอนุมัติ PO-${po.id} และนำสินค้าเข้าสต็อกใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#48bb78',
        cancelButtonColor: '#e53e3e',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
        if (result.isConfirmed) {
            loading.value = true;
            try {
                await axios.patch(`/purchase-orders/${po.id}/approve`);
                Swal.fire('อนุมัติแล้ว!', 'สินค้าถูกเพิ่มเข้าคลังเรียบร้อย', 'success');
                fetchPurchaseOrders();
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติ PO ได้', 'error');
            } finally {
                loading.value = false;
            }
        }
    });
};

// Cancel
const openCancelModal = (po) => {
    Swal.fire({
        title: 'ยืนยันการยกเลิก',
        text: `คุณต้องการยกเลิก PO-${po.id} ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
        if (result.isConfirmed) {
            loading.value = true;
            try {
                await axios.delete(`/purchase-orders/${po.id}`);
                Swal.fire('ยกเลิกแล้ว', 'ใบสั่งซื้อถูกยกเลิกแล้ว', 'success');
                fetchPurchaseOrders();
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถยกเลิก PO ได้', 'error');
            } finally {
                loading.value = false;
            }
        }
    });
};
</script>

<style scoped>
.main-content-container {
    padding: 2rem;
    max-width: 1200px;
    margin: auto;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 2rem;
    text-align: center;
}

.card {
    background-color: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.card-title {
    font-size: 1.4rem;
    font-weight: 600;
}

.primary-btn {
    background-color: var(--primary-color);
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-decoration: none;
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.primary-btn:hover {
    background-color: #2c7a7b;
}

.table-responsive {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
}

.data-table th {
    background-color: #f8f9fa;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    /* Layout & Box Model */
    display: inline-flex;
    /* บังคับให้ <a> และ <button> แสดงผลแบบ flex */
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    /* รีเซ็ต border ของ <button> */

    /* Typography */
    font-size: 14px;
    font-weight: 500;
    color: white !important;
    /* บังคับสีขาว */
    text-decoration: none;
    /* รีเซ็ตขีดเส้นใต้ของ <a> */
    font-family: inherit;
    /* ใช้ font เดียวกัน */
    white-space: nowrap;
    /* ป้องกันปุ่มตกบรรทัด */

    /* Interaction */
    cursor: pointer;
    transition: opacity 0.3s;
}

.action-btn:hover {
    opacity: 0.8;
}

.edit-btn {
    background-color: #ffc107;
}

.approve-btn {
    background-color: #28a745;
}

.delete-btn {
    background-color: #dc3545;
}

/* --- สิ้นสุดส่วนอัปเดต --- */


/* ... (CSS อื่นๆ ที่เหลือ) ... */
.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-transform: capitalize;
}

.status-badge.pending {
    background-color: #f6ad55;
}

.status-badge.approved {
    background-color: #48bb78;
}

.status-badge.cancelled {
    background-color: #e53e3e;
}

.loading-indicator {
    text-align: center;
    padding: 2rem;
    font-weight: 600;
    color: var(--text-color-secondary);
}
</style>