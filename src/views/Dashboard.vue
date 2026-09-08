<template>
    <div class="dashboard-page">
        <!-- Stat Widgets -->
        <div class="dashboard-widgets">
            <div class="widget-card">
                <div class="widget-icon-box blue">
                    <i class="fas fa-boxes-stacked"></i>
                </div>
                <div class="widget-content">
                    <span class="widget-label">จำนวนสินค้าทั้งหมด</span>
                    <p class="widget-value tabular-nums">{{ totalProducts }}</p>
                    <span class="widget-sub">รายการทั้งหมดในระบบ</span>
                </div>
            </div>

            <div class="widget-card">
                <div class="widget-icon-box cyan">
                    <i class="fas fa-warehouse"></i>
                </div>
                <div class="widget-content">
                    <span class="widget-label">สินค้าพร้อมจำหน่าย</span>
                    <p class="widget-value tabular-nums">{{ totalProductsInStock }}</p>
                    <span class="widget-sub">มีพร้อมในโกดังหลัก</span>
                </div>
            </div>

            <div class="widget-card">
                <div class="widget-icon-box green">
                    <i class="fas fa-sack-dollar"></i>
                </div>
                <div class="widget-content">
                    <span class="widget-label">ยอดขายเดือนนี้</span>
                    <p class="widget-value green-text tabular-nums">{{ formatCurrency(totalSales) }}</p>
                    <span class="widget-sub">รายรับประจำรอบเดือนนี้</span>
                </div>
            </div>

            <div class="widget-card">
                <div class="widget-icon-box amber">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="widget-content">
                    <span class="widget-label">ส่วนลดเดือนนี้</span>
                    <p class="widget-value amber-text tabular-nums">{{ formatCurrency(totalDiscount) }}</p>
                    <span class="widget-sub">ยอดส่วนลดที่อนุมัติ</span>
                </div>
            </div>
        </div>

        <!-- Sell Logs Table Section -->
        <div class="table-card">
            <div class="table-header-row">
                <div>
                    <h2 class="section-title">
                        <i class="fas fa-clock-rotate-left"></i>
                        <span>รายการขายล่าสุด</span>
                    </h2>
                    <p class="section-subtitle">คลิกที่แถวรายการเพื่อดูรายละเอียดสินค้าและข้อมูลลูกค้า</p>
                </div>
            </div>

            <div class="table-responsive">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>เลขที่บิล</th>
                            <th>ลูกค้า</th>
                            <th>รถขนส่ง</th>
                            <th class="text-right">ยอดรวม</th>
                            <th class="text-right">ส่วนลด</th>
                            <th class="text-right">ยอดสุทธิ</th>
                            <th>วันที่ขาย</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in paginatedLogs" :key="log.id" @click="openModal(log)" class="clickable-row">
                            <td>
                                <span class="bill-chip">{{ log.bill_no }}</span>
                            </td>
                            <td class="font-medium">{{ log.customer?.name || '-' }}</td>
                            <td>
                                <span class="truck-pill">
                                    <i class="fas fa-truck"></i>
                                    {{ log.truck?.plate_number || 'โกดัง' }}
                                </span>
                            </td>
                            <td class="text-right tabular-nums">{{ formatCurrency(log.total_price) }}</td>
                            <td class="text-right tabular-nums text-danger font-medium">
                                {{ log.total_discount > 0 ? '-' + formatCurrency(log.total_discount) : '0.00 บาท' }}
                            </td>
                            <td class="text-right tabular-nums text-success font-bold">
                                {{ formatCurrency(log.total_sold_price) }}
                            </td>
                            <td class="text-muted text-sm">{{ formatDate(log.created_at) }}</td>
                        </tr>
                        <tr v-if="paginatedLogs.length === 0">
                            <td colspan="7" class="empty-state">
                                <i class="fas fa-inbox"></i>
                                <p>ไม่พบรายการขายล่าสุด</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="totalPages > 1">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
                    <i class="fas fa-chevron-left"></i>
                    <span>ก่อนหน้า</span>
                </button>
                <div class="page-numbers">
                    <button 
                        v-for="p in totalPages" 
                        :key="p" 
                        :class="['page-num-btn', { active: p === currentPage }]" 
                        @click="goToPage(p)"
                    >
                        {{ p }}
                    </button>
                </div>
                <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">
                    <span>ถัดไป</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <!-- Bill Detail Modal -->
        <div v-if="selectedLog" class="modal-overlay" @click.self="closeModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div>
                            <h3>รายละเอียดบิล {{ selectedLog.bill_no }}</h3>
                            <span class="modal-subtitle">บันทึกเมื่อ {{ formatDate(selectedLog.created_at) }}</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeModal">&times;</button>
                </div>

                <div class="modal-body">
                    <!-- Customer Detail Box -->
                    <div class="customer-info-box" v-if="selectedLog.customer">
                        <div class="info-box-title">
                            <i class="fas fa-user-tag"></i>
                            <span>ข้อมูลลูกค้า</span>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">ชื่อลูกค้า:</span>
                                <span class="value">{{ selectedLog.customer.name }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">เบอร์โทรศัพท์:</span>
                                <span class="value">{{ selectedLog.customer.tel || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">อีเมล:</span>
                                <span class="value">{{ selectedLog.customer.email || '-' }}</span>
                            </div>
                            <div class="info-item full-span">
                                <span class="label">ที่อยู่:</span>
                                <span class="value">
                                    {{ selectedLog.customer.address }} 
                                    {{ selectedLog.customer.district ? 'อ.' + selectedLog.customer.district : '' }} 
                                    {{ selectedLog.customer.provice ? 'จ.' + selectedLog.customer.provice : '' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div class="modal-table-wrap">
                        <table class="product-table modal-inner-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>ชื่อสินค้า</th>
                                    <th class="text-right">จำนวน</th>
                                    <th class="text-right">ราคา/หน่วย</th>
                                    <th class="text-right">ส่วนลด/หน่วย</th>
                                    <th class="text-right">ราคาสุทธิ/หน่วย</th>
                                    <th class="text-right">รวมสุทธิ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedLog.items" :key="item.id">
                                    <td class="text-muted text-sm">{{ item.product_id }}</td>
                                    <td class="font-medium">{{ item.product?.description || '-' }}</td>
                                    <td class="text-right tabular-nums">{{ item.quantity }}</td>
                                    <td class="text-right tabular-nums">{{ formatCurrency(item.price) }}</td>
                                    <td class="text-right tabular-nums text-danger">
                                        {{ item.discount > 0 ? '-' + formatCurrency(item.discount) : '0.00' }}
                                    </td>
                                    <td class="text-right tabular-nums">{{ formatCurrency(item.sold_price) }}</td>
                                    <td class="text-right tabular-nums font-bold text-success">
                                        {{ formatCurrency(item.quantity * item.sold_price) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Bill Summary Footer -->
                    <div class="bill-summary-bar">
                        <div class="summary-stat">
                            <span>ราคารวมสินค้า</span>
                            <strong>{{ formatCurrency(selectedLog.total_price) }}</strong>
                        </div>
                        <div class="summary-stat danger">
                            <span>ส่วนลดทั้งหมด</span>
                            <strong>-{{ formatCurrency(selectedLog.total_discount) }}</strong>
                        </div>
                        <div class="summary-stat highlight">
                            <span>ยอดสุทธิทั้งสิ้น</span>
                            <strong>{{ formatCurrency(selectedLog.total_sold_price) }}</strong>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button @click="closeModal" class="btn btn-secondary">
                        <i class="fas fa-xmark"></i>
                        <span>ปิดหน้าต่าง</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/lib/axios'

const sellLogs = ref([])
const totalSales = ref(0)
const totalDiscount = ref(0)
const totalProducts = ref(0)
const totalProductsInStock = ref(0)

const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => {
    return Math.ceil(sellLogs.value.length / itemsPerPage)
})

const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return sellLogs.value.slice(start, start + itemsPerPage)
})

onMounted(async () => {
    try {
        await fetchSellLogs()
        await fetchSummary()
    } catch (err) {
        console.error('Error fetching sell-logs:', err)
    }
})

async function fetchSummary() {
    const { data } = await axios.get('/sell-logs/summary')
    totalSales.value = data.totalSales
    totalDiscount.value = data.totalDiscount
    totalProducts.value = data.totalProduct
    totalProductsInStock.value = data.totalProductInStock
}

async function fetchSellLogs() {
    const res = await axios.get('/sell-logs')
    sellLogs.value = res.data.data
    sellLogs.value.forEach(log => {
        log.truck = log.truck || { plate_number: 'โกดัง' }
    })
}

function prevPage() {
    if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++
}

function goToPage(page) {
    currentPage.value = page
}

const selectedLog = ref(null)

function openModal(log) {
    selectedLog.value = log
}

function closeModal() {
    selectedLog.value = null
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2
    }).format(amount)
}

function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleString('th-TH', {
        dateStyle: 'short',
        timeStyle: 'short'
    })
}
</script>

<style scoped>
.dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* Stat Widgets */
.dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}

