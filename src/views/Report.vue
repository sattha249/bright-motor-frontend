<template>
    <div class="page-container report-page-container">
        <!-- Page Header -->
        <div class="page-header-card">
            <div class="header-content-wrap">
                <div class="header-left-group">
                    <div class="page-icon-badge">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h1 class="page-title">รายงานการขาย</h1>
                        <p class="page-subtitle">สรุปข้อมูลยอดขาย ส่วนลด และตรวจสอบบิลตามจุดขายและช่วงเวลา</p>
                    </div>
                </div>
                <div class="header-right-actions">
                    <button class="btn btn-success export-btn" @click="exportToExcel" :disabled="reports.length === 0">
                        <i class="fas fa-file-excel"></i>
                        <span>ส่งออก Excel</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- KPI Metric Cards (When summary is loaded) -->
        <div class="stats-grid" v-if="summary">
            <div class="stat-card">
                <div class="stat-icon-wrapper primary">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-label">ยอดขายรวม</span>
                    <h3 class="stat-value tabular-nums">฿{{ formatCurrency(summary.totalSales) }}</h3>
                    <span class="stat-badge">ก่อนหักส่วนลด</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper danger">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-label">ส่วนลดรวม</span>
                    <h3 class="stat-value tabular-nums text-danger">฿{{ formatCurrency(summary.totalDiscount) }}</h3>
                    <span class="stat-badge danger">รวมทุกรายการ</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper success">
                    <i class="fas fa-wallet"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-label">ยอดสุทธิรวม</span>
                    <h3 class="stat-value tabular-nums text-success">
                        ฿{{ formatCurrency(summary.totalSales - summary.totalDiscount) }}
                    </h3>
                    <span class="stat-badge success">รายรับสุทธิ</span>
                </div>
            </div>
        </div>

        <!-- Filter Bar Card -->
        <div class="card filter-card">
            <div class="filter-grid">
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-calendar-day"></i> ตั้งแต่วันที่
                    </label>
                    <input type="date" class="form-control" v-model="filters.startDate" @change="(fetchReports(1), fetchSummary())" />
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-calendar-check"></i> ถึงวันที่
                    </label>
                    <input type="date" class="form-control" v-model="filters.endDate" @change="(fetchReports(1), fetchSummary())" />
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-store"></i> จุดขาย (รถ/โกดัง)
                    </label>
                    <select class="form-control" v-model="filters.truckId" @change="(fetchReports(1), fetchSummary())">
                        <option value="">ทั้งหมด</option>
                        <option :value="0">โกดังหลัก</option>
                        <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                            {{ truck.plate_number }} - {{ truck?.user?.fullname }}
                        </option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-filter"></i> ประเภทออเดอร์
                    </label>
                    <select class="form-control" v-model="include_preorder" @change="(fetchReports(1), fetchSummary())">
                        <option value="all">รวมทั้งสองแบบ</option>
                        <option value="only-preorder">เฉพาะ Pre-order</option>
                        <option value="except-preorder">ไม่รวม Pre-order</option>
                    </select>
                </div>
                <div class="form-group search-form-group">
                    <label class="form-label">
                        <i class="fas fa-magnifying-glass"></i> ค้นหาบิล / ลูกค้า
                    </label>
                    <div class="search-input-wrap">
                        <i class="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            class="form-control with-icon"
                            placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า..."
                            v-model="searchKeyword"
                            @input="debouncedSearch"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Report Table Card -->
        <div class="card table-card">
            <div v-if="loading" class="empty-table-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>กำลังโหลดรายงานข้อมูลการขาย...</p>
            </div>
            <div v-else-if="reports.length === 0" class="empty-table-state">
                <i class="fas fa-folder-open"></i>
                <p>ไม่พบข้อมูลการขายตามเงื่อนไขที่เลือก</p>
            </div>

            <div v-else class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 140px;">วันที่ - เวลา</th>
                            <th style="width: 140px;">เลขที่บิล</th>
                            <th>ลูกค้า</th>
                            <th>จุดขาย</th>
                            <th class="text-right">ยอดรวม (฿)</th>
                            <th class="text-right">ส่วนลด (฿)</th>
                            <th class="text-right">ยอดสุทธิ (฿)</th>
                            <th class="text-center" style="width: 80px;">รายการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="report in reports" :key="report.id">
                            <tr class="main-row" :class="{ 'row-expanded': expandedRows.includes(report.id) }">
                                <td class="tabular-nums font-medium text-secondary">{{ formatDate(report.created_at) }}</td>
                                <td class="tabular-nums font-bold text-primary">{{ report.bill_no }}</td>
                                <td class="font-medium">{{ report.customer?.name || '-' }}</td>
                                <td>
                                    <span class="sale-point-badge">
                                        <i class="fas" :class="report.truck ? 'fa-truck' : 'fa-warehouse'"></i>
                                        {{ getTruckName(report.truck) }}
                                    </span>
                                </td>
                                <td class="text-right tabular-nums font-medium">{{ formatCurrency(report.total_price) }}</td>
                                <td class="text-right tabular-nums text-danger font-medium">
                                    {{ Number(report.total_discount) > 0 ? `-${formatCurrency(report.total_discount)}` : '-' }}
                                </td>
                                <td class="text-right tabular-nums font-bold text-success">{{ formatCurrency(report.total_sold_price) }}</td>
                                <td class="text-center">
                                    <button
                                        class="btn-icon-toggle"
                                        @click="toggleDetails(report.id)"
                                        :title="expandedRows.includes(report.id) ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'"
                                    >
                                        <i :class="expandedRows.includes(report.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                                    </button>
                                </td>
                            </tr>
                            <!-- Collapsible Detail Row -->
                            <tr v-if="expandedRows.includes(report.id)" class="detail-row">
                                <td colspan="8" class="detail-cell-wrap">
                                    <div class="detail-container">
                                        <div class="detail-header">
                                            <i class="fas fa-list-ul"></i>
                                            <h4>รายการสินค้าในบิล {{ report.bill_no }}</h4>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="detail-sub-table">
                                                <thead>
                                                    <tr>
                                                        <th>รหัสสินค้า (SKU)</th>
                                                        <th>รายละเอียดสินค้า</th>
                                                        <th class="text-center">จำนวน</th>
                                                        <th class="text-right">ราคาต่อหน่วย</th>
                                                        <th class="text-right">ส่วนลด/หน่วย</th>
                                                        <th class="text-right">ราคาสุทธิ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="item in report.items" :key="item.id">
                                                        <td class="tabular-nums font-medium">{{ item.product_id }}</td>
                                                        <td>{{ item.product?.description || '-' }}</td>
                                                        <td class="text-center tabular-nums font-semibold">{{ item.quantity }}</td>
                                                        <td class="text-right tabular-nums">฿{{ formatCurrency(item.price) }}</td>
                                                        <td class="text-right tabular-nums text-danger">
                                                            {{ Number(item.discount) > 0 ? `฿${formatCurrency(item.discount)}` : '-' }}
                                                        </td>
                                                        <td class="text-right tabular-nums font-bold text-primary">
                                                            ฿{{ formatCurrency(item.quantity * item.sold_price) }}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                    <tfoot v-if="summary">
                        <tr class="summary-total-row">
                            <td colspan="4" class="text-right font-bold">รวมทั้งสิ้นในหน้านี้/เงื่อนไขนี้</td>
                            <td class="text-right tabular-nums font-bold">฿{{ formatCurrency(summary.totalSales) }}</td>
                            <td class="text-right tabular-nums font-bold text-danger">฿{{ formatCurrency(summary.totalDiscount) }}</td>
                            <td class="text-right tabular-nums font-bold text-success text-base">
                                ฿{{ formatCurrency(summary.totalSales - summary.totalDiscount) }}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Pagination Controls -->
            <div class="pagination-wrapper" v-if="meta && meta.last_page > 1">
                <button
                    class="btn btn-secondary btn-sm"
                    @click="fetchReports(meta.current_page - 1)"
                    :disabled="!meta.previous_page_url"
                >
                    <i class="fas fa-chevron-left"></i> ก่อนหน้า
                </button>
                <div class="page-indicator">
                    หน้า <span class="font-bold tabular-nums">{{ meta.current_page }}</span> จาก <span class="tabular-nums">{{ meta.last_page }}</span>
                </div>
                <button
                    class="btn btn-secondary btn-sm"
                    @click="fetchReports(meta.current_page + 1)"
                    :disabled="!meta.next_page_url"
                >
                    ถัดไป <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/lib/axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import moment from 'moment'

