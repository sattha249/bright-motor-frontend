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
    <div class="products-page">
        <div class="table-card">
            <div class="page-header-row">
                <div class="header-title-box">
                    <div class="header-icon-badge">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <div>
                        <h2 class="section-title">สินค้าในระบบทั้งหมด</h2>
                        <p class="section-subtitle">จัดการแคตตาล็อกสินค้า ราคาทุน ราคาขาย และจุดจัดเก็บในคลัง</p>
                    </div>
                </div>

                <div class="header-actions">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon-main"></i>
                        <input
                            type="text"
                            placeholder="ค้นหารหัส, ชื่อสินค้า..."
                            @input="handleSearch"
                            class="main-search-input"
                        />
                    </div>

                    <div class="action-buttons">
                        <router-link to="/products/add" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            <span>เพิ่มสินค้าใหม่</span>
                        </router-link>

                        <button @click="openCsvModal" class="btn btn-info">
                            <i class="fas fa-file-csv"></i>
                            <span>นำเข้า CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading / Error / Table Content -->
            <div v-if="loading" class="state-container">
                <div class="loading-spinner"></div>
                <p>กำลังโหลดข้อมูลสินค้า...</p>
            </div>

            <div v-else-if="error" class="state-container error-state">
                <i class="fas fa-circle-exclamation"></i>
                <p>{{ error }}</p>
            </div>

            <div v-else>
                <div class="table-responsive">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>รหัสสินค้า</th>
                                <th>ชื่อสินค้า</th>
                                <th>หมวดหมู่</th>
                                <th class="text-right">ราคาทุน</th>
                                <th class="text-right">ราคาขาย</th>
                                <th>หน่วย</th>
                                <th>จุดเก็บ</th>
                                <th class="text-center">ค่าคำนวณ</th>
                                <th class="text-center" style="width: 100px;">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="product in products" :key="product.id">
                                <td>
                                    <span class="sku-chip">{{ product.product_code }}</span>
                                </td>
                                <td class="font-medium">{{ product.description }}</td>
                                <td>
                                    <span class="category-chip">{{ product.category }}</span>
                                </td>
                                <td class="text-right tabular-nums text-muted">
                                    ฿{{ parseFloat(product.cost_price).toFixed(2) }}
                                </td>
                                <td class="text-right tabular-nums font-bold text-success">
                                    ฿{{ parseFloat(product.sell_price).toFixed(2) }}
                                </td>
                                <td class="text-muted text-sm">{{ product.unit }}</td>
                                <td>
                                    <span class="zone-badge" v-if="product.zone">
                                        <i class="fas fa-location-dot"></i>
                                        {{ product.zone }}
                                    </span>
                                    <span v-else class="text-muted text-sm">-</span>
                                </td>
                                <td class="text-center tabular-nums text-muted text-sm">{{ product.max_quantity }}</td>
                                <td class="text-center">
                                    <div class="row-actions">
                                        <button class="action-btn edit-btn" @click="openEditModal(product)" title="แก้ไขสินค้า">
                                            <i class="fas fa-pen-to-square"></i>
                                        </button>
                                        <button class="action-btn delete-btn" @click="deleteProduct(product.id)" title="ลบสินค้า">
                                            <i class="fas fa-trash-can"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="products.length === 0">
                                <td colspan="9" class="empty-state">
                                    <i class="fas fa-box-open"></i>
                                    <p>ไม่พบรายการสินค้าในระบบ</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
                        <i class="fas fa-chevron-left"></i>
                        <span>ก่อนหน้า</span>
                    </button>
                    <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                    <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">
                        <span>ถัดไป</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <div v-if="editModalOpen" class="modal-overlay" @click.self="editModalOpen = false">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-pen-to-square"></i>
                        </div>
                        <div>
                            <h3>แก้ไขข้อมูลสินค้า</h3>
                            <span class="modal-subtitle">รหัสสินค้า: {{ editProduct.product_code }}</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="editModalOpen = false">&times;</button>
                </div>

                <form @submit.prevent="saveEdit">
                    <div class="modal-body">
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label>หมวดหมู่ <span class="required">*</span></label>
                                <input v-model="editProduct.category" required class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>ชื่อสินค้า <span class="required">*</span></label>
                                <input v-model="editProduct.description" required class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>ยี่ห้อ</label>
                                <input v-model="editProduct.brand" placeholder="เว้นว่างได้" class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>รุ่น</label>
                                <input v-model="editProduct.model" placeholder="เว้นว่างได้" class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>ราคาทุน (บาท) <span class="required">*</span></label>
                                <input type="number" step="0.01" v-model="editProduct.cost_price" required class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>ราคาขาย (บาท) <span class="required">*</span></label>
                                <input type="number" step="0.01" v-model="editProduct.sell_price" required class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>หน่วยนับ <span class="required">*</span></label>
                                <input v-model="editProduct.unit" required placeholder="เช่น ชิ้น, กล่อง" class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>จุดจัดเก็บ (Zone)</label>
                                <input v-model="editProduct.zone" placeholder="เช่น A1, Shelf-02" class="form-control" />
                            </div>
                            <div class="form-group full-width">
                                <label>ค่าแสดงเปอร์เซ็นต์ (Max Quantity)</label>
                                <span class="help-text">ใช้สำหรับคำนวณระดับสต็อก (หมด / ใกล้หมด / ปานกลาง / มาก)</span>
                                <input type="number" v-model="editProduct.max_quantity" class="form-control" />
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="editModalOpen = false">ยกเลิก</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-check"></i>
                            <span>บันทึกการแก้ไข</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- CSV Import Modal -->
        <div v-if="csvModalOpen" class="modal-overlay" @click.self="csvModalOpen = false">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge csv">
                            <i class="fas fa-file-csv"></i>
                        </div>
                        <div>
                            <h3>นำเข้าสินค้าจาก CSV / Excel</h3>
                            <span class="modal-subtitle">เพิ่มข้อมูลสินค้าหลายรายการพร้อมกันผ่านไฟล์สเปรดชีต</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="csvModalOpen = false">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="excel-actions-card">
                        <input
                            type="file"
                            ref="fileInput"
                            accept=".csv, .xlsx"
                            style="display: none;"
                            @change="handleFileUpload"
                        />
                        <div class="upload-dropzone" @click="triggerFileUpload">
                            <i class="fas fa-cloud-arrow-up drop-icon"></i>
                            <p class="drop-text">คลิกเพื่อเลือกไฟล์ <strong>.csv</strong> หรือ <strong>.xlsx</strong></p>
                            <span class="drop-hint">รองรับภาษาไทยด้วยการเข้ารหัส UTF-8 with BOM</span>
                        </div>

                        <button class="btn btn-secondary sample-btn" @click="downloadTemplate">
                            <i class="fas fa-download"></i>
                            <span>ดาวน์โหลดไฟล์แม่แบบ (Template CSV)</span>
                        </button>
                    </div>

                    <div v-if="csvData.length > 0" class="csv-preview">
                        <div class="preview-header">
                            <span class="preview-title">
                                <i class="fas fa-table-list"></i>
                                ข้อมูลในไฟล์ ({{ csvData.length }} รายการ)
                            </span>
                        </div>
                        <div class="table-wrapper">
                            <table class="product-table modal-inner-table">
                                <thead>
                                    <tr>
                                        <th>รหัสสินค้า</th>
                                        <th>ชื่อสินค้า</th>
                                        <th class="text-right">ราคาขาย</th>
                                        <th>หน่วย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, index) in csvData.slice(0, 100)" :key="index">
                                        <td>
                                            <span class="sku-chip">{{ row.product_code }}</span>
                                        </td>
                                        <td class="font-medium">{{ row.description }}</td>
                                        <td class="text-right tabular-nums font-bold">฿{{ parseFloat(row.sell_price || 0).toFixed(2) }}</td>
                                        <td class="text-muted">{{ row.unit }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-if="csvData.length > 100" class="preview-note">
                            * แสดงเฉพาะ 100 รายการแรกสำหรับการตรวจสอบเบื้องต้น
                        </p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="csvModalOpen = false">ปิด</button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="saveCsvImport"
                        :disabled="csvData.length === 0 || isUploading"
                    >
                        <i class="fas fa-file-import"></i>
                        <span>{{ isUploading ? 'กำลังนำเข้าข้อมูล...' : 'ยืนยันนำเข้าข้อมูล' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.products-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
}

.header-title-box {
    display: flex;
    align-items: center;
    gap: 14px;
}

.header-icon-badge {
    width: 46px;
    height: 46px;
    background: #eff6ff;
    color: #2563eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
}

.header-icon-badge.csv {
    background: #ecfdf5;
    color: #059669;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.section-subtitle {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 2px 0 0 0;
}

.header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.search-wrapper {
    position: relative;
    width: 280px;
    max-width: 100%;
}

.main-search-input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-family: inherit;
    background: #f8fafc;
    color: var(--text-primary);
    transition: all 0.2s ease;
}

.main-search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-icon-main {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 0.88rem;
    pointer-events: none;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Data Table Tags */
.sku-chip {
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary-color);
    background: var(--primary-light);
    padding: 3px 8px;
    border-radius: 6px;
}

.category-chip {
    font-size: 0.78rem;
    color: #475569;
    background: #f1f5f9;
    padding: 3px 8px;
    border-radius: 6px;
}

.zone-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #0369a1;
    background: #e0f2fe;
    padding: 3px 8px;
    border-radius: 6px;
}