.widget-card {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 22px 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.widget-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.widget-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
}

.widget-icon-box.blue {
    background: #eff6ff;
    color: #2563eb;
}

.widget-icon-box.cyan {
    background: #ecfeff;
    color: #0891b2;
}

.widget-icon-box.green {
    background: #ecfdf5;
    color: #059669;
}

.widget-icon-box.amber {
    background: #fffbeb;
    color: #d97706;
}

.widget-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.widget-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 2px;
}

.widget-value {
    font-size: 1.65rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.widget-value.green-text {
    color: #059669;
}

.widget-value.amber-text {
    color: #d97706;
}

.widget-sub {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 4px;
}

/* Table Card & Header */
.table-card {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 24px;
}

.table-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-title i {
    color: var(--primary-color);
}

.section-subtitle {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
}

.clickable-row {
    cursor: pointer;
    transition: background 0.15s ease;
}

.clickable-row:hover {
    background: #f8fafc;
}

.bill-chip {
    font-weight: 700;
    color: var(--primary-color);
    background: var(--primary-light);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.82rem;
    letter-spacing: 0.02em;
}

.truck-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.82rem;
    color: #334155;
    font-weight: 500;
}

.truck-pill i {
    color: #64748b;
    font-size: 0.75rem;
}

.font-medium {
    font-weight: 500;
}

