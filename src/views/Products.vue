<script setup>
import { ref, onMounted } from 'vue'
import axios from '../lib/axios'
import { useRouter } from 'vue-router'

const products = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const perPage = ref(10)
const totalPages = ref(1)
const searchKeyword = ref('')
const searchTimeout = ref(null)

const editModalOpen = ref(false)
const editProduct = ref({
    id: '',
    category: '',
    description: '',
    brand: '',
    model: '',
    cost_price: '',
    sell_price: '',
    unit: ''
})
const editingId = ref(null)

const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
        const res = await axios.get('/products', {
            params: {
                page: currentPage.value,
                perPage: perPage.value,
                search: searchKeyword.value || ''
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

// เปิด modal เพื่อแก้ไข
function openEditModal(product) {
    editProduct.value = { ...product } // clone เพื่อแก้ไขได้โดยไม่กระทบต้นฉบับ
    editModalOpen.value = true
}

// บันทึกการแก้ไข
async function saveEdit() {
    try {
        await axios.put(`/products/${editProduct.value.id}`, {
            category: editProduct.value.category,
            description: editProduct.value.description,
            brand: editProduct.value.brand || '',
            model: editProduct.value.model || '',
            cost_price: editProduct.value.cost_price,
            sell_price: editProduct.value.sell_price,
            unit: editProduct.value.unit,
            zone: editProduct.value.zone
        })

        alert('บันทึกการแก้ไขเรียบร้อย')
        editModalOpen.value = false

        // โหลดข้อมูลสินค้าใหม่ (สมมติว่ามีฟังก์ชัน fetchProducts)
        fetchProducts()
    } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการบันทึก')
    }
}

// debounce search
const handleSearch = (e) => {
    clearTimeout(searchTimeout.value)
    searchKeyword.value = e.target.value
    searchTimeout.value = setTimeout(() => {
        currentPage.value = 1
        fetchProducts()
    }, 500)
}

onMounted(() => {
    fetchProducts()
})
</script>

<template>
    <div class="product-table-container">
        <h2>รายการสินค้าทั้งหมด</h2>
        <div class="search-box">
            <input type="text" placeholder="ค้นหาสินค้า..." @input="handleSearch" />
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
                        <th>จุดเก็บ</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="product in products" :key="product.id">
                        <td>{{ product.product_code }}</td>
                        <td>{{ product.description }}</td>
                        <td>{{ product.category }}</td>
                        <td>{{ parseFloat(product.cost_price).toFixed(2) }} บาท</td>
                        <td>{{ parseFloat(product.sell_price).toFixed(2) }} บาท</td>
                        <td>{{ product.unit }}</td>
                        <td>{{ product.zone }}</td>
                        <td>
                            <button class="action-btn edit-btn" @click="openEditModal(product)" title="แก้ไข">
                                <i class="fas fa-pen-to-square"></i>
                            </button>
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

        <!-- Modal แก้ไข -->
        <div v-if="editModalOpen" class="modal-backdrop">
            <div class="modal">
                <h2 class="modal-title">แก้ไขสินค้า</h2>
                <form @submit.prevent="saveEdit" class="product-form">
                    <div class="form-group">
                        <label>หมวดหมู่ <span class="required">*</span></label>
                        <input v-model="editProduct.category" required />
                    </div>
                    <div class="form-group">
                        <label>รายละเอียด <span class="required">*</span></label>
                        <input v-model="editProduct.description" required />
                    </div>
                    <div class="form-group">
                        <label>ยี่ห้อ</label>
                        <input v-model="editProduct.brand" />
                    </div>
                    <div class="form-group">
                        <label>รุ่น</label>
                        <input v-model="editProduct.model" />
                    </div>
                    <div class="form-group">
                        <label>ราคาทุน <span class="required">*</span></label>
                        <input type="number" v-model="editProduct.cost_price" required />
                    </div>
                    <div class="form-group">
                        <label>ราคาขาย <span class="required">*</span></label>
                        <input type="number" v-model="editProduct.sell_price" required />
                    </div>
                    <div class="form-group">
                        <label>หน่วย <span class="required">*</span></label>
                        <input v-model="editProduct.unit" required />
                    </div>
                    <div class="form-group">
                        <label>จุดเก็บ <span class="required">*</span></label>
                        <input v-model="editProduct.zone" required />
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-save">
                            <i class="fas fa-save"></i> บันทึก
                        </button>
                        <button type="button" class="btn-cancel" @click="editModalOpen = false">
                            <i class="fas fa-times"></i> ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
/*modal edit*/
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: #fff;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: fadeIn 0.3s ease;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1.2rem;
    color: #333;
}

.product-form .form-group {
    margin-bottom: 1rem;
}

.product-form label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.4rem;
}

.product-form .required {
    color: red;
}

.product-form input {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s ease;
}

.product-form input:focus {
    border-color: #007bff;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    margin-top: 1.2rem;
}

.btn-save {
    background: #28a745;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.btn-save:hover {
    background: #218838;
}

.btn-cancel {
    background: #dc3545;
    color: white;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.btn-cancel:hover {
    background: #c82333;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

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