.zone-badge i {
    font-size: 0.7rem;
}

.row-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.edit-btn {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}

.edit-btn:hover {
    background: #2563eb;
    color: #ffffff;
}

.delete-btn {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.delete-btn:hover {
    background: #dc2626;
    color: #ffffff;
}

/* Modals */
.modal-lg {
    max-width: 800px;
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
    max-height: calc(85vh - 140px);
    overflow-y: auto;
}

.form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.required {
    color: #dc2626;
}

.help-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 2px;
}

.form-control {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.92rem;
    font-family: inherit;
    color: var(--text-primary);
    background: #ffffff;
    transition: all 0.2s ease;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* CSV specifics */
.excel-actions-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 20px;
}

.upload-dropzone {
    border: 2px dashed #93c5fd;
    background: #eff6ff;
    border-radius: var(--radius-md);
    padding: 36px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.upload-dropzone:hover {
    border-color: #2563eb;
    background: #dbeafe;
}

.drop-icon {
    font-size: 2.4rem;
    color: #2563eb;
    margin-bottom: 10px;
}

.drop-text {
    font-size: 0.95rem;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.drop-hint {
    font-size: 0.78rem;
    color: #64748b;
}

.sample-btn {
    align-self: center;
    font-size: 0.85rem;
}

.preview-header {
    margin-bottom: 10px;
}

.preview-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}

.table-wrapper {
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
}

.preview-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 6px;
    text-align: center;
}

.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.state-container {
    text-align: center;
    padding: 48px 16px;
    color: var(--text-muted);
}

.loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px auto;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error-state {
    color: #dc2626;
}

.empty-state {
    text-align: center;
    padding: 48px 16px !important;
    color: #94a3b8;
}

.empty-state i {
    font-size: 2.5rem;
    margin-bottom: 8px;
    color: #cbd5e1;
}

@media (max-width: 768px) {
    .page-header-row {
        flex-direction: column;
        align-items: stretch;
    }

    .header-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .search-wrapper {
        width: 100%;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-buttons button,
    .action-buttons a {
        width: 100%;
        justify-content: center;
    }

    .form-grid-2 {
        grid-template-columns: 1fr;
    }
}
</style>