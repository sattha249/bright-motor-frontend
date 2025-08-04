<template>
    <div class="product-table-container">
        <h2>รายการสินค้าในคลัง</h2>
        <table class="product-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ชื่อสินค้า</th>
                    <th>ยี่ห้อ</th>
                    <th>จำนวน</th>
                    <th>หน่วย</th>
                    <th>ราคา</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in warehouseStock" :key="item.id">
                    <td>{{ (page - 1) * perPage + index + 1 }}</td>
                    <td>{{ item.product?.description || 'ไม่ระบุ' }}</td>
                    <td>{{ item.product?.brand || '-' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.product?.unit || '-' }}</td>
                    <td>฿{{ item.product?.sell_price?.toLocaleString() || '0' }}</td>
                </tr>
            </tbody>
        </table>

        <div class="pagination">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                ก่อนหน้า
            </button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                ถัดไป
            </button>
        </div>
    </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from '@/lib/axios'

const warehouseStock = ref([])
const meta = ref(null)
const isLoading = ref(false)
const page = ref(1)
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = 10;

const fetchWarehouseStock = async () => {
    isLoading.value = true
    try {
        const response = await axios.get(`/warehouse-stocks?page=${page.value}`)
        warehouseStock.value = response.data.data
        meta.value = response.data.meta
    } catch (error) {
        console.error('Error fetching warehouse stock:', error)
    } finally {
        isLoading.value = false
    }
}

const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= meta.value.last_page) {
        page.value = newPage
    }
}

onMounted(fetchWarehouseStock)
watch(page, fetchWarehouseStock)
</script>
<style scoped>
.product-table-container {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.product-table-container h2 {
    margin-bottom: 20px;
    font-size: 24px;
    display: inline-block;
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

.pagination {
    display: flex;
    gap: 1rem;
    align-items: center;
}
</style>