const reports = ref([])
const trucks = ref([])
const meta = ref(null)
const loading = ref(false)
const expandedRows = ref([])
const summary = ref(null)

// [เพิ่ม] ตัวแปร searchKeyword
const searchKeyword = ref('')
const include_preorder = ref('all')

const filters = ref({
    startDate: '',
    endDate: '',
    truckId: '',
})

// [เพิ่ม] Debounce Utility
let debounceTimeout = null
function debounce(func, delay) {
    return (...args) => {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

// Fetch Data
const fetchReports = async (page = 1) => {
    loading.value = true
    try {
        const params = {
            page,
            start_date: filters.value.startDate ? `${filters.value.startDate} 00:00:00` : '',
            end_date: filters.value.endDate ? `${filters.value.endDate} 23:59:59` : '',
            truck_id: filters.value.truckId,
            search: searchKeyword.value, // [แก้ไข] แนบ params search ไปด้วย
            include_preorder: include_preorder.value,
        }
        const res = await axios.get('/sell-logs', { params })
        reports.value = res.data.data
        meta.value = res.data.meta
    } catch (error) {
        console.error('Error fetching reports:', error)
    } finally {
        loading.value = false
    }
}

const fetchSummary = async () => {
    try {
        const params = {
            start_date: filters.value.startDate ? `${filters.value.startDate} 00:00:00` : '',
            end_date: filters.value.endDate ? `${filters.value.endDate} 23:59:59` : '',
            truck_id: filters.value.truckId,
            search: searchKeyword.value, // [แก้ไข] แนบ params search ให้ summary ด้วยเพื่อให้ยอดตรงกัน
            include_preorder: include_preorder.value,
        }
        const res = await axios.get('/sell-logs/summary', { params })
        summary.value = res.data
    } catch (error) {
        console.error('Error fetching summary:', error)
        return null
    }
}

// [เพิ่ม] Debounced function สำหรับเรียก API เมื่อพิมพ์ค้นหา
const debouncedSearch = debounce(() => {
    fetchReports(1) // กลับไปหน้า 1
    fetchSummary() // อัพเดทยอดรวม
}, 500)

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks?perPage=1000')
        trucks.value = res.data.data
    } catch (error) {
        console.error('Error fetching trucks:', error)
    }
}

