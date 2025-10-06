<template>
    <div class="product-table-container">
        <h2>รายการสินค้าในคลัง</h2>
        <br></br>
        <button class="add-product-btn" @click="openModal">เพิ่มสินค้าเข้าคลัง</button>
        <table class="product-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>รหัสสินค้า</th>
                    <th>ชื่อสินค้า</th>
                    <th>ยี่ห้อ</th>
                    <th>จำนวน</th>
                    <th>หน่วย</th>
                    <th>ราคา</th>
                    <th>จุดเก็บ</th>
                    <th>สถานะ</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in warehouseStock" :key="item.id">
                    <td>{{ (page - 1) * perPage + index + 1 }}</td>
                    <td>{{ item.product?.product_code || '-' }}</td>
                    <td>{{ item.product?.description || 'ไม่ระบุ' }}</td>
                    <td>{{ item.product?.brand || '-' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.product?.unit || '-' }}</td>
                    <td>฿{{ item.product?.sell_price?.toLocaleString() || '0' }}</td>
                    <td>{{ item.product?.zone || 'ไม่ระบุ' }}</td>
                    <!-- badge -->
                    <td>
                        <span v-if="item.quantity < 20" class="stock-badge badge-low">
                            ใกล้หมด
                        </span>
                        <span v-else-if="item.quantity >= 20 && item.quantity < 50" class="stock-badge badge-medium">
                            ปานกลาง
                        </span>
                        <span v-else class="stock-badge badge-high">
                            มาก
                        </span>
                    </td>

                </tr>
                <tr v-if="warehouseStock.length === 0">
                    <td colspan="6" style="text-align:center">ไม่มีข้อมูลในคลัง</td>
                </tr>
            </tbody>
        </table>

        <div class="pagination">
            <button @click="goToPage(page - 1)" :disabled="page === 1">ก่อนหน้า</button>
            <span>หน้า {{ page }} / {{ totalPages }}</span>
            <button @click="goToPage(page + 1)" :disabled="page === totalPages">ถัดไป</button>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <h3>เพิ่มสินค้าเข้าคลัง</h3>

                <!-- Search + Dropdown -->
                <div class="form-group">
                    <label>ค้นหาสินค้า</label>
                    <input type="text" v-model="searchTerm" placeholder="พิมพ์เพื่อค้นหา..." @input="handleSearchInput"
                        autocomplete="off" />
                    <div class="dropdown" v-if="searchResults.length">
                        <div class="dropdown-item" v-for="product in searchResults" :key="product.id"
                            @click="selectProduct(product)">
                            {{ product.description }} ({{ product.brand || '-' }})
                        </div>
                    </div>
                </div>

                <div class="form-group quantity-group">
                    <label>จำนวน</label>
                    <button type="button" @click="quantity = Math.max(1, quantity - 1)">-</button>
                    <input type="number" v-model.number="quantity" min="1" />
                    <button type="button" @click="quantity++">+</button>
                    <button class="push-btn" type="button" @click="addToImportList">เพิ่ม</button>
                </div>

                <!-- Summary -->
                <div v-if="importList.length" class="summary">
                    <h4>สรุปรายการที่จะเพิ่ม</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>ชื่อสินค้า</th>
                                <th>จำนวน</th>
                                <th>ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in importList" :key="idx">
                                <td>{{ item.productName }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>
                                    <button type="button" @click="removeFromImportList(idx)">ลบ</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="modal-actions">
                    <button type="button" @click="saveImport">บันทึก</button>
                    <button type="button" @click="closeModal">ยกเลิก</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from '@/lib/axios'

const warehouseStock = ref([])
const meta = ref(null)
const page = ref(1)
const totalPages = ref(1)
const perPage = 10

const showModal = ref(false)
const searchTerm = ref('')
const searchResults = ref([])
const selectedProductId = ref(null)
const selectedProductName = ref('')
const quantity = ref(1)
const importList = ref([])

let searchTimeout = null

// โหลดสินค้าในคลัง
const fetchWarehouseStock = async () => {
    try {
        const res = await axios.get('/warehouse-stocks', {
            params: {
                page: page.value,
                perPage: perPage
            }
        })
        warehouseStock.value = res.data.data
        meta.value = res.data.meta
        totalPages.value = res.data.meta?.last_page || 1
    } catch (err) {
        console.error('Error fetching warehouse stock:', err)
    }
}

const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        page.value = newPage
    }
}

