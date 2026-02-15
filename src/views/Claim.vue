<template>
    <div class="sell-history-container">
        <h2 class="section-title">
            <i class="fas fa-history"></i> ประวัติการขาย & รับคืนสินค้า
        </h2>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">รายการขายล่าสุด</h3>

                <div class="filter-group">
                    <div class="date-input-group">
                        <input type="date" v-model="filterDate" class="status-select" @change="fetchSellLogs(1)">
                    </div>

                    <select v-model="filterTruckId" @change="fetchSellLogs(1)" class="status-select">
                        <option value="">รถทั้งหมด</option>
                        <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                            {{ truck.plate_number }}
                        </option>
                    </select>

                    <div class="search-input-wrapper small-search">
                        <input type="text" v-model="searchTerm" @input="debouncedFetch" placeholder="เลขบิล / ลูกค้า..."
                            class="search-input" />
                        <i class="fas fa-search search-icon-inside"></i>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>เวลา</th>
                            <th>เลขที่บิล</th>
                            <th>ลูกค้า</th>
                            <th>รถขนส่ง</th>
                            <th class="text-right">ยอดรวม</th>
                            <th class="text-center">ประเภท</th>
                            <th class="text-center">สถานะ</th>
                            <th class="text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in sellLogs" :key="log.id">
                            <td>
                                {{ new Date(log.created_at).toLocaleDateString('th-TH') }} <br>
                                <small class="text-muted">{{ new Date(log.created_at).toLocaleTimeString('th-TH', {
                                    hour:
                                        '2-digit', minute: '2-digit'
                                }) }}</small>
                            </td>
                            <td class="bold">{{ log.bill_no }}</td>
                            <td>{{ log.customer?.name || 'ลูกค้าทั่วไป' }}</td>
                            <td>{{ log.truck?.plate_number || '-' }}</td>
                            <td class="text-right price-text">
                                ฿{{ Number(log.total_sold_price).toLocaleString() }}
                            </td>
                            <td class="text-center">
                                <span class="badge" :class="log.is_credit ? 'badge-warning' : 'badge-success'">
                                    {{ log.is_credit ? 'Credit' : 'Cash' }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span v-if="hasReturn(log)" class="status-badge returned">
                                    มีการรับคืน
                                </span>
                                <span v-else class="status-badge completed">
                                    ปกติ
                                </span>
                            </td>
                            <td class="action-buttons center">
                                <button class="action-btn delete-btn" @click="openReturnModal(log)"
                                    title="รับคืนสินค้า / Refund">
                                    <i class="fas fa-undo-alt"></i> คืน
                                </button>
                            </td>
                        </tr>
                        <tr v-if="sellLogs.length === 0">
                            <td colspan="8" class="text-center py-4 text-muted">ไม่พบประวัติการขาย</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="modal-pagination" v-if="totalPages > 1" style="margin-top: 20px">
                <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info">หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <ReturnModal :show="showReturnModal" :sell-log="selectedSellLog" @close="showReturnModal = false"
            @refresh="fetchSellLogs(currentPage)" />
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

// เช็คว่าบิลนี้เคยมีการคืนของไปบ้างหรือยัง (ดูจาก items)
const hasReturn = (log) => {
    if (!log.items) return false
    return log.items.some(item => item.returned_quantity > 0)
}

const openReturnModal = (log) => {
    selectedSellLog.value = log
    showReturnModal.value = true
}

onMounted(() => {
    fetchTrucks()
    fetchSellLogs()
})
</script>

<style scoped>
/* Reuse Styles from ManagePreOrder */
.sell-history-container {
    max-width: 1240px;
    margin: 2rem auto;
    padding: 0 1.5rem;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: #2d3748;
}

.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 15px;
}

.filter-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

.status-select,
.search-input {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px;
    border-bottom: 1px solid #edf2f7;
}

.text-right {
    text-align: right;
}

.text-center {
    text-align: center;
}

.price-text {
    font-weight: bold;
    color: var(--primary-color, #2b6cb0);
}

/* Badges */
.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.badge-success {
    background: #c6f6d5;
    color: #22543d;
}

.badge-warning {
    background: #feebc8;
    color: #92400e;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
}

.status-badge.completed {
    color: green;
}

.status-badge.returned {
    background: #fed7d7;
    color: #822727;
    font-weight: bold;
}

.action-buttons.center {
    display: flex;
    justify-content: center;
}

.action-btn {
    width: auto;
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
}

.delete-btn {
    background: #e53e3e;
}

.delete-btn:hover {
    background: #c53030;
}
</style>