// Helpers
const formatDate = (date) => moment(date).format('DD/MM/YYYY HH:mm')
const formatCurrency = (value) =>
    Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })

const getTruckName = (truck) => {
    if (!truck) return 'โกดังหลัก'
    return `รถ ${truck.plate_number}`
}

const toggleDetails = (id) => {
    if (expandedRows.value.includes(id)) {
        expandedRows.value = expandedRows.value.filter((rowId) => rowId !== id)
    } else {
        expandedRows.value.push(id)
    }
}

// Export Excel
const exportToExcel = () => {
    // เตรียมข้อมูลสำหรับ Excel (Flat Data)
    const data = reports.value.flatMap((report) => {
        return report.items.map((item) => ({
            วันที่: formatDate(report.created_at),
            เลขที่บิล: report.bill_no,
            ลูกค้า: report.customer?.name || '-',
            จุดขาย: getTruckName(report.truck),
            รหัสสินค้า: item.product_id,
            จำนวน: item.quantity,
            ราคาต่อหน่วย: Number(item.price),
            ส่วนลดต่อหน่วย: Number(item.discount),
            'ราคาสุทธิ (รวม)': Number(item.quantity * item.sold_price),
        }))
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(dataBlob, `sales_report_${moment().format('YYYYMMDD_HHmm')}.xlsx`)
}

onMounted(() => {
    fetchTrucks()
    fetchReports()
    fetchSummary()
})
</script>

<style scoped>
.report-page-container {
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

/* Stats Cards */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
}

.stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.stat-icon-wrapper {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
}

.stat-icon-wrapper.primary {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.2));
    color: var(--primary);
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.stat-icon-wrapper.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(244, 63, 94, 0.2));
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.stat-icon-wrapper.success {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.2));
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.stat-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
}

