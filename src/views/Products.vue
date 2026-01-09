<script setup>
import { ref, onMounted } from 'vue'
import axios from '../lib/axios'
import * as XLSX from 'xlsx'

const products = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const perPage = ref(10)
const totalPages = ref(1)
const searchKeyword = ref('')
const searchTimeout = ref(null)

const editModalOpen = ref(false)
const editProduct = ref({})

// --- CSV Import State ---
const csvModalOpen = ref(false)
const csvData = ref([])
const fileInput = ref(null)
const isUploading = ref(false)

// --- Fetch & Basic CRUD ---
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

function openEditModal(product) {
    editProduct.value = { ...product }
    editModalOpen.value = true
}

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
            zone: editProduct.value.zone,
            max_quantity: editProduct.value.max_quantity || 100
        })
        alert('บันทึกการแก้ไขเรียบร้อย')
        editModalOpen.value = false
        fetchProducts()
    } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการบันทึก')
    }
}

const handleSearch = (e) => {
    clearTimeout(searchTimeout.value)
    searchKeyword.value = e.target.value
    searchTimeout.value = setTimeout(() => {
        currentPage.value = 1
        fetchProducts()
    }, 500)
}

// --- CSV Logic ---

const openCsvModal = () => {
    csvData.value = []
    if (fileInput.value) fileInput.value.value = ''
    csvModalOpen.value = true
}

const triggerFileUpload = () => {
    fileInput.value.click()
}

const downloadTemplate = () => {
    // สร้างไฟล์ตัวอย่าง CSV
    const header = "product_code,category,description,brand,model,cost_price,sell_price,unit,zone,max_quantity\n"
    const example = "P001,อะไหล่เครื่อง,ลูกสูบ Wave110i,Honda,Wave110i,100,150,ชิ้น,A1,100"

    // สร้าง Blob พร้อม BOM เพื่อให้ Excel อ่านภาษาไทยออก
    const blob = new Blob(["\uFEFF" + header + example], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "product_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            // Map ข้อมูลให้ตรงกับ API (product_code, category, etc.)
            csvData.value = jsonData.map(row => ({
                product_code: row['product_code'] || row['รหัสสินค้า'] || '',
                category: row['category'] || row['หมวดหมู่'] || '',
                description: row['description'] || row['ชื่อสินค้า'] || '',
                brand: row['brand'] || row['ยี่ห้อ'] || '',
                model: row['model'] || row['รุ่น'] || '',
                cost_price: row['cost_price'] || row['ราคาทุน'] || 0,
                sell_price: row['sell_price'] || row['ราคาขาย'] || 0,
                unit: row['unit'] || row['หน่วย'] || '',
                zone: row['zone'] || row['จุดเก็บ'] || ''
            })).filter(item => item.product_code && item.description) // กรองแถวว่างทิ้ง

        } catch (err) {
            console.error(err)
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์')
        }
    }
    reader.readAsArrayBuffer(file)
}

const saveCsvImport = async () => {
    if (csvData.value.length === 0) return
    isUploading.value = true

    try {
        // ยิงไปที่ API bulkStore
        // Payload: { products: [ ... ] }
        await axios.post('/products/bulk-store', {
            products: csvData.value
        })

        alert(`นำเข้าสินค้า ${csvData.value.length} รายการสำเร็จ`)
        csvModalOpen.value = false
        fetchProducts() // โหลดข้อมูลใหม่
    } catch (err) {
        console.error(err)
        // จัดการ Error กรณีรหัสซ้ำ (จาก Backend code ที่คุณให้มา: status 401)
        if (err.response && err.response.data && err.response.data.duplicateProducts) {
            const duplicates = err.response.data.duplicateProducts.join(', ')
            alert(`นำเข้าไม่สำเร็จ! มีรหัสสินค้าซ้ำในระบบ: \n${duplicates}`)
        } else {
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล')
        }
    } finally {
        isUploading.value = false
    }
}

onMounted(() => {
    fetchProducts()
})
</script>

