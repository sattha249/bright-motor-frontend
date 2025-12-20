<template>
    <div class="main-content-container">
        <h2 class="section-title"><i class="fas fa-chart-pie"></i> รายงานสรุปเครดิต</h2>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">สถานะเครดิตรายบุคคล (รถ/คนขับ)</h3>
                <button class="primary-btn" @click="fetchCreditSummary">
                    <i class="fas fa-sync-alt"></i> รีเฟรช
                </button>
            </div>

            <div class="table-responsive">
                <table class="data-table hover-table">
                    <thead>
                        <tr>
                            <th>ชื่อ (รถ/คนขับ)</th>
                            <th class="text-right text-red pr-custom">ยอดค้างชำระ</th>
                            <th class="text-right text-red pr-custom">จำนวนบิลค้าง</th>
                            <th class="text-right text-orange pr-custom">ดอกเบี้ยค้าง</th>
                            <th class="text-right text-green pr-custom">เก็บเงินแล้ว</th>
                            <th class="text-right text-green pr-custom">บิลที่จบแล้ว</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in summaryData" :key="index" @click="openCreditListModal(item)"
                            class="cursor-pointer">
                            <td class="font-bold">
                                <span class="click-indicator">{{ item.truck_name }} <i
                                        class="fas fa-search-plus"></i></span>
                            </td>
                            <td class="text-right font-bold text-red pr-custom">{{
                                formatCurrency(item.total_unpaid_amount) }}</td>
                            <td class="text-right pr-custom">{{ item.count_unpaid_bills }} บิล</td>
                            <td class="text-right pr-custom">{{ formatCurrency(item.total_unpaid_interest) }}</td>
                            <td class="text-right text-green pr-custom">{{ formatCurrency(item.total_paid_amount) }}
                            </td>
                            <td class="text-right pr-custom">{{ item.count_paid_bills }} บิล</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="loading" class="loading-indicator">กำลังโหลดข้อมูล...</div>
        </div>

        <div v-if="showListModal" class="modal-overlay z-list" @click.self="closeListModal">
            <div class="modal large-modal">
                <div class="modal-header">
                    <h3>รายการบิลค้างชำระ: {{ selectedName }}</h3>
                    <button class="close-icon-btn" @click="closeListModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="listLoading" class="loading-indicator">กำลังโหลดรายการ...</div>
                    <div v-else>
                        <div class="table-responsive">
                            <table class="data-table detail-table">
                                <thead>
                                    <tr>
                                        <th>วันที่บิล</th>
                                        <th>เลขที่เอกสาร</th>
                                        <th>ลูกค้า</th>
                                        <th class="text-right pr-custom">ยอดคงเหลือ</th>
                                        <th>สถานะ</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="bill in creditList" :key="bill.id">
                                        <td>{{ new Date(bill.created_at).toLocaleDateString('th-TH') }}</td>
                                        <td>{{ bill.bill_no }}</td>
                                        <td>{{ bill.customer?.name || '-' }}</td>
                                        <td class=" font-bold text-red pr-custom">{{
                                            formatCurrency(bill.pending_amount) }}</td>
                                        <td>
                                            <span :class="['status-badge', bill.is_paid ? 'paid' : 'unpaid']">
                                                {{ bill.is_paid ? 'ชำระแล้ว' : 'ค้างชำระ' }}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="action-btn pay-btn" @click="openPaymentSummaryModal(bill.id)"
                                                :disabled="bill.is_paid">
                                                <i class="fas fa-money-bill-wave"></i> ชำระ
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="pagination" v-if="listMeta && listMeta.last_page > 1">
                            <button @click="fetchCreditList(listMeta.current_page - 1)"
                                :disabled="listMeta.current_page === 1">ก่อนหน้า</button>
                            <span>หน้า {{ listMeta.current_page }} / {{ listMeta.last_page }}</span>
                            <button @click="fetchCreditList(listMeta.current_page + 1)"
                                :disabled="listMeta.current_page === listMeta.last_page">ถัดไป</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" @click="closeListModal">ปิดหน้าต่าง</button>
                </div>
            </div>
        </div>

        <div v-if="showPaymentModal" class="modal-overlay z-payment" @click.self="closePaymentModal">
            <div class="modal small-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-cash-register"></i> สรุปยอดชำระ</h3>
                    <button class="close-icon-btn" @click="closePaymentModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div v-if="paymentLoading" class="loading-indicator">
                        กำลังดึงข้อมูลล่าสุด...
                    </div>
                    <div v-else-if="selectedBillDetail" class="payment-summary-content">

                        <div class="summary-row">
                            <span class="label">เลขที่เอกสาร:</span>
                            <span class="value">{{ selectedBillDetail.bill_no }}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">ลูกค้า:</span>
                            <span class="value">{{ selectedBillDetail.customer?.name }}</span>
                        </div>

                        <div class="items-summary-box"
                            v-if="selectedBillDetail.items && selectedBillDetail.items.length > 0">
                            <p class="items-header">รายการสินค้า:</p>
                            <ul>
                                <li v-for="item in selectedBillDetail.items" :key="item.id" class="item-row">
                                    <div class="item-left">
                                        <span class="dash">-</span>
                                        <span>SKU: {{ item.product_id }}</span>
                                        <span class="qty-badge">x{{ item.quantity }}</span>
                                        <span class="item-price-tag">
                                            ({{ formatCurrency(item.quantity * item.sold_price) }})
                                        </span>
                                    </div>
                                    <div class="item-right">
                                        <i v-if="checkIsPaid(item.is_paid)" class="fas fa-check-circle text-green"></i>
                                        <i v-else class="fas fa-times-circle text-red"></i>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <hr class="divider">

                        <div class="summary-row">
                            <span class="label">ยอดเงินต้นคงเหลือ:</span>
                            <span class="value">{{ formatCurrency(selectedBillDetail.pending_amount) }}</span>
                        </div>

                        <div class="summary-row highlight-row">
                            <span class="label">ดอกเบี้ย (Interest):</span>
                            <span class="value text-orange">+ {{ formatCurrency(selectedBillDetail.interest) }}</span>
                        </div>

                        <hr class="divider">

                        <div class="summary-row total-row">
                            <span class="label">ยอดชำระสุทธิ:</span>
                            <span class="value text-green">
                                {{ formatCurrency(Number(selectedBillDetail.pending_amount) +
                                    Number(selectedBillDetail.interest)) }}
                            </span>
                        </div>

                    </div>
                </div>

                <div class="modal-footer space-between">
                    <button class="cancel-btn" @click="closePaymentModal">ปิด (ยกเลิก)</button>
                    <button class="confirm-pay-btn" @click="processPayment"
                        :disabled="paymentLoading || checkIsPaid(selectedBillDetail?.is_paid)">
                        <i class="fas fa-check-circle"></i> ยืนยันชำระเงิน
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