.stat-badge {
    font-size: 0.72rem;
    color: var(--text-muted);
}

.stat-badge.danger {
    color: var(--danger);
}

.stat-badge.success {
    color: var(--success);
}

/* Filter Card */
.filter-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow-sm);
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    align-items: flex-end;
}

.filter-grid .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.filter-grid .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.filter-grid .form-label i {
    color: var(--primary);
    font-size: 0.82rem;
}

/* Modern Dropdown */
.filter-grid select.form-control {
    appearance: none;
    -webkit-appearance: none;
    background-color: #ffffff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232563eb' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 14px 14px;
    padding: 0 38px 0 14px;
    height: 44px;
    border: 1.5px solid #e2e8f0;
    border-radius: var(--radius-lg);
    font-size: 0.92rem;
    font-family: inherit;
    color: var(--text-primary);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-grid select.form-control:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}

.filter-grid select.form-control:focus {
    border-color: #2563eb;
    background-color: #ffffff;
    box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
    outline: none;
}

/* Modern Datepicker */
.filter-grid input[type="date"].form-control {
    background-color: #ffffff;
    height: 44px;
    padding: 0 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: var(--radius-lg);
    font-size: 0.92rem;
    font-family: inherit;
    color: var(--text-primary);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-grid input[type="date"].form-control:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}

.filter-grid input[type="date"].form-control:focus {
    border-color: #2563eb;
    background-color: #ffffff;
    box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
    outline: none;
}

.filter-grid input[type="date"].form-control::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.65;
    filter: invert(36%) sepia(85%) saturate(1487%) hue-rotate(206deg) brightness(97%) contrast(92%);
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.filter-grid input[type="date"].form-control::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
    transform: scale(1.15);
}

/* Modern Searchbar */
.search-form-group {
    grid-column: span 1;
}

@media (min-width: 1024px) {
    .search-form-group {
        grid-column: span 2;
    }
}

.search-input-wrap {
    position: relative;
    width: 100%;
}

.search-input-wrap .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 0.95rem;
    pointer-events: none;
    transition: color 0.2s ease;
}

.filter-grid input[type="text"].form-control.with-icon {
    height: 44px;
    padding: 0 14px 0 42px;
    background-color: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: var(--radius-lg);
    font-size: 0.92rem;
    font-family: inherit;
    color: var(--text-primary);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-grid input[type="text"].form-control.with-icon:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}

.filter-grid input[type="text"].form-control.with-icon:focus {
    border-color: #2563eb;
    background-color: #ffffff;
    box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
    outline: none;
}

.search-input-wrap:focus-within .search-icon {
    color: #2563eb;
}

/* Table styling */
.table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
}

.main-row {
    transition: background-color var(--transition-fast);
}

.main-row.row-expanded {
    background: rgba(37, 99, 235, 0.04);
}

.sale-point-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 0.25rem 0.65rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.btn-icon-toggle {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--bg-main);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-icon-toggle:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

/* Collapsible nested details */
.detail-cell-wrap {
    padding: 0 !important;
    background: var(--bg-main);
}

.detail-container {
    padding: 1.25rem 1.75rem;
    border-left: 4px solid var(--primary);
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    margin-bottom: 0.85rem;
}

.detail-header h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
}

.detail-sub-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.detail-sub-table th,
.detail-sub-table td {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
}

.detail-sub-table th {
    background: rgba(0, 0, 0, 0.02);
    font-weight: 600;
    color: var(--text-secondary);
}

.detail-sub-table tr:last-child td {
    border-bottom: none;
}

/* Summary Footer */
.summary-total-row {
    background: var(--bg-main);
    border-top: 2px solid var(--border);
}

.summary-total-row td {
    padding: 1rem 1rem;
    font-size: 0.95rem;
}

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
