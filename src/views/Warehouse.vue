<template>
    <div class="product-table-container">
        <h2>รายการสินค้าในคลัง</h2>
        <br>

        <div class="action-header">
            <button class="add-product-btn" @click="openModal">
                <i class="fas fa-plus"></i> เพิ่มสินค้าเข้าคลัง
            </button>
            <button class="import-excel-btn" @click="openExcelModal">
                <i class="fas fa-file-excel"></i> นำเข้าจาก Excel
            </button>
        </div>

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
                    <td colspan="9" style="text-align:center">ไม่มีข้อมูลในคลัง</td>
                </tr>
            </tbody>
        </table>

        <div class="pagination">
            <button @click="goToPage(page - 1)" :disabled="page === 1">ก่อนหน้า</button>
            <span>หน้า {{ page }} / {{ totalPages }}</span>
            <button @click="goToPage(page + 1)" :disabled="page === totalPages">ถัดไป</button>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <h3>เพิ่มสินค้าเข้าคลัง</h3>

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

        <div v-if="showExcelModal" class="modal-overlay" @click.self="closeExcelModal">
            <div class="modal-content excel-modal">
                <h3>นำเข้าสินค้าจาก CSV</h3>

                <div class="excel-actions">
                    <input type="file" ref="fileInput" accept=".xlsx, .xls, .csv" style="display: none;"
                        @change="handleFileUpload" />

                    <button class="excel-btn upload-btn" @click="triggerFileUpload">
                        <i class="fas fa-upload"></i> อัพโหลดไฟล์
                    </button>
                    <button class="excel-btn download-btn" @click="downloadSampleFile">
                        <i class="fas fa-download"></i> โหลดไฟล์ตัวอย่าง
                    </button>
                </div>

                <div class="excel-preview" v-if="excelData.length">
                    <h4>ตัวอย่างข้อมูล ({{ excelData.length }} รายการ)</h4>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>รหัสสินค้า</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>จำนวน</th>
                                    <th>หน่วย</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, idx) in excelData" :key="idx">
                                    <td>{{ row.product_code }}</td>
                                    <td>{{ row.product_name || '-' }}</td>
                                    <td>{{ row.quantity }}</td>
                                    <td>{{ row.unit || '-' }}</td>
                                    <td :class="{ 'text-red': !row.valid }">
                                        {{ row.valid ? 'พร้อม' : 'ข้อมูลไม่ครบ' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <p>ยังไม่ได้เลือกไฟล์ หรือไฟล์ไม่มีข้อมูล</p>
                </div>

                <div class="modal-actions">
                    <button type="button" @click="saveExcelImport" :disabled="!excelData.length">บันทึก</button>
                    <button type="button" @click="closeExcelModal">ยกเลิก</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from '@/lib/axios'
import * as XLSX from 'xlsx' // ต้อง npm install xlsx ก่อน
import Swal from 'sweetalert2'

const warehouseStock = ref([])
const meta = ref(null)
const page = ref(1)
const totalPages = ref(1)
const perPage = 10

// Existing Modal State
const showModal = ref(false)
const searchTerm = ref('')
const searchResults = ref([])
const selectedProductId = ref(null)
const selectedProductName = ref('')
const quantity = ref(1)
const importList = ref([])

// Excel Modal State
const showExcelModal = ref(false)
const fileInput = ref(null)
const excelData = ref([])
const isValidating = ref(false)

let searchTimeout = null

// --- Core Functions ---
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

// --- Manual Add Modal Logic ---
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

// --- Excel Import Logic ---

const openExcelModal = () => {
    excelData.value = []
    if (fileInput.value) fileInput.value.value = ''
    showExcelModal.value = true
}

const closeExcelModal = () => {
    showExcelModal.value = false
    excelData.value = []
}

const triggerFileUpload = () => {
    fileInput.value.click()
}

const downloadSampleFile = () => {
    const csvContent = "product_code,quantity\nP001,10\nP002,5\nP003,20";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "warehouse_import_sample.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    isValidating.value = true // เริ่มโหลด status

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            // --- 1. เริ่มต้น Validate ไฟล์ ---
            const codeTracker = new Set() // เอาไว้เช็คตัวซ้ำ
            const validationErrors = [] // เก็บข้อความ Error
            let tempRows = []

            jsonData.forEach((row, index) => {
                const rowNum = index + 2 // แถวที่ 1 คือ Header, แถวที่ 2 คือ data แรก

                // ดึงค่าและแปลงให้เป็น String เพื่อความชัวร์
                const rawCode = row['product_code'] || row['Product Code'] || row['รหัสสินค้า']
                const rawQty = row['quantity'] || row['Quantity'] || row['จำนวน']

                const code = rawCode ? rawCode.toString().trim() : ''

                // ข้ามแถวว่างที่ไม่มีรหัสสินค้า
                if (!code) return

                // Check 1: ตรวจสอบจำนวน (ต้องเป็นตัวเลข และ > 0)
                const quantity = Number(rawQty)
                // เช็คว่าเป็น NaN หรือ น้อยกว่าเท่ากับ 0 หรือไม่
                if (isNaN(quantity) || quantity <= 0) {
                    validationErrors.push(`แถวที่ ${rowNum}: รหัส <b>${code}</b> มีจำนวนไม่ถูกต้อง ("${rawQty}")`)
                }

                // Check 2: ตรวจสอบรหัสซ้ำในไฟล์
                if (codeTracker.has(code)) {
                    validationErrors.push(`แถวที่ ${rowNum}: รหัสสินค้าซ้ำกันในไฟล์ (<b>${code}</b>)`)
                }
                codeTracker.add(code)

                // เก็บข้อมูลดิบไว้เตรียมไปเช็คต่อ
                tempRows.push({
                    product_code: code,
                    quantity: quantity,
                    product_name: '',
                    unit: '',
                    product_id: null,
                    valid: false
                })
            })

            // --- 2. หากพบ Error ให้หยุดทันที ---
            if (validationErrors.length > 0) {
                // แสดง Error 5 บรรทัดแรกพอ เดี๋ยวรก
                let errorHtml = '<div style="text-align: left; max-height: 200px; overflow-y: auto;">'
                errorHtml += validationErrors.join('<br/>')
                errorHtml += '</div>'

                Swal.fire({
                    title: 'ข้อมูลในไฟล์ไม่ถูกต้อง',
                    html: errorHtml,
                    icon: 'error',
                    confirmButtonText: 'ตกลง'
                })

                // ล้างค่าทิ้ง
                if (fileInput.value) fileInput.value.value = ''
                excelData.value = []
                isValidating.value = false
                return // *** หยุดการทำงานตรงนี้ ***
            }

            // ถ้าไม่มีข้อมูลเลย
            if (tempRows.length === 0) {
                Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลในไฟล์ หรือรูปแบบไฟล์ไม่ถูกต้อง', 'error')
                if (fileInput.value) fileInput.value.value = ''
                excelData.value = []
                isValidating.value = false
                return
            }

            // --- 3. ผ่าน Validation เบื้องต้น -> ยิง API เช็คว่ามีสินค้าในระบบจริงไหม ---
            const codesToCheck = [...codeTracker] // แปลง Set กลับเป็น Array

            const res = await axios.post('/products/validate-codes', { codes: codesToCheck })
            const foundProducts = res.data

            // ตรวจสอบสินค้าที่ไม่พบในฐานข้อมูล
            const foundCodes = foundProducts.map(p => p.product_code)
            const missingCodes = codesToCheck.filter(c => !foundCodes.includes(c))

            if (missingCodes.length > 0) {
                let errorMsg = `ไม่พบรหัสสินค้าในระบบจำนวน ${missingCodes.length} รายการ:<br/>`
                errorMsg += `<b>${missingCodes.slice(0, 5).join(', ')}</b>`
                if (missingCodes.length > 5) errorMsg += '... และอื่นๆ'

                Swal.fire({
                    title: 'ข้อมูลไม่ถูกต้อง',
                    html: errorMsg,
                    icon: 'error',
                    confirmButtonText: 'ตกลง'
                })

                if (fileInput.value) fileInput.value.value = ''
                excelData.value = []
                isValidating.value = false
                return
            }

            // --- 4. Map ข้อมูลสำเร็จ ---
            excelData.value = tempRows.map(row => {
                const product = foundProducts.find(p => p.product_code === row.product_code)
                return {
                    ...row,
                    product_id: product.id,
                    product_name: product.description,
                    unit: product.unit,
                    valid: true
                }
            })

        } catch (err) {
            console.error("Excel processing error:", err)
            Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการประมวลผลไฟล์', 'error')
            excelData.value = []
        } finally {
            isValidating.value = false
        }
    }
    reader.readAsArrayBuffer(file)
}