const showListModal = ref(false);
const selectedName = ref('');
const creditList = ref([]);
const listLoading = ref(false);
const listMeta = ref(null);

const showPaymentModal = ref(false);
const paymentLoading = ref(false);
const selectedBillDetail = ref(null);

// Helper
const formatCurrency = (val) => {
    return Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const checkIsPaid = (status) => {
    // เช็คครอบคลุมทั้ง number (1), string ('1'), และ boolean (true)
    console.log('is_paid status:', status);
    return status === 1 || status === '1' || status === true;
};
// 1. Fetch Summary
const fetchCreditSummary = async () => {
    loading.value = true;
    try {
        const res = await axios.get('/sell-logs/credit/summary');
        summaryData.value = res.data;
    } catch (error) {
        Swal.fire('Error', 'โหลดข้อมูลสรุปไม่สำเร็จ', 'error');
    } finally {
        loading.value = false;
    }
};

// 2. Open List Modal
const openCreditListModal = (item) => {
    selectedName.value = item.truck_name;
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
            params: { page, per_page: 10, search: selectedName.value }
        });
        creditList.value = res.data.data;
        listMeta.value = res.data.meta;
    } catch (error) {
        Swal.fire('Error', 'โหลดรายการบิลไม่สำเร็จ', 'error');
    } finally {
        listLoading.value = false;
    }
};

// 3. Open Payment Modal
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