const openModal = () => {
    searchTerm.value = ''
    searchResults.value = []
    selectedProductId.value = null
    selectedProductName.value = ''
    quantity.value = 1
    importList.value = []
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}

const fetchSearchResults = async () => {
    if (!searchTerm.value.trim()) {
        searchResults.value = []
        return
    }
    try {
        const res = await axios.get('/products', {
            params: {
                search: searchTerm.value.trim(),
                perPage: 10
            }
        })
        searchResults.value = res.data.data
    } catch (err) {
        console.error('Error searching products:', err)
        searchResults.value = []
    }
}

// debounce search input
const handleSearchInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        fetchSearchResults()
    }, 500)
}

const selectProduct = (product) => {
    selectedProductId.value = product.id
    selectedProductName.value = product.description
    searchTerm.value = product.description
    searchResults.value = []
}

const addToImportList = () => {
    if (!selectedProductId.value || quantity.value < 1) {
        alert('กรุณาเลือกสินค้าและระบุจำนวนอย่างถูกต้อง')
        return
    }
    // ถ้ามีสินค้านี้ในรายการแล้วให้รวมจำนวน
    const existIndex = importList.value.findIndex(i => i.productId === selectedProductId.value)
    if (existIndex !== -1) {
        importList.value[existIndex].quantity += quantity.value
    } else {
        importList.value.push({
            productId: selectedProductId.value,
            productName: selectedProductName.value,
            quantity: quantity.value
        })
    }
    // รีเซ็ต input
    selectedProductId.value = null
    selectedProductName.value = ''
    searchTerm.value = ''
    quantity.value = 1
}

const removeFromImportList = (idx) => {
    importList.value.splice(idx, 1)
}

const saveImport = async () => {
    if (importList.value.length === 0) {
        alert('ไม่มีรายการสินค้าให้เพิ่ม')
        return
    }
    try {
        await axios.post('/warehouse-stocks/import', {
            products: importList.value.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        })
        alert('บันทึกสำเร็จ')
        fetchWarehouseStock()
        closeModal()
    } catch (err) {
        console.error('Error saving import:', err)
        alert('เกิดข้อผิดพลาดในการบันทึก')
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

.add-product-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 1rem;
    font-size: 16px;
    transition: background-color 0.3s;
}

.add-product-btn:hover {
    background-color: #2c7a7b;
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

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 600px;
    max-width: 90%;
    box-shadow: var(--shadow);
    position: relative;
}

.modal-content h3 {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
    position: relative;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #444;
}

.form-group input[type="text"],
.form-group input[type="number"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
}

.quantity-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.quantity-group button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    user-select: none;
    transition: background-color 0.3s;
}

.quantity-group button:hover {
    background-color: #2c7a7b;
}

.quantity-group input[type="number"] {
    width: 80px;
    text-align: center;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 16px;
}

.push-btn {
    background-color: #38a169;
    padding: 8px 16px;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.push-btn:hover {
    background-color: #2f855a;
}

.dropdown {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    max-height: 180px;
    overflow-y: auto;
    width: 100%;
    z-index: 10;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgb(0 0 0 / 0.1);
}

.dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
}

.dropdown-item:hover {
    background-color: #f0f0f0;
}

.summary {
    margin-top: 20px;
}

.summary table {
    width: 100%;
    border-collapse: collapse;
}

.summary th,
.summary td {
    border: 1px solid var(--border-color);
    padding: 10px 12px;
    text-align: left;
}

.summary th {
    background-color: var(--secondary-color);
}

.modal-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.modal-actions button {
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.modal-actions button:last-child {
    background-color: #999;
}

.modal-actions button:hover {
    background-color: #2c7a7b;
}

.modal-actions button:last-child:hover {
    background-color: #666;
}

.stock-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    min-width: 80px;
    white-space: nowrap;
}

.badge-low {
    background-color: #f56565;
    /* แดง */
    color: white;
}

.badge-medium {
    background-color: #f6e05e;
    /* เหลือง */
    color: #4a5568;
}

.badge-high {
    background-color: #48bb78;
    /* เขียว */
    color: white;
}
</style>
