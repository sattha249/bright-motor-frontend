<template>
    <div class="claim-view-container">
        <!-- Header Banner -->
        <div class="claim-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-clock-rotate-left"></i>
                </div>
                <div>
                    <h2 class="section-title">ประวัติการขาย & รับคืนสินค้า</h2>
                    <p class="section-subtitle">ตรวจสอบประวัติการเปิดบิลขายหน้าร้านและรถขนส่ง พร้อมจัดการรับคืนสินค้า / Refund</p>
                </div>
            </div>
        </div>

        <!-- Table Card -->
        <div class="table-card">
            <div class="table-card-header">
                <div>
                    <h3 class="card-title">รายการบิลขายล่าสุด</h3>
                    <p class="card-subtitle">ค้นหาและกรองรายการขายตามวันที่ รถขนส่ง หรือเลขที่บิล</p>
                </div>

                <div class="filter-controls-row">
                    <div class="date-picker-wrapper">
                        <input type="date" v-model="filterDate" class="filter-select date-input" @change="fetchSellLogs(1)" />
                    </div>

                    <select v-model="filterTruckId" @change="fetchSellLogs(1)" class="filter-select">
                        <option value="">รถทั้งหมด</option>
                        <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                            {{ truck.plate_number }}
                        </option>
                    </select>

                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon-main"></i>
                        <input
                            type="text"
                            v-model="searchTerm"
                            @input="debouncedFetch"
                            placeholder="เลขบิล / ลูกค้า..."
                            class="filter-search-input"
                        />
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th width="140">วัน-เวลา</th>
                            <th width="150">เลขที่บิล</th>
                            <th>ลูกค้า</th>
                            <th>รถขนส่ง</th>
                            <th class="text-right" width="140">ยอดรวมสุทธิ</th>
                            <th class="text-center" width="110">การชำระ</th>
                            <th class="text-center" width="130">สถานะ</th>
                            <th class="text-center" width="100">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in sellLogs" :key="log.id">
                            <td>
                                <div class="font-bold text-main tabular-nums">
                                    {{ new Date(log.created_at).toLocaleDateString('th-TH') }}
                                </div>
                                <small class="text-muted tabular-nums">
                                    {{ new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}
                                </small>
                            </td>
                            <td>
                                <span class="bill-badge tabular-nums">{{ log.bill_no }}</span>
                            </td>
                            <td class="font-medium text-main">{{ log.customer?.name || 'ลูกค้าทั่วไป' }}</td>
                            <td>
                                <span v-if="log.truck" class="truck-chip">
                                    <i class="fas fa-truck"></i> {{ log.truck.plate_number }}
                                </span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td class="text-right tabular-nums font-bold text-success" style="font-size: 1rem;">
                                ฿{{ Number(log.total_sold_price).toLocaleString() }}
                            </td>
                            <td class="text-center">
                                <span :class="['stock-pill', log.is_credit ? 'pill-low' : 'pill-high']">
                                    {{ log.is_credit ? 'Credit' : 'Cash' }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span
                                    v-if="hasReturn(log)"
                                    class="stock-pill pill-empty returned-pill-clickable"
                                    @click.stop="openReprintModal(log)"
                                    title="คลิกเพื่อพิมพ์ใบรับคืนสินค้าอีกครั้ง"
                                >
                                    <i class="fas fa-rotate-left"></i> มีการรับคืน
                                    <i class="fas fa-print" style="margin-left: 4px;"></i>
                                </span>
                                <span v-else class="stock-pill pill-high">
                                    <i class="fas fa-check-circle"></i> ปกติ
                                </span>
                            </td>
                            <td class="text-center">
                                <button
                                    class="btn-return"
                                    @click="openReturnModal(log)"
                                    title="รับคืนสินค้า / Refund"
                                >
                                    <i class="fas fa-arrow-rotate-left"></i>
                                    <span>คืนของ</span>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="sellLogs.length === 0">
                            <td colspan="8" class="text-center py-5 text-muted">
                                <div class="empty-state">
                                    <i class="fas fa-clock-rotate-left empty-icon"></i>
                                    <p class="empty-title">ไม่พบประวัติการขายในช่วงเวลานี้</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination-container" v-if="totalPages > 1" style="margin-top: 20px">
                <button class="pagination-btn" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-indicator">หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button class="pagination-btn" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <ReturnModal
            :show="showReturnModal"
            :sell-log="selectedSellLog"
            :is-reprint="isReprintMode"
            @close="showReturnModal = false"
            @refresh="fetchSellLogs(currentPage)"
        />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/lib/axios'
import ReturnModal from '@/components/ReturnModal.vue' // อย่าลืม Import Modal ที่เราสร้างก่อนหน้านี้

// State
const sellLogs = ref([])
const trucks = ref([])
const loading = ref(false)

// Filters
const filterDate = ref(new Date().toISOString().slice(0, 10)) // Default วันนี้
const filterTruckId = ref('')
const searchTerm = ref('')

// Pagination
const currentPage = ref(1)
const totalPages = ref(1)

// Modal State
const showReturnModal = ref(false)
const selectedSellLog = ref(null)

// Utility
const debounce = (func, delay) => {
    let timeout = null
    return (...args) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), delay)
    }
}

// Functions
const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks') // ใช้ API เดิมที่มีอยู่แล้ว
        trucks.value = res.data.data
    } catch (e) {
        console.error(e)
    }
}

const fetchSellLogs = async (page = 1) => {
    loading.value = true
    currentPage.value = page
    try {
        const res = await axios.get('/sell-logs', {
            params: {
                page: page,
                limit: 20,
                start_date: filterDate.value,
                end_date: filterDate.value,
                truck_id: filterTruckId.value,
                search: searchTerm.value,
                // populate: 'items.product' // สำคัญ: ต้องให้ Backend ส่ง items และ product มาด้วยเพื่อใช้ใน Modal
            }
        })
        sellLogs.value = res.data.data
        totalPages.value = res.data.meta.last_page
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const debouncedFetch = debounce(() => fetchSellLogs(1), 500)

const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchSellLogs(page)
    }
}

const isReprintMode = ref(false)

// เช็คว่าบิลนี้เคยมีการคืนของไปบ้างหรือยัง (ดูจาก items)
const hasReturn = (log) => {
    if (!log.items) return false
    return log.items.some(item => item.returned_quantity > 0)
}

const openReturnModal = (log) => {
    selectedSellLog.value = log
    isReprintMode.value = false
    showReturnModal.value = true
}

const openReprintModal = (log) => {
    selectedSellLog.value = log
    isReprintMode.value = true
    showReturnModal.value = true
}

onMounted(() => {
    fetchTrucks()
    fetchSellLogs()
})
</script>

<style scoped>
.claim-view-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.claim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.25rem;
}

.filter-controls-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-size: 0.875rem;
    color: var(--text-main);
    outline: none;
    transition: all 0.2s ease;
}

.filter-select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon-main {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    font-size: 0.875rem;
}

.filter-search-input {
    padding: 0.6rem 1rem 0.6rem 2.25rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-size: 0.875rem;
    color: var(--text-main);
    width: 240px;
    outline: none;
    transition: all 0.2s ease;
}

.filter-search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.bill-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #f1f5f9;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-main);
}

.truck-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #eff6ff;
    color: var(--primary-color);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
}

.returned-pill-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.returned-pill-clickable:hover {
    transform: scale(1.04);
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
}

.btn-return {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #fee2e2;
    background: #fef2f2;
    color: #dc2626;
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn-return:hover {
    background: #fee2e2;
    transform: translateY(-1px);
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