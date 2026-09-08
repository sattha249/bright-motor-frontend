<template>
    <div class="credit-view-container">
        <!-- Header Banner -->
        <div class="credit-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-coins"></i>
                </div>
                <div>
                    <h2 class="section-title">รายงานสรุปเครดิต (Credit Summary)</h2>
                    <p class="section-subtitle">ตรวจสอบสถานะยอดค้างชำระ บิลเครดิต ดอกเบี้ย และบันทึกการชำระเงิน</p>
                </div>
            </div>

            <div class="credit-header-actions">
                <div class="toggle-container">
                    <button
                        :class="['toggle-btn', { active: viewMode === 'truck' }]"
                        @click="changeViewMode('truck')"
                    >
                        <i class="fas fa-truck"></i> รถ/คนขับ
                    </button>
                    <button
                        :class="['toggle-btn', { active: viewMode === 'customer' }]"
                        @click="changeViewMode('customer')"
                    >
                        <i class="fas fa-users"></i> ลูกค้า
                    </button>
                </div>

                <button class="btn btn-secondary" @click="fetchCreditSummary">
                    <i class="fas fa-sync-alt"></i>
                    <span>รีเฟรช</span>
                </button>
            </div>
        </div>

        <!-- Main Summary Table Card -->
        <div class="table-card">
            <div class="table-card-header">
                <div>
                    <h3 class="card-title">
                        สรุปยอดเครดิต: {{ viewMode === 'truck' ? 'แยกตามรถ / คนขับ' : 'แยกตามลูกค้า' }}
                    </h3>
                    <p class="card-subtitle">คลิกที่แถวรายการเพื่อดูบิลค้างชำระและจัดการรับชำระเงิน</p>
                </div>
            </div>

            <div class="table-container">
                <table class="product-table hover-table">
                    <thead>
                        <tr>
                            <th>{{ viewMode === 'truck' ? 'ชื่อ (รถ/คนขับ)' : 'ชื่อลูกค้า' }}</th>
                            <th class="text-right">ยอดค้างชำระ</th>
                            <th class="text-right">จำนวนบิลค้าง</th>
                            <th class="text-right">ดอกเบี้ยค้าง</th>
                            <th class="text-right">เก็บเงินแล้ว</th>
                            <th class="text-right">บิลที่จบแล้ว</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in summaryData"
                            :key="index"
                            @click="openCreditListModal(item)"
                            class="cursor-pointer row-hover-effect"
                        >
                            <td class="font-bold">
                                <span class="group-name-link">
                                    {{ item.group_name }}
                                    <i class="fas fa-arrow-up-right-from-square open-icon"></i>
                                </span>
                            </td>
                            <td class="text-right font-bold text-danger tabular-nums" style="font-size: 1rem;">
                                ฿{{ formatCurrency(item.total_unpaid_amount) }}
                            </td>
                            <td class="text-right tabular-nums">
                                <span class="stock-pill pill-low">{{ item.count_unpaid_bills }} บิล</span>
                            </td>
                            <td class="text-right tabular-nums text-warning font-semibold">
                                ฿{{ formatCurrency(item.total_unpaid_interest) }}
                            </td>
                            <td class="text-right font-bold text-success tabular-nums">
                                ฿{{ formatCurrency(item.total_paid_amount) }}
                            </td>
                            <td class="text-right tabular-nums">
                                <span class="stock-pill pill-high">{{ item.count_paid_bills }} บิล</span>
                            </td>
                        </tr>
                        <tr v-if="summaryData.length === 0 && !loading">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <div class="empty-state">
                                    <i class="fas fa-wallet empty-icon"></i>
                                    <p class="empty-title">ไม่พบข้อมูลสรุปเครดิต</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="loading" class="text-center py-4 text-muted">
                <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </div>
        </div>

        <!-- List Modal (Bills in credit) -->
        <div v-if="showListModal" class="modal-overlay z-list" @click.self="closeListModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-list-check"></i>
                        </div>
                        <div>
                            <h3>รายการบิลค้างชำระ: {{ selectedName }}</h3>
                            <span class="modal-subtitle">รายการบิลที่ยังมียอดค้างชำระ</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeListModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="listLoading" class="text-center py-4 text-muted">
                        <i class="fas fa-spinner fa-spin"></i> กำลังโหลดรายการ...
                    </div>
                    <div v-else>
                        <div class="modal-table-wrap">
                            <table class="product-table modal-inner-table">
                                <thead>
                                    <tr>
                                        <th width="120">วันที่บิล</th>
                                        <th width="150">เลขที่เอกสาร</th>
                                        <th>ลูกค้า</th>
                                        <th class="text-right" width="140">ยอดคงเหลือ</th>
                                        <th class="text-center" width="110">สถานะ</th>
                                        <th class="text-center" width="100">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="bill in creditList" :key="bill.id">
                                        <td class="tabular-nums text-muted">{{ new Date(bill.created_at).toLocaleDateString('th-TH') }}</td>
                                        <td>
                                            <span class="bill-badge tabular-nums">{{ bill.bill_no }}</span>
                                        </td>
                                        <td class="font-medium text-main">{{ bill.customer?.name || '-' }}</td>
                                        <td class="font-bold text-danger text-right tabular-nums">
                                            ฿{{ formatCurrency(bill.pending_amount) }}
                                        </td>
                                        <td class="text-center">
                                            <span :class="['stock-pill', bill.is_paid ? 'pill-high' : 'pill-empty']">
                                                {{ bill.is_paid ? 'ชำระแล้ว' : 'ค้างชำระ' }}
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <button
                                                class="btn btn-primary btn-sm"
                                                @click="openPaymentSummaryModal(bill.id)"
                                                :disabled="bill.is_paid"
                                            >
                                                <i class="fas fa-hand-holding-dollar"></i> ชำระ
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="creditList.length === 0">
                                        <td colspan="6" class="text-center py-4 text-muted">
                                            ไม่พบรายการบิลค้างชำระ
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="pagination-container" v-if="listMeta && listMeta.last_page > 1" style="margin-top: 16px;">
                            <button
                                class="pagination-btn"
                                @click="fetchCreditList(listMeta.current_page - 1)"
                                :disabled="listMeta.current_page === 1"
                            >
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="page-indicator">หน้า {{ listMeta.current_page }} / {{ listMeta.last_page }}</span>
                            <button
                                class="pagination-btn"
                                @click="fetchCreditList(listMeta.current_page + 1)"
                                :disabled="listMeta.current_page === listMeta.last_page"
                            >
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeListModal">ปิดหน้าต่าง</button>
                </div>
            </div>
        </div>

        <!-- Payment Confirmation Modal -->
        <div v-if="showPaymentModal" class="modal-overlay z-payment" @click.self="closePaymentModal">
            <div class="modal modal-md">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-cash-register"></i>
                        </div>
                        <div>
                            <h3>สรุปยอดชำระเงิน</h3>
                            <span class="modal-subtitle">ยืนยันการรับชำระเงินปิดบิลเครดิต</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closePaymentModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="paymentLoading" class="text-center py-4 text-muted">
                        <i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูลล่าสุด...
                    </div>
                    <div v-else-if="selectedBillDetail" class="payment-summary-content">
                        <div class="detail-summary-card">
                            <div class="summary-line">
                                <span>เลขที่เอกสาร:</span>
                                <span class="font-bold tabular-nums">{{ selectedBillDetail.bill_no }}</span>
                            </div>
                            <div class="summary-line">
                                <span>ลูกค้า:</span>
                                <span class="font-bold">{{ selectedBillDetail.customer?.name }}</span>
                            </div>
                        </div>

                        <div class="items-summary-box" v-if="selectedBillDetail.items && selectedBillDetail.items.length > 0">
                            <p class="items-header font-semibold text-sm">รายการสินค้าในบิล:</p>
                            <ul class="items-list">
                                <li v-for="item in selectedBillDetail.items" :key="item.id" class="item-row">
                                    <div class="item-left">
                                        <span class="font-medium">SKU: {{ item.product_id }}</span>
                                        <span class="qty-badge tabular-nums">x{{ item.quantity }}</span>
                                        <span class="item-price-tag tabular-nums">
                                            (฿{{ formatCurrency(item.quantity * item.sold_price) }})
                                        </span>
                                    </div>
                                    <div class="item-right">
                                        <i v-if="checkIsPaid(item.is_paid)" class="fas fa-check-circle text-success"></i>
                                        <i v-else class="fas fa-times-circle text-danger"></i>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="payment-calc-card">
                            <div class="summary-line">
                                <span>ยอดเงินต้นคงเหลือ:</span>
                                <span class="font-bold tabular-nums">฿{{ formatCurrency(selectedBillDetail.pending_amount) }}</span>
                            </div>

                            <div class="summary-line text-warning">
                                <span>ดอกเบี้ย (Interest):</span>
                                <span class="font-bold tabular-nums">+ ฿{{ formatCurrency(selectedBillDetail.interest) }}</span>
                            </div>

                            <div class="summary-line grand-total-line">
                                <span>ยอดชำระสุทธิทั้งสิ้น:</span>
                                <span class="grand-total-price tabular-nums">
                                    ฿{{ formatCurrency(Number(selectedBillDetail.pending_amount) + Number(selectedBillDetail.interest)) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="justify-content: space-between;">
                    <button class="btn btn-secondary" @click="closePaymentModal">ยกเลิก</button>
                    <button
                        class="btn btn-primary"
                        @click="processPayment"
                        :disabled="paymentLoading || checkIsPaid(selectedBillDetail?.is_paid)"
                    >
                        <i class="fas fa-check-circle"></i>
                        <span>ยืนยันชำระเงิน</span>
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

// --- State Variables ---
const summaryData = ref([]);
const loading = ref(false);
const viewMode = ref('truck'); // 'truck' or 'customer'

// State Modals
const showListModal = ref(false);
const selectedName = ref('');
const creditList = ref([]);
const listLoading = ref(false);
const listMeta = ref(null);

const showPaymentModal = ref(false);
const paymentLoading = ref(false);
const selectedBillDetail = ref(null);

// Helper Functions
const formatCurrency = (val) => {
    return Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const checkIsPaid = (status) => {
    return status === 1 || status === '1' || status === true;
};

// Toggle Function
const changeViewMode = (mode) => {
    if (viewMode.value !== mode) {
        viewMode.value = mode;
        fetchCreditSummary();
    }
};

// 1. Fetch Summary
const fetchCreditSummary = async () => {
    loading.value = true;
    try {
        const res = await axios.get('/sell-logs/credit/summary', {
            params: { groupBy: viewMode.value }
        });
        summaryData.value = res.data;
    } catch (error) {
        Swal.fire('Error', 'โหลดข้อมูลสรุปไม่สำเร็จ', 'error');
    } finally {
        loading.value = false;
    }
};

// 2. Open List Modal
const openCreditListModal = (item) => {
    // ใช้ group_name ตามที่ Backend ส่งมาใหม่
    selectedName.value = item.group_name || 'ไม่ระบุ';
    showListModal.value = true;
    fetchCreditList(1);
};

const closeListModal = () => {
    showListModal.value = false;
    creditList.value = [];
};

const fetchCreditList = async (page = 1) => {
    listLoading.value = true;
    try {
        const res = await axios.get('/sell-logs/credit', {
            params: {
                page,
                per_page: 10,
                search: selectedName.value,
                filterType: viewMode.value // ส่ง filterType ไปบอก Backend ว่าค้นหาจากอะไร
            }
        });
        creditList.value = res.data.data;
        listMeta.value = res.data.meta;
    } catch (error) {
        Swal.fire('Error', 'โหลดรายการบิลไม่สำเร็จ', 'error');
    } finally {
        listLoading.value = false;
    }
};

// 3. Open Payment Modal & Logic (เหมือนเดิม)
const openPaymentSummaryModal = async (billId) => {
    showPaymentModal.value = true;
    paymentLoading.value = true;
    selectedBillDetail.value = null;

    try {
        const res = await axios.get(`/sell-logs/credit/${billId}`);
        selectedBillDetail.value = res.data;
    } catch (error) {
        Swal.fire('Error', 'ดึงข้อมูลบิลไม่สำเร็จ', 'error');
        showPaymentModal.value = false;
    } finally {
        paymentLoading.value = false;
    }
};

const closePaymentModal = () => {
    showPaymentModal.value = false;
    selectedBillDetail.value = null;
};

const processPayment = () => {
    const totalPay = Number(selectedBillDetail.value.pending_amount) + Number(selectedBillDetail.value.interest);

    Swal.fire({
        title: 'ยืนยันการชำระเงิน?',
        text: `ยอดรวม ${formatCurrency(totalPay)} บาท`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ชำระเงิน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#38a169',
        cancelButtonColor: '#718096',
        reverseButtons: true
    }).then(async (result) => {
        if (result.isConfirmed) {
            paymentLoading.value = true;
            try {
                await axios.post(`/sell-logs/credit/${selectedBillDetail.value.id}/pay`);

                Swal.fire({
                    icon: 'success',
                    title: 'ชำระเงินสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });

                closePaymentModal();
                fetchCreditList(listMeta.value.current_page);
                fetchCreditSummary();

            } catch (error) {
                console.error(error);
                let msg = 'เกิดข้อผิดพลาดในการชำระเงิน';
                if (error.response && error.response.data && error.response.data.message) {
                    msg = error.response.data.message;
                }
                Swal.fire('Error', msg, 'error');
            } finally {
                paymentLoading.value = false;
            }
        }
    });
};

onMounted(fetchCreditSummary);
</script>

<style scoped>
.credit-view-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.page-header-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.header-content-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-left-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.page-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.15));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.page-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.page-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.2rem 0 0 0;
}

/* Modern segmented toggle */
.toggle-pill-container {
    display: inline-flex;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 3px;
    gap: 4px;
}

.toggle-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.toggle-pill-btn.active {
    background: var(--surface);
    color: var(--primary);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
}

.toggle-pill-btn:hover:not(.active) {
    color: var(--text-primary);
}

/* Table interactions */
.group-name-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary);
    font-weight: 600;
    transition: color var(--transition-fast);
}

