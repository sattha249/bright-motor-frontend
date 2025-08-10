<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from '../lib/axios'
import { useRouter } from 'vue-router'

const products = ref([])
const loading = ref(true)
const error = ref(null)
const router = useRouter()

const currentPage = ref(1)
const perPage = ref(10)
const totalPages = ref(1)

const searchKeyword = ref('') // คำค้นหา
let searchTimeout = null      // ตัวเก็บ timeout สำหรับ debounce

const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
        const res = await axios.get('/products', {
            params: {
                page: currentPage.value,
                perPage: perPage.value,
                search: searchKeyword.value.trim() || undefined,
            },
        })

        products.value = res.data.data
        totalPages.value = res.data.meta?.last_page || 1
    } catch (err) {
        error.value = 'โหลดข้อมูลไม่สำเร็จ'
        console.error(err)
    } finally {
        loading.value = false
    }
}

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        fetchProducts()
    }
}

const deleteProduct = async (id) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) return

    try {
        await axios.delete(`/products/${id}`)
        await fetchProducts()
        alert('ลบสินค้าเรียบร้อยแล้ว')
    } catch (err) {
        console.error('Delete failed', err)
        alert('ไม่สามารถลบสินค้าได้')
    }
}

// debounce search
watch(searchKeyword, (newValue) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1 // reset ไปหน้าแรกทุกครั้งที่ search
        fetchProducts()
    }, 500) // 0.5 วินาที
})

onMounted(() => {
    fetchProducts()
})
</script>

<template>
    <div class="product-table-container">
        <h2>รายการสินค้าทั้งหมด</h2>
        <div class="search-box">
            <input type="text" v-model="searchKeyword" placeholder="ค้นหาสินค้า..." />
            <i class="fas fa-search"></i>

            <router-link to="/products/add" class="add-product-btn">
                <i class="fas fa-plus"></i> เพิ่มสินค้าใหม่
            </router-link>
        </div>
        <div v-if="loading">กำลังโหลดข้อมูล...</div>
        <div v-else-if="error">{{ error }}</div>
        <div v-else>
            <table class="product-table">
                <thead>
                    <tr>
                        <th>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th>หมวดหมู่</th>
                        <th>ต้นทุน</th>
                        <th>ราคาขาย</th>
                        <th>หน่วย</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="product in products" :key="product.id">
                        <td>SKU-{{ product.id }}</td>
                        <td>{{ product.description }}</td>
                        <td>{{ product.category }}</td>
                        <td>{{ parseFloat(product.cost_price).toFixed(2) }} บาท</td>
                        <td>{{ parseFloat(product.sell_price).toFixed(2) }} บาท</td>
                        <td>{{ product.unit }}</td>
                        <td>
                            <router-link :to="`/products/edit/${product.id}`" class="action-btn edit-btn" title="แก้ไข">
                                <i class="fas fa-pen-to-square"></i>
                            </router-link>
                            <button class="action-btn delete-btn" @click="deleteProduct(product.id)" title="ลบ">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="products.length === 0">
                        <td colspan="7">ไม่มีข้อมูลสินค้า</td>
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
    </div>
</template>

<style scoped>
/* search */
.search-box {
    padding-top: 1rem;
    position: relative;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-box input {
    width: 300px;
    padding: 10px 15px;
    padding-left: 40px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 14px;
}

.search-box i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

/* table */
.product-table-container {
    padding: 1.5rem;
}

.add-product-btn {
    display: inline-block;
    margin-bottom: 1rem;
    background-color: #38a169;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    text-decoration: none;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.product-table th,
.product-table td {
    border: 1px solid #ddd;
    padding: 0.75rem;
    text-align: left;
}

.product-table th {
    background-color: #f7fafc;
}

.action-btn {
    margin-right: 0.5rem;
    padding: 0.3rem 0.6rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.edit-btn {
    background-color: #4299e1;
    color: white;
}

.delete-btn {
    background-color: #e53e3e;
    color: white;
}

.pagination {
    display: flex;
    gap: 1rem;
    align-items: center;
}
</style>
