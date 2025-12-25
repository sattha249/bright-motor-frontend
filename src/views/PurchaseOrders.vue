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
                                <button class="action-btn view-btn" @click="openViewModal(po.id)">
                                    <i class="fas fa-eye"></i> ดู
                                </button>

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

        <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
            <div class="modal large-modal">
                <div class="modal-header">
                    <h3>รายละเอียดใบสั่งซื้อ: PO-{{ selectedPO?.id }}</h3>
                    <button class="close-icon-btn" @click="closeViewModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="viewLoading" class="loading-indicator">กำลังโหลดข้อมูล...</div>
                    <div v-else-if="selectedPO">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>ผู้จำหน่าย:</label>
                                <span>{{ selectedPO.supplier_name }}</span>
                            </div>
                            <div class="info-item">
                                <label>สถานะ:</label>
                                <span :class="['status-text', selectedPO.status.toLowerCase()]">{{ selectedPO.status
                                }}</span>
                            </div>
                            <div class="info-item">
                                <label>ผู้สร้าง:</label>
                                <span>{{ selectedPO.creator?.fullname }}</span>
                            </div>
                            <div class="info-item">
                                <label>วันที่สร้าง:</label>
                                <span>{{ new Date(selectedPO.created_at).toLocaleString('th-TH') }}</span>
                            </div>
                            <div class="info-item full-width">
                                <label>หมายเหตุ:</label>
                                <span>{{ selectedPO.notes || '-' }}</span>
                            </div>
                        </div>

                        <hr class="divider">

                        <h4>รายการสินค้า</h4>
                        <table class="detail-table">
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th>จำนวน</th>
                                    <th>ต้นทุน/หน่วย</th>
                                    <th>รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedPO.items" :key="item.id">
                                    <td>{{ item.product?.description || item.product_id }}</td>
                                    <td>{{ item.quantity }}</td>
                                    <td>{{ Number(item.cost_price).toLocaleString() }}</td>
                                    <td>{{ (item.quantity * item.cost_price).toLocaleString() }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3" style="text-align: right;">ยอดรวมสุทธิ</td>
                                    <td>{{ calculateTotal(selectedPO.items) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn" @click="closeViewModal">ปิด</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const userStore = ref({ role: 'admin' });
const router = useRouter();

const purchaseOrders = ref([]);
const loading = ref(false);

// State สำหรับ Modal ดูรายละเอียด
const showViewModal = ref(false);
const selectedPO = ref(null);
const viewLoading = ref(false);

const fetchPurchaseOrders = async () => {
    loading.value = true;
    try {
        const res = await axios.get('/purchase-orders');
        purchaseOrders.value = res.data.data || res.data; // เผื่อโครงสร้าง api ต่างกัน
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูล PO ได้', 'error');
        console.error("Fetch PO Error:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchPurchaseOrders);

// --- View Details Logic ---
const openViewModal = async (id) => {
    showViewModal.value = true;
    viewLoading.value = true;
    selectedPO.value = null;
    try {
        // ยิง API ดึงรายละเอียดเพื่อให้ได้ items ครบถ้วน
        const res = await axios.get(`/purchase-orders/${id}`);
        selectedPO.value = res.data;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถโหลดรายละเอียดได้', 'error');
        showViewModal.value = false;
    } finally {
        viewLoading.value = false;
    }
};

const closeViewModal = () => {
    showViewModal.value = false;
    selectedPO.value = null;
};

const calculateTotal = (items) => {
    if (!items) return 0;
    const total = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    return total.toLocaleString();
};

// ... (Approve & Cancel Logic เดิม) ...
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
/* ... (CSS เดิม) ... */
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

/* Action Buttons Style */
.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: white !important;
    text-decoration: none;
    font-family: inherit;
    white-space: nowrap;
    cursor: pointer;
    transition: opacity 0.3s;
    gap: 5px;
    /* เพิ่ม gap ให้ไอคอนกับตัวหนังสือ */
}

.action-btn:hover {
    opacity: 0.8;
}

/* สีปุ่มต่างๆ */
.view-btn {
    background-color: #3182ce;
}

/* สีฟ้า */
.edit-btn {
    background-color: #ffc107;
}

.approve-btn {
    background-color: #28a745;
}

.delete-btn {
    background-color: #dc3545;
}

/* Badge Status */
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

/* --- Modal Styles (เพิ่มใหม่) --- */
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
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
}

.large-modal {
    width: 95%;
    max-width: 800px;
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
}

.modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
}

.close-icon-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
}

/* Detail Info Grid in Modal */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.info-item.full-width {
    grid-column: span 2;
}

.info-item label {
    font-weight: 600;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 4px;
}

.info-item span {
    font-size: 1rem;
    color: #333;
}

.status-text {
    font-weight: bold;
}

.status-text.pending {
    color: #f6ad55;
}

.status-text.approved {
    color: #28a745;
}

.status-text.cancelled {
    color: #e53e3e;
}

.divider {
    border: 0;
    border-top: 1px solid #eee;
    margin: 20px 0;
}

/* Detail Table in Modal */
.detail-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

.detail-table th,
.detail-table td {
    padding: 10px;
    border-bottom: 1px solid #eee;
    text-align: left;
}

.detail-table th {
    background-color: #f8f9fa;
    font-weight: 600;
}

.total-row {
    font-weight: bold;
    background-color: #f8f9fa;
}
</style>