.font-bold {
    font-weight: 700;
}

.text-right {
    text-align: right;
}

.text-danger {
    color: #dc2626;
}

.text-success {
    color: #059669;
}

.text-muted {
    color: #64748b;
}

.text-sm {
    font-size: 0.82rem;
}

.empty-state {
    text-align: center;
    padding: 48px 16px !important;
    color: #94a3b8;
}

.empty-state i {
    font-size: 2.5rem;
    margin-bottom: 8px;
}

/* Modal details */
.modal-lg {
    max-width: 900px;
    width: 95%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
}

.modal-title-box {
    display: flex;
    align-items: center;
    gap: 14px;
}

.modal-icon-badge {
    width: 44px;
    height: 44px;
    background: var(--primary-light);
    color: var(--primary-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
}

.modal-subtitle {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.modal-close-x {
    background: transparent;
    border: none;
    font-size: 1.6rem;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    border-radius: 6px;
}

.modal-close-x:hover {
    color: #0f172a;
    background: #f1f5f9;
}

.modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: calc(85vh - 150px);
    overflow-y: auto;
}

.customer-info-box {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px 20px;
}

.info-box-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.info-box-title i {
    color: var(--primary-color);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.info-item {
    display: flex;
    flex-direction: column;
    font-size: 0.84rem;
}

.info-item.full-span {
    grid-column: span 3;
}

.info-item .label {
    color: var(--text-muted);
    font-size: 0.75rem;
}

.info-item .value {
    color: var(--text-primary);
    font-weight: 600;
}

.modal-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
}

.modal-inner-table {
    margin: 0;
}

.bill-summary-bar {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 14px 20px;
}

.summary-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 0.82rem;
    color: var(--text-secondary);
}

.summary-stat strong {
    font-size: 1.15rem;
    color: var(--text-primary);
}

.summary-stat.danger strong {
    color: #dc2626;
}

.summary-stat.highlight strong {
    color: #059669;
    font-size: 1.3rem;
}

.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }

    .info-item.full-span {
        grid-column: span 1;
    }

    .bill-summary-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .summary-stat {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}
</style>
