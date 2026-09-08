<template>
    <div class="po-view-container">
        <!-- Header Banner -->
        <div class="po-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-file-invoice"></i>
                </div>
                <div>
                    <h2 class="section-title">ใบสั่งซื้อ (Purchase Orders)</h2>
                    <p class="section-subtitle">จัดการใบสั่งซื้อสินค้าเข้าสต็อก อนุมัติ และติดตามสถานะการสั่งซื้อ</p>
                </div>
            </div>

            <router-link :to="{ name: 'CreatePO' }" class="btn btn-primary">
                <i class="fas fa-plus"></i>
                <span>สร้างใบสั่งซื้อใหม่</span>
            </router-link>
        </div>

        <!-- Table Card -->
        <div class="table-card">
            <div class="table-card-header">
                <div>
                    <h3 class="card-title">รายการใบสั่งซื้อทั้งหมด</h3>
                    <p class="card-subtitle">ตรวจสอบและอนุมัติใบสั่งซื้อสินค้าเข้าคลัง</p>
                </div>
            </div>

            <div class="table-container">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th width="110">เลขที่ PO</th>
                            <th>ผู้สร้าง</th>
                            <th>ผู้จำหน่าย</th>
                            <th width="130" class="text-center">สถานะ</th>
                            <th>ผู้อนุมัติ</th>
                            <th width="130">วันที่สร้าง</th>
                            <th width="200" class="text-center">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="po in purchaseOrders" :key="po.id">
                            <td>
                                <span class="po-badge tabular-nums">PO-{{ po.id }}</span>
                            </td>
                            <td class="font-medium text-main">{{ po.creator?.fullname || 'N/A' }}</td>
                            <td>{{ po.supplier_name || '-' }}</td>
                            <td class="text-center">
                                <span :class="['stock-pill', po.status.toLowerCase() === 'approved' ? 'pill-high' : po.status.toLowerCase() === 'pending' ? 'pill-low' : 'pill-empty']">
                                    {{ po.status }}
                                </span>
                            </td>
                            <td class="text-muted">{{ po.approver?.fullname || '-' }}</td>
                            <td class="tabular-nums text-muted">{{ new Date(po.created_at).toLocaleDateString('th-TH') }}</td>
                            <td class="text-center">
                                <div class="action-btns-group" style="justify-content: center;">
                                    <button class="btn-icon view-btn" @click="openViewModal(po.id)" title="ดูรายละเอียด">
                                        <i class="fas fa-eye"></i>
                                    </button>

                                    <router-link
                                        :to="{ name: 'EditPO', params: { id: po.id } }"
                                        class="btn-icon edit-btn"
                                        v-if="po.status === 'Pending'"
                                        title="แก้ไข"
                                    >
                                        <i class="fas fa-pen"></i>
                                    </router-link>

                                    <button
                                        class="btn-icon approve-btn"
                                        @click="openApproveModal(po)"
                                        v-if="userStore.role === 'admin' && po.status === 'Pending'"
                                        title="อนุมัติ"
                                    >
                                        <i class="fas fa-check"></i>
                                    </button>

                                    <button
                                        class="btn-icon delete-btn"
                                        @click="openCancelModal(po)"
                                        v-if="po.status === 'Pending'"
                                        title="ยกเลิก"
                                    >
                                        <i class="fas fa-ban"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && purchaseOrders.length === 0">
                            <td colspan="7" class="text-center py-5 text-muted">
                                <div class="empty-state">
                                    <i class="fas fa-file-circle-xmark empty-icon"></i>
                                    <p class="empty-title">ไม่พบข้อมูลใบสั่งซื้อ</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="loading" class="text-center py-4 text-muted">
                <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </div>

            <div class="pagination-container" v-if="totalPages > 1" style="margin-top: 20px">
                <button class="pagination-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-indicator">หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button class="pagination-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <!-- Detail Modal -->
        <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-file-invoice"></i>
                        </div>
                        <div>
                            <h3>รายละเอียดใบสั่งซื้อ: PO-{{ selectedPO?.id }}</h3>
                            <span class="modal-subtitle">ตรวจสอบรายการและยอดรวมของใบสั่งซื้อ</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeViewModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="viewLoading" class="text-center py-4 text-muted">
                        <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
                    </div>
                    <div v-else-if="selectedPO">
                        <div class="info-grid-detail">
                            <div class="info-box">
                                <label>ผู้จำหน่าย:</label>
                                <span>{{ selectedPO.supplier_name }}</span>
                            </div>
                            <div class="info-box">
                                <label>สถานะ:</label>
                                <span :class="['stock-pill', selectedPO.status.toLowerCase() === 'approved' ? 'pill-high' : selectedPO.status.toLowerCase() === 'pending' ? 'pill-low' : 'pill-empty']">
                                    {{ selectedPO.status }}
                                </span>
                            </div>
                            <div class="info-box">
                                <label>ผู้สร้าง:</label>
                                <span>{{ selectedPO.creator?.fullname }}</span>
                            </div>
                            <div class="info-box">
                                <label>วันที่สร้าง:</label>
                                <span class="tabular-nums">{{ new Date(selectedPO.created_at).toLocaleString('th-TH') }}</span>
                            </div>
                            <div class="info-box full-span">
                                <label>หมายเหตุ:</label>
                                <span>{{ selectedPO.notes || '-' }}</span>
                            </div>
                        </div>

                        <div class="modal-table-wrap" style="margin-top: 20px;">
                            <table class="product-table modal-inner-table">
                                <thead>
                                    <tr>
                                        <th>สินค้า</th>
                                        <th class="text-right">จำนวน</th>
                                        <th class="text-right">ต้นทุน/หน่วย</th>
                                        <th class="text-right">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in selectedPO.items" :key="item.id">
                                        <td class="font-medium">{{ item.product?.description || item.product_id }}</td>
                                        <td class="text-right tabular-nums font-bold">{{ item.quantity }}</td>
                                        <td class="text-right tabular-nums">฿{{ Number(item.cost_price).toLocaleString() }}</td>
                                        <td class="text-right tabular-nums font-bold text-success">
                                            ฿{{ (item.quantity * item.cost_price).toLocaleString() }}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-right font-bold">ยอดรวมสุทธิทั้งสิ้น:</td>
                                        <td class="text-right tabular-nums font-bold text-success" style="font-size: 1.15rem;">
                                            ฿{{ calculateTotal(selectedPO.items) }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeViewModal">ปิดหน้าต่าง</button>
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
const currentPage = ref(1);
const totalPages = ref(1);
const perPage = ref(20);

// State สำหรับ Modal ดูรายละเอียด
const showViewModal = ref(false);
const selectedPO = ref(null);
const viewLoading = ref(false);

const fetchPurchaseOrders = async (page = currentPage.value) => {
    loading.value = true;
    currentPage.value = page;
    try {
        const res = await axios.get('/purchase-orders', {
            params: {
                page: currentPage.value,
                perPage: perPage.value
            }
        });
        purchaseOrders.value = res.data.data || res.data; // เผื่อโครงสร้าง api ต่างกัน
        totalPages.value = res.data.meta?.last_page || 1;
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูล PO ได้', 'error');
        console.error("Fetch PO Error:", error);
    } finally {
        loading.value = false;
    }
};

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchPurchaseOrders(page);
    }
};

onMounted(() => {
    fetchPurchaseOrders();
});

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
.po-view-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.po-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-title-box {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.section-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0.2rem 0 0 0;
}

.table-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.po-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #f1f5f9;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-main);
}

.action-btns-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.15s ease;
    text-decoration: none;
}

.btn-icon:hover {
    transform: translateY(-1px);
}

.view-btn {
    background: #eff6ff;
    color: #2563eb;
}
.view-btn:hover {
    background: #dbeafe;
}

.edit-btn {
    background: #fef3c7;
    color: #b45309;
}
.edit-btn:hover {
    background: #fde68a;
}

.approve-btn {
    background: #ecfdf5;
    color: #059669;
}
.approve-btn:hover {
    background: #d1fae5;
}

.delete-btn {
    background: #fef2f2;
    color: #dc2626;
}
.delete-btn:hover {
    background: #fee2e2;
}

/* Modal */
.info-grid-detail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.info-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-box.full-span {
    grid-column: 1 / -1;
}

.info-box label {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
}

.info-box span {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.empty-icon {
    font-size: 2.5rem;
    color: #cbd5e1;
}

.empty-title {
    font-size: 0.95rem;
    color: #64748b;
    margin: 0;
}
</style>