.group-name-link:hover {
    color: var(--primary-hover);
    text-decoration: underline;
}

.group-name-link i {
    font-size: 0.8rem;
    opacity: 0.6;
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

/* Modals */
.z-list {
    z-index: 1050 !important;
}

.z-payment {
    z-index: 1060 !important;
}

.detail-summary-card {
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
    padding: 0.35rem 0;
}

.items-summary-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0.85rem 1rem;
    margin-bottom: 1rem;
}

.items-header {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.items-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 0;
    border-bottom: 1px dashed var(--border);
    font-size: 0.85rem;
}

.item-row:last-child {
    border-bottom: none;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.qty-badge {
    background: var(--bg-main);
    color: var(--text-secondary);
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid var(--border);
}

.item-price-tag {
    color: var(--text-muted);
    font-size: 0.8rem;
}

.payment-calc-card {
    background: linear-gradient(145deg, rgba(37, 99, 235, 0.03), rgba(99, 102, 241, 0.06));
    border: 1px solid rgba(37, 99, 235, 0.15);
    border-radius: var(--radius-lg);
    padding: 1rem 1.25rem;
}

.grand-total-line {
    border-top: 1px dashed rgba(37, 99, 235, 0.2);
    margin-top: 0.5rem;
    padding-top: 0.75rem;
}

.grand-total-price {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--success);
}

@media (max-width: 768px) {
    .header-content-wrap {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .toggle-pill-container {
        width: 100%;
    }
    
    .toggle-pill-btn {
        flex: 1;
        justify-content: center;
    }
}
</style>