<template>
    <div class="dashboard-widgets">
        <div class="widget">
            <h3>จำนวนสินค้าทั้งหมด</h3>
            <p class="value">{{ totalProducts }}</p>
        </div>
        <div class="widget">
            <h3>สินค้าที่มีในคลัง</h3>
            <p class="value">{{ totalProductsInStock }}</p>
        </div>
        <div class="widget">
            <h3>ยอดขายเดือนนี้</h3>
            <p class="value">{{ formatCurrency(totalSales) }} บาท</p>
        </div>
    </div>

    <div class="sell-logs-container">
        <h2>รายการขายล่าสุด</h2>
        <table class="product-table">
            <thead>
                <tr>
                    <th>เลขที่บิล</th>
                    <th>ลูกค้า</th>
                    <th>ทะเบียนรถ</th>
                    <th>ยอดรวม</th>
                    <th>ส่วนลด</th>
                    <th>ยอดสุทธิ</th>
                    <th>วันที่ขาย</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="log in paginatedLogs" :key="log.id" @click="openModal(log)" style="cursor: pointer">
                    <td>{{ log.bill_no }}</td>
                    <td>{{ log.customer.name }}</td>
                    <td>{{ log.truck.plate_number }}</td>
                    <td>{{ formatCurrency(log.total_price) }}</td>
                    <td>{{ formatCurrency(log.total_discount) }}</td>
                    <td>{{ formatCurrency(log.total_sold_price) }}</td>
                    <td>{{ formatDate(log.created_at) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                ก่อนหน้า
            </button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                ถัดไป
            </button>
        </div>

        <!-- Modal -->
        <div v-if="selectedLog" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
                <h3>รายละเอียดบิล {{ selectedLog.bill_no }}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>สินค้า ID</th>
                            <th>จำนวน</th>
                            <th>ราคาต่อหน่วย</th>
                            <th>ราคารวม</th>
                            <th>ส่วนลด</th>
                            <th>ราคาหลังหักส่วนลด</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in selectedLog.items" :key="item.id">
                            <td>{{ item.product_id }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ formatCurrency(item.price) }}</td>
                            <td>{{ formatCurrency(item.total_price) }}</td>
                            <td>{{ formatCurrency(item.discount) }}</td>
                            <td>{{ formatCurrency(item.sold_price) }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="customer-detail" style="padding-left: 5%;margin-bottom: 20px;">
                    <h4>ข้อมูลลูกค้า</h4>
                    <ul>
                        <li><strong>ชื่อ:</strong> {{ selectedLog.customer.name }}</li>
                        <li><strong>ที่อยู่:</strong> {{ selectedLog.customer.address }}</li>
                        <li><strong>อำเภอ:</strong> {{ selectedLog.customer.district }}</li>
                        <li><strong>จังหวัด:</strong> {{ selectedLog.customer.provice }}</li>
                        <li><strong>โทร:</strong> {{ selectedLog.customer.tel }}</li>
                        <li><strong>Email:</strong> {{ selectedLog.customer.email }}</li>
                    </ul>
                </div>

                <button @click="closeModal" class="close-btn">ปิด</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/lib/axios'

const sellLogs = ref([])
const totalSales = ref(0)
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
/* Pagination */
.pagination {
    margin-top: 15px;
    text-align: center;
    margin: 2%;
}

/* 
.pagination button {
    background: var(--secondary-color);
    border: none;
    padding: 8px 12px;
    margin: 0 3px;
    border-radius: 5px;
    cursor: pointer;
    color: white;
}

.pagination button.active {
    background: var(--primary-color);
    font-weight: bold;
}

.pagination button:disabled {
    background: #ccc;
    cursor: not-allowed;
} */

/* modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.modal {
    background: white;
    padding: 20px;
    width: 600px;
    max-width: 90%;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal h3 {
    margin-bottom: 1rem;
}

.modal table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.modal th,
.modal td {
    border: 1px solid #ccc;
    padding: 8px 10px;
    text-align: left;
}

.close-btn {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
}

/* dashboard */
.dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.widget {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    text-align: center;
}

.widget h3 {
    font-size: 18px;
    color: #666;
    margin-bottom: 10px;
}

.widget .value {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary-color);
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.product-table thead tr {
    background-color: var(--secondary-color);
    text-align: left;
}

.product-table th,
.product-table td {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}

.product-table tbody tr:hover {
    background-color: #f9f9f9;
}
</style>
