<template>
    <div class="warehouse-page">
        <div class="table-card">
            <!-- Header & Actions -->
            <!-- Header -->
            <div class="page-header-row">
                <div class="header-title-box">
                    <div class="header-icon-badge">
                        <i class="fas fa-warehouse"></i>
                    </div>
                    <div>
                        <h2 class="section-title">สินค้าในคลังหลัก</h2>
                        <p class="section-subtitle">ตรวจสอบสต็อกสินค้าคงคลัง จุดจัดเก็บ และสถานะความพร้อมจำหน่าย</p>
                    </div>
                </div>
            </div>

            <!-- Action Toolbar: Search on Left, Buttons on Far Right -->
            <div class="action-header">
                <div class="search-wrapper">
                    <i class="fas fa-search search-icon-main"></i>
                    <input
                        type="text"
                        v-model="tableSearchTerm"
                        @input="handleTableSearch"
                        placeholder="ค้นหารหัส, ชื่อสินค้า, หมวดหมู่..."
                        class="main-search-input"
                    />
                </div>

                <div class="buttons-wrapper">
                    <button class="btn btn-primary" @click="openModal">
                        <i class="fas fa-plus"></i>
                        <span>เพิ่มสินค้าเข้าคลัง</span>
                    </button>
                    <button class="btn btn-info" @click="openExcelModal">
                        <i class="fas fa-file-excel"></i>
                        <span>นำเข้าจาก Excel</span>
                    </button>
                </div>
            </div>

            <!-- Table -->
            <div class="table-responsive">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>รหัสสินค้า</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th>ยี่ห้อ</th>
                            <th class="text-right">จำนวนคงคลัง</th>
                            <th>หน่วย</th>
                            <th class="text-right">ราคาจำหน่าย</th>
                            <th>จุดจัดเก็บ</th>
                            <th class="text-center">สถานะสต็อก</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in warehouseStock" :key="item.id">
                            <td class="text-muted text-sm">{{ (page - 1) * perPage + index + 1 }}</td>
                            <td>
                                <span class="sku-chip">{{ item.product?.product_code || '-' }}</span>
                            </td>
                            <td class="font-medium">{{ item.product?.description || 'ไม่ระบุ' }}</td>
                            <td>
                                <span class="category-chip">{{ item.product?.category || '-' }}</span>
                            </td>
                            <td class="text-muted">{{ item.product?.brand || '-' }}</td>
                            <td class="text-right tabular-nums font-bold" :class="item.quantity === 0 ? 'text-danger' : ''">
                                {{ item.quantity.toLocaleString() }}
                            </td>
                            <td class="text-muted text-sm">{{ item.product?.unit || '-' }}</td>
                            <td class="text-right tabular-nums font-medium">฿{{ item.product?.sell_price?.toLocaleString() || '0' }}</td>
                            <td>
                                <span class="zone-badge" v-if="item.product?.zone">
                                    <i class="fas fa-location-dot"></i>
                                    {{ item.product?.zone }}
                                </span>
                                <span v-else class="text-muted text-sm">-</span>
                            </td>
                            <td class="text-center">
                                <span v-if="item.quantity === 0" class="stock-pill pill-empty">
                                    <i class="fas fa-circle-xmark"></i> หมด
                                </span>
                                <span v-else-if="(item.quantity / item.product.max_quantity * 100) < 20" class="stock-pill pill-low">
                                    <i class="fas fa-triangle-exclamation"></i> ใกล้หมด
                                </span>
                                <span v-else-if="(item.quantity / item.product.max_quantity * 100) >= 20 && (item.quantity / item.product.max_quantity * 100) < 50" class="stock-pill pill-medium">
                                    <i class="fas fa-circle-check"></i> ปานกลาง
                                </span>
                                <span v-else class="stock-pill pill-high">
                                    <i class="fas fa-circle-check"></i> มาก
                                </span>
                            </td>
                        </tr>
                        <tr v-if="warehouseStock.length === 0">
                            <td colspan="10" class="empty-state">
                                <i class="fas fa-boxes-packing"></i>
                                <p>{{ tableSearchTerm ? 'ไม่พบข้อมูลตรงกับคำค้นหา' : 'ไม่มีข้อมูลสินค้าในคลัง' }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="totalPages > 1">
                <button @click="goToPage(page - 1)" :disabled="page === 1" class="page-btn">
                    <i class="fas fa-chevron-left"></i>
                    <span>ก่อนหน้า</span>
                </button>
                <span>หน้า {{ page }} / {{ totalPages }}</span>
                <button @click="goToPage(page + 1)" :disabled="page === totalPages" class="page-btn">
                    <span>ถัดไป</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <!-- Manual Import Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal modal-md">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div>
                            <h3>เพิ่มสินค้าเข้าคลัง</h3>
                            <span class="modal-subtitle">บันทึกสต็อกสินค้าใหม่เข้าโกดังหลัก</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="form-group search-dropdown-group">
                        <label>
                            <i class="fas fa-magnifying-glass"></i>
                            <span>ค้นหาสินค้าในระบบ</span>
                        </label>
                        <div class="input-icon-wrap">
                            <input
                                type="text"
                                v-model="searchTerm"
                                placeholder="พิมพ์รหัสสินค้า หรือชื่อสินค้า..."
                                @input="handleSearchInput"
                                autocomplete="off"
                                class="form-control"
                            />
                        </div>
                        <div class="dropdown-list" v-if="searchResults.length">
                            <div
                                class="dropdown-item"
                                v-for="product in searchResults"
                                :key="product.id"
                                @click="selectProduct(product)"
                            >
                                <div class="item-main">{{ product.description }}</div>
                                <div class="item-sub">
                                    <span class="sku-tag">{{ product.product_code }}</span>
                                    <span>หมวดหมู่: {{ product.category }}</span>
                                    <span v-if="product.brand">| ยี่ห้อ: {{ product.brand }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group quantity-box-row">
                        <label>จำนวนที่ต้องการเพิ่ม</label>
                        <div class="quantity-stepper-wrap">
                            <div class="stepper-controls">
                                <button type="button" class="step-btn" @click="quantity = Math.max(1, quantity - 1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" v-model.number="quantity" min="1" class="step-input tabular-nums" />
                                <button type="button" class="step-btn" @click="quantity++">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="btn btn-primary push-add-btn" type="button" @click="addToImportList">
                                <i class="fas fa-plus"></i>
                                <span>เพิ่มลงรายการ</span>
                            </button>
                        </div>
                    </div>

                    <div v-if="importList.length" class="summary-box">
                        <div class="summary-title">
                            <i class="fas fa-list-check"></i>
                            <span>รายการที่จะนำเข้า ({{ importList.length }} รายการ)</span>
                        </div>
                        <div class="summary-table-wrap">
                            <table class="product-table modal-inner-table">
                                <thead>
                                    <tr>
                                        <th>ชื่อสินค้า</th>
                                        <th class="text-right">จำนวน</th>
                                        <th class="text-center" style="width: 70px;">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in importList" :key="idx">
                                        <td class="font-medium">{{ item.productName }}</td>
                                        <td class="text-right tabular-nums font-bold">{{ item.quantity }}</td>
                                        <td class="text-center">
                                            <button type="button" class="btn-icon-del" @click="removeFromImportList(idx)" title="ลบ">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeModal">ยกเลิก</button>
                    <button type="button" class="btn btn-primary" @click="saveImport" :disabled="!importList.length">
                        <i class="fas fa-check"></i>
                        <span>บันทึกเข้าคลัง</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Excel Modal -->
        <div v-if="showExcelModal" class="modal-overlay" @click.self="closeExcelModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge excel">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div>
                            <h3>นำเข้าสินค้าจากไฟล์ Excel / CSV</h3>
                            <span class="modal-subtitle">อัปโหลดไฟล์ข้อมูลสต็อกเพื่อนำเข้าพร้อมกันทีละหลายรายการ</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeExcelModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="excel-actions-card">
                        <input
                            type="file"
                            ref="fileInput"
                            accept=".xlsx, .xls, .csv"
                            style="display: none;"
                            @change="handleFileUpload"
                        />

                        <div class="upload-dropzone" @click="triggerFileUpload">
                            <i class="fas fa-cloud-arrow-up drop-icon"></i>
                            <p class="drop-text">คลิกเพื่อเลือกไฟล์ <strong>.xlsx</strong> หรือ <strong>.csv</strong></p>
                            <span class="drop-hint">ระบบจะทำการตรวจสอบรหัสสินค้าและความถูกต้องโดยอัตโนมัติ</span>
                        </div>

                        <button class="btn btn-secondary sample-btn" @click="downloadSampleFile">
                            <i class="fas fa-download"></i>
                            <span>ดาวน์โหลดไฟล์ตัวอย่าง CSV</span>
                        </button>
                    </div>

                    <div class="excel-preview" v-if="excelData.length">
                        <div class="preview-header">
                            <span class="preview-title">
                                <i class="fas fa-table-list"></i>
                                ตัวอย่างข้อมูล ({{ excelData.length }} รายการ)
                            </span>
                        </div>
                        <div class="table-wrapper">
                            <table class="product-table modal-inner-table">
                                <thead>
                                    <tr>
                                        <th>รหัสสินค้า</th>
                                        <th>ชื่อสินค้า</th>
                                        <th class="text-right">จำนวน</th>
                                        <th>หน่วย</th>
                                        <th class="text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, idx) in excelData" :key="idx">
                                        <td>
                                            <span class="sku-chip">{{ row.product_code }}</span>
                                        </td>
                                        <td class="font-medium">{{ row.product_name || '-' }}</td>
                                        <td class="text-right tabular-nums font-bold">{{ row.quantity }}</td>
                                        <td class="text-muted">{{ row.unit || '-' }}</td>
                                        <td class="text-center">
                                            <span :class="['stock-pill', row.valid ? 'pill-high' : 'pill-empty']">
                                                {{ row.valid ? 'พร้อมนำเข้า' : 'ข้อมูลไม่ครบ' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeExcelModal">ยกเลิก</button>
                    <button type="button" class="btn btn-primary" @click="saveExcelImport" :disabled="!excelData.length">
                        <i class="fas fa-file-import"></i>
                        <span>ยืนยันการนำเข้าข้อมูล</span>
                    </button>
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
const perPage = 1000

// --- Search State (New) ---
const tableSearchTerm = ref('')
let tableSearchTimeout = null

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
                perPage: perPage,
                search: tableSearchTerm.value // ส่งค่าค้นหาไปที่ API
            }
        })
        warehouseStock.value = res.data.data
        meta.value = res.data.meta
        totalPages.value = res.data.meta?.last_page || 1
    } catch (err) {
        console.error('Error fetching warehouse stock:', err)
    }
}