const saveExcelImport = async () => {
    if (excelData.value.length === 0) return

    try {
        await axios.post('/warehouse-stocks/import', {
            // ส่ง product_id และ quantity ไปบันทึก (Format เดียวกับ Manual Import)
            products: excelData.value.map(item => ({
                productId: item.product_id,
                quantity: item.quantity
            }))
        })

        Swal.fire('สำเร็จ', `นำเข้าข้อมูล ${excelData.value.length} รายการเรียบร้อยแล้ว`, 'success')
        fetchWarehouseStock()
        closeExcelModal()
    } catch (err) {
        console.error('Error saving excel:', err)
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
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
    margin-bottom: 0;
    font-size: 24px;
    display: inline-block;
}

/* Action Header Layout */
.action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    margin-top: 1rem;
}

/* Buttons */
.add-product-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.add-product-btn:hover {
    background-color: #2c7a7b;
}

.import-excel-btn {
    background-color: #3182ce;
    /* สีฟ้า */
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.import-excel-btn:hover {
    background-color: #2b6cb0;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
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
    margin-top: 20px;
}

/* Modal Shared Styles */
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
    max-height: 90vh;
    overflow-y: auto;
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

.summary,
.excel-preview {
    margin-top: 20px;
    margin-bottom: 20px;
}

.summary table,
.excel-preview table {
    width: 100%;
    border-collapse: collapse;
}

.summary th,
.summary td,
.excel-preview th,
.excel-preview td {
    border: 1px solid var(--border-color);
    padding: 10px 12px;
    text-align: left;
}

.summary th,
.excel-preview th {
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

/* Excel Modal Specifics */
.excel-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 20px;
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

.table-wrapper {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.empty-state {
    text-align: center;
    color: #718096;
    padding: 30px;
    background: #f7fafc;
    border-radius: 8px;
    border: 1px dashed #cbd5e0;
}

.text-red {
    color: #e53e3e;
    font-weight: bold;
}

/* Badge Styles */
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
    color: white;
}

.badge-medium {
    background-color: #f6e05e;
    color: #4a5568;
}

.badge-high {
    background-color: #48bb78;
    color: white;
}
</style>