// 4. Process Payment (API Integration)
const processPayment = () => {
    // คำนวณยอดรวมเพื่อแสดงใน Swal
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
            paymentLoading.value = true; // ล็อกปุ่ม
            try {
                // [API] ยิง API ตัดยอด
                await axios.post(`/sell-logs/credit/${selectedBillDetail.value.id}/pay`);

                Swal.fire({
                    icon: 'success',
                    title: 'ชำระเงินสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });

                closePaymentModal();
                fetchCreditList(listMeta.value.current_page); // รีเฟรชรายการใน Modal 1
                fetchCreditSummary(); // รีเฟรชหน้าหลัก

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
/* ... Styles เดิม ... */
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
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
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
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
}

.data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    text-align: left;
}

.hover-table tbody tr:hover {
    background-color: #f1f5f9;
}

.cursor-pointer {
    cursor: pointer;
}

/* Utilities */
.text-right {
    text-align: right;
}

.text-center {
    text-align: center;
}

.text-red {
    color: #e53e3e;
}

.text-green {
    color: #28a745;
}

.text-orange {
    color: #dd6b20;
}

.font-bold {
    font-weight: bold;
}

/* [แก้ไข] Custom Padding ขวา เพื่อขยับข้อมูลเข้ามา */
.pr-custom {
    padding-right: 2.5rem !important;
}

/* Modals */
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
}

/* [แก้ไข] Z-Index: ลดค่าลงเพื่อให้ SweetAlert (1060) อยู่เหนือกว่า */
.z-list {
    z-index: 900;
}

.z-payment {
    z-index: 950;
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
    max-width: 1000px;
}

.small-modal {
    width: 90%;
    max-width: 500px;
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
    gap: 10px;
}

.modal-footer.space-between {
    justify-content: space-between;
}

.close-icon-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
}

/* Item List Styling */
.items-summary-box {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 10px 15px;
    margin: 15px 0;
    border: 1px solid #eee;
}

.items-header {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 0.95rem;
    color: #555;
}

.items-summary-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px dashed #e0e0e0;
    font-size: 0.9rem;
}

.item-row:last-child {
    border-bottom: none;
}

.item-left {
    display: flex;
    align-items: center;
    padding-left: 15px;
}

/* [แก้ไข] Tab เข้าไป */
.dash {
    margin-right: 8px;
    color: #888;
    font-weight: bold;
}

/* เครื่องหมาย - */
.item-right {
    text-align: right;
    min-width: 30px;
    display: flex;
    justify-content: flex-end;
}

/* [แก้ไข] ชิดขวาสุด */

/* Buttons */
.action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: white;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.pay-btn {
    background-color: #3182ce;
}

.pay-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
}

.pay-btn:hover:not(:disabled) {
    background-color: #2b6cb0;
}

.cancel-btn {
    background-color: #718096;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
}

.confirm-pay-btn {
    background-color: #38a169;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
}

/* Status Badges */
.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
}

.status-badge.paid {
    background-color: #48bb78;
}

.status-badge.unpaid {
    background-color: #e53e3e;
}

.click-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary-color);
}

/* Loading & Pagination */
.loading-indicator {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 1.5rem;
    align-items: center;
}

.pagination button {
    background-color: var(--secondary-color);
    color: #4a5568;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
}

.pagination button:disabled {
    background-color: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
}

/* Summary Rows */
.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.summary-row .label {
    color: #666;
    font-weight: 500;
}

.summary-row .value {
    font-weight: 600;
    font-size: 1.1rem;
}

.highlight-row {
    background-color: #fffaf0;
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #feeebb;
}

.divider {
    border: 0;
    border-top: 1px dashed #ccc;
    margin: 15px 0;
}

.total-row .label {
    font-size: 1.2rem;
    font-weight: bold;
}

.total-row .value {
    font-size: 1.5rem;
    font-weight: bold;
}

.text-muted {
    color: #888;
    font-size: 0.85rem;
    margin-left: 5px;
}

.qty-badge {
    background-color: #e2e8f0;
    color: #4a5568;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin: 0 5px;
    font-weight: 600;
}

.item-price-tag {
    color: #2d3748;
    font-weight: 500;
    font-size: 0.9rem;
}

/* ปรับ Flex ให้รองรับเนื้อหาที่ยาวขึ้น */
.item-left {
    display: flex;
    align-items: center;
    padding-left: 15px;
    flex-wrap: wrap;
    /* เผื่อหน้าจอเล็ก */
    gap: 2px;
}
</style>