// --- Search Handler (New) ---
const handleTableSearch = () => {
    if (tableSearchTimeout) clearTimeout(tableSearchTimeout)
    tableSearchTimeout = setTimeout(() => {
        page.value = 1 // รีเซ็ตไปหน้าแรกเมื่อค้นหา
        fetchWarehouseStock()
    }, 500) // Debounce 500ms
}

const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        page.value = newPage
        fetchWarehouseStock() // เรียก fetchWarehouseStock แทนการพึ่ง watch
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
                perPage: perPage
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
// watch(page, fetchWarehouseStock) // เอาออกแล้วเรียกใน goToPage แทนเพื่อความชัดเจน
</script>

<style scoped>
.warehouse-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* Page Header & Action Bar */
.page-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
}

.header-title-box {
    display: flex;
    align-items: center;
    gap: 14px;
}

.header-icon-badge {
    width: 46px;
    height: 46px;
    background: #ecfeff;
    color: #0891b2;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
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

.action-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 20px;
    gap: 16px;
}

.search-wrapper {
    position: relative;
    width: 360px;
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

.buttons-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
}

/* Data Table Tags & Chips */
.sku-chip {
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary-color);
    background: var(--primary-light);
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.02em;
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

/* Status Pills */
.stock-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
}

.pill-empty {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.pill-low {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
}

.pill-medium {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}

.pill-high {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
}

.font-medium {
    font-weight: 500;
}

.font-bold {
    font-weight: 700;
}

.text-right {
    text-align: right;
}

.text-center {
    text-align: center;
}

.text-danger {
    color: #dc2626;
}

.text-muted {
    color: var(--text-muted);
}

.text-sm {
    font-size: 0.82rem;
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

/* Modals */
.modal-md {
    max-width: 600px;
    width: 95%;
}

.modal-lg {
    max-width: 850px;
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

.modal-icon-badge {
    width: 44px;
    height: 44px;
    background: var(--primary-light);
    color: var(--primary-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.modal-icon-badge.excel {
    background: #ecfdf5;
    color: #059669;
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
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: calc(85vh - 140px);
    overflow-y: auto;
}

.search-dropdown-group {
    position: relative;
}

.form-group label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.form-group label i {
    color: var(--primary-color);
}

.dropdown-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    max-height: 220px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: var(--shadow-lg);
    margin-top: 4px;
}

.dropdown-item {
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: #f8fafc;
}

.item-main {
    font-weight: 600;
    font-size: 0.88rem;
    color: var(--text-primary);
}

.item-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
}

.sku-tag {
    background: var(--primary-light);
    color: var(--primary-color);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
}

/* Stepper Quantity */
.quantity-stepper-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stepper-controls {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #ffffff;
}

.step-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: #f8fafc;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}

.step-btn:hover {
    background: #e2e8f0;
}

.step-input {
    width: 60px;
    height: 40px;
    border: none;
    text-align: center;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    outline: none;
}

.push-add-btn {
    height: 40px;
    padding: 0 18px;
}

.summary-box {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
}

.summary-title {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.summary-table-wrap {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: #ffffff;
    overflow: hidden;
}

.btn-icon-del {
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    transition: background 0.15s;
}

.btn-icon-del:hover {
    background: #fef2f2;
}

/* Excel dropzone */
.excel-actions-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
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

.excel-preview {
    margin-top: 10px;
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
    max-height: 260px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
}

.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

@media (max-width: 768px) {
    .page-header-row {
        flex-direction: column;
        align-items: stretch;
    }

    .action-header {
        flex-direction: column;
        align-items: stretch;
    }

    .search-wrapper {
        width: 100%;
    }

    .buttons-wrapper {
        flex-direction: column;
    }

    .buttons-wrapper button {
        width: 100%;
        justify-content: center;
    }

    .quantity-stepper-wrap {
        flex-direction: column;
        align-items: stretch;
    }

    .push-add-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>