<template>
    <div class="product-table-container">
        <h2>รายการสินค้าทั้งหมด</h2>

        <div class="header-actions">
            <div class="search-box">
                <input type="text" placeholder="ค้นหาสินค้า..." @input="handleSearch" />
                <i class="fas fa-search"></i>
            </div>

            <div class="action-buttons">
                <router-link to="/products/add" class="btn btn-primary">
                    <i class="fas fa-plus"></i> เพิ่มสินค้าใหม่
                </router-link>

                <button @click="openCsvModal" class="btn btn-info">
                    <i class="fas fa-file-csv"></i> นำเข้า CSV
                </button>
            </div>
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
                            <button class="action-btn edit-btn" @click="openEditModal(product)">
                                <i class="fas fa-pen-to-square"></i>
                            </button>
                            <button class="action-btn delete-btn" @click="deleteProduct(product.id)">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="products.length === 0">
                        <td colspan="8">ไม่มีข้อมูลสินค้า</td>
                    </tr>
                </tbody>
            </table>

            <div class="pagination">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
                <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
            </div>
        </div>

        <div v-if="editModalOpen" class="modal-backdrop" @click.self="editModalOpen = false">
            <div class="modal">
                <h2 class="modal-title">แก้ไขสินค้า</h2>
                <form @submit.prevent="saveEdit" class="product-form">
                    <div class="form-group"><label>หมวดหมู่</label><input v-model="editProduct.category" required />
                    </div>
                    <div class="form-group"><label>ชื่อสินค้า</label><input v-model="editProduct.description"
                            required /></div>
                    <div class="form-group"><label>ยี่ห้อ</label><input v-model="editProduct.brand" /></div>
                    <div class="form-group"><label>รุ่น</label><input v-model="editProduct.model" /></div>
                    <div class="form-group"><label>ราคาทุน</label><input type="number" v-model="editProduct.cost_price"
                            required /></div>
                    <div class="form-group"><label>ราคาขาย</label><input type="number" v-model="editProduct.sell_price"
                            required /></div>
                    <div class="form-group"><label>หน่วย</label><input v-model="editProduct.unit" required /></div>
                    <div class="form-group"><label>จุดเก็บ</label><input v-model="editProduct.zone" /></div>
                    <div class="form-group"><label>ค่าแสดงเปอร์เซ็นต์</label>
                        <h6 style="color: #666;padding-bottom: 5px;">(ใช้แสดงค่ามากน้อยในสต็อกเท่านั้น
                            หากมีจำนวนมากเกินที่กรอก = สินค้ามีมาก)</h6>
                        <input type="number" v-model="editProduct.max_quantity" />
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-save">บันทึก</button>
                        <button type="button" class="btn-cancel" @click="editModalOpen = false">ยกเลิก</button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="csvModalOpen" class="modal-backdrop" @click.self="csvModalOpen = false">
            <div class="modal-content">
                <h2>นำเข้าสินค้าจาก CSV</h2>

                <div class="csv-actions">
                    <input type="file" ref="fileInput" accept=".csv, .xlsx" style="display: none;"
                        @change="handleFileUpload" />
                    <button class="excel-btn upload-btn" @click="triggerFileUpload">
                        <i class="fas fa-upload"></i> อัพโหลดไฟล์
                    </button>
                    <button class="excel-btn download-btn" @click="downloadTemplate">
                        <i class="fas fa-download"></i> โหลดไฟล์ตัวอย่าง
                    </button>
                </div>

                <div v-if="csvData.length > 0" class="csv-preview">
                    <h4>ตัวอย่างข้อมูล ({{ csvData.length }} รายการ)</h4>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>รหัส</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>ราคาขาย</th>
                                    <th>หน่วย</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, index) in csvData.slice(0, 100)" :key="index">
                                    <td>{{ row.product_code }}</td>
                                    <td>{{ row.description }}</td>
                                    <td>{{ row.sell_price }}</td>
                                    <td>{{ row.unit }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p v-if="csvData.length > 100" style="text-align: center; color: #666; margin-top: 5px;">
                        (แสดง 100 รายการแรกจาก {{ csvData.length }})
                    </p>
                </div>
                <div v-else class="empty-state">
                    ยังไม่มีข้อมูล กรุณาอัพโหลดไฟล์ CSV หรือ Excel
                </div>

                <div class="form-actions">
                    <button class="btn-save" @click="saveCsvImport" :disabled="csvData.length === 0 || isUploading">
                        {{ isUploading ? 'กำลังบันทึก...' : 'ยืนยันนำเข้า' }}
                    </button>
                    <button class="btn-cancel" @click="csvModalOpen = false">ปิด</button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* Layout Styles */
.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

/* Button Styles */
.btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    transition: background 0.2s;
}

.btn-primary {
    background: #38a169;
    color: white;
}

.btn-primary:hover {
    background: #2f855a;
}

.btn-info {
    background: #3182ce;
    color: white;
}

.btn-info:hover {
    background: #2b6cb0;
}

.btn-outline {
    background: transparent;
    border: 1px solid #ccc;
    color: #333;
}

.btn-outline:hover {
    background: #f0f0f0;
}

/* Modal & Form Styles (Reuse existing) */
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
    overflow-y: auto;
}

.large-modal {
    max-width: 800px;
}

/* CSV Styles */
.csv-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
}

.csv-preview {
    margin-bottom: 1.5rem;
}

.table-wrapper {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 6px;
}

.table-wrapper table {
    width: 100%;
    border-collapse: collapse;
}

.table-wrapper th,
.table-wrapper td {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
    font-size: 0.9rem;
}

.table-wrapper th {
    background: #f7fafc;
    position: sticky;
    top: 0;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: #999;
    border: 2px dashed #eee;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

/* Original Styles */
.search-box {
    position: relative;
}

.search-box input {
    padding: 10px 15px 10px 40px;
    border: 1px solid #ddd;
    border-radius: 20px;
    width: 300px;
}

.search-box i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.product-table th,
.product-table td {
    padding: 12px;
    border: 1px solid #eee;
    text-align: left;
}

.product-table th {
    background: #f7fafc;
    font-weight: 600;
}

.action-btn {
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;
    color: white;
}

.edit-btn {
    background: #4299e1;
}

.delete-btn {
    background: #e53e3e;
}

.product-form .form-group {
    margin-bottom: 1rem;
}

.product-form label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: 500;
}

.product-form input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 1.5rem;
}

.btn-save {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-cancel {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.pagination {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 1rem;
}

.upload-btn {
    background-color: #ebf8ff;
    color: #3182ce;
    border-color: #3182ce;
}

.upload-btn:hover {
    background-color: #bee3f8;
}

.download-btn {
    background-color: #f0fff4;
    color: #38a169;
    border-color: #38a169;
}

.download-btn:hover {
    background-color: #c6f6d5;
}

.excel-btn {
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 600px;
    max-width: 90%;
    box-shadow: var(--shadow);
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-content h2 {
    margin-bottom: 20px;
}
</style>