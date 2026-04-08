<template>
    <div class="product-table-container">
        <h2 class="no-print">รายการสินค้าในรถ</h2>

        <div class="top-controls no-print">
            <div class="truck-select-container">
                <label for="truck-select">เลือกทะเบียนรถ:</label>
                <select id="truck-select" v-model="selectedTruckId" @change="fetchTruckStocks(1)">
                    <option value="" disabled>-- เลือกรถ --</option>
                    <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                        {{ truck.plate_number }} - {{ truck?.user?.fullname || 'ยังไม่ได้มอบหมาย' }}
                    </option>
                </select>
            </div>

            <div class="right-actions">
                <div class="search-box truck-search">
                    <input type="text" placeholder="ค้นหาสินค้าในรถ..." v-model="truckSearchKeyword"
                        @input="debouncedTruckSearch" :disabled="!selectedTruckId" />
                    <i class="fas fa-search"></i>
                </div>

                <div class="button-group">
                    <button class="add-stock-btn" @click="openAddModal" :disabled="!selectedTruckId">
                        <i class="fas fa-plus"></i> เพิ่มสินค้า
                    </button>
                    <button :class="[
                        'refill-btn',
                        { 'refill-success': isRefillConfirmed, 'refill-error': isRefillInsufficient },
                    ]" @click="openRefillDateModal" :disabled="!selectedTruckId || loading || isRefillInitiated">
                        <span v-if="isRefillInsufficient">
                            <i class="fas fa-exclamation-triangle"></i> สินค้าไม่พอ
                        </span>
                        <span v-else-if="isRefillConfirmed"> <i class="fas fa-check"></i> พร้อมยืนยัน </span>
                        <span v-else> <i class="fas fa-sync-alt"></i> เติมสินค้าจากยอดที่ขายไป </span>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="no-print">กำลังโหลดข้อมูล...</div>
        <div v-else-if="error" class="error-msg no-print">{{ error }}</div>

        <div v-else class="no-print">
            <table class="product-table" v-if="truckStocks.length > 0">
                <thead>
                    <tr>
                        <th>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th>หมวดหมู่</th>
                        <th>ยี่ห้อ</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="stock in truckStocksWithSoldQuantities" :key="stock.id">
                        <td>{{ stock.sku }}</td>
                        <td>{{ stock.product.description }}</td>
                        <td>{{ stock.product.category }}</td>
                        <td>{{ stock.product.brand || '-' }}</td>
                        <td>
                            {{ stock.quantity }}
                            <span v-if="stock.soldQuantity > 0" class="sold-quantity">
                                (+{{ stock.soldQuantity }})
                            </span>
                        </td>
                        <td>{{ stock.product.unit || '-' }}</td>

                        <td v-if="stock.quantity > 0">
                            <button class="return-btn" @click="openReturnModal(stock)" title="return-btn">
                                ตีกลับโกดัง
                            </button>
                        </td>
                        <td v-else>
                            <button disabled class="return-btn disabled-btn" @click="openReturnModal(stock)"
                                title="return-btn">
                                ตีกลับโกดัง
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else>
                <p>ไม่มีข้อมูลสินค้าในรถคันนี้</p>
            </div>

            <div class="pagination" v-if="truckStocks.length > 0">
                <button @click="changeTruckPage(truckPage - 1)" :disabled="truckPage === 1">
                    ก่อนหน้า
                </button>
                <span>หน้า {{ truckPage }} / {{ truckTotalPages }}</span>
                <button @click="changeTruckPage(truckPage + 1)" :disabled="truckPage === truckTotalPages">
                    ถัดไป
                </button>
            </div>
        </div>

        <div v-if="addedProducts.length > 0" class="added-summary no-print">
            <h3>สินค้าที่จะย้ายเข้า รถ {{ selectedTruckPlate }}</h3>
            <table class="product-table">
                <thead>
                    <tr>
                        <th>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th>สถานะ</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in addedProducts" :key="item.productId">
                        <td>SKU-{{ item.productId }}</td>
                        <td>{{ item.description }}</td>
                        <td class="quantity-control-cell"
                            style="display: flex; gap: 5px; justify-content: center; align-items: center;">
                            <button class="qty-btn" @click="decrementAddedQuantity(item)"
                                :disabled="item.quantity <= 0">
                                -
                            </button>

                            <input type="number" min="0" :max="item.maxQuantity" v-model.number="item.quantity"
                                @input="checkSufficiency(item)" @blur="validateAddedQuantity(item)"
                                style="width: 70px; text-align: center" />

                            <button class="qty-btn" @click="incrementAddedQuantity(item)"
                                :disabled="item.quantity >= item.maxQuantity">
                                +
                            </button>
                        </td>
                        <td>{{ item.unit }}</td>
                        <td>
                            <span v-if="item.quantity === 0" class="excluded-indicator"
                                style="color: #d97706; font-weight: bold;">
                                🟡 ยกเว้นการเติม
                            </span>
                            <span v-else-if="insufficientProducts.includes(item.productId)"
                                class="insufficient-indicator" style="color: #e53e3e; font-weight: bold;">
                                🔴 ไม่พอ
                            </span>
                            <span v-else class="sufficient-indicator" style="color: #38a169; font-weight: bold;">
                                🟢 พอ
                            </span>
                        </td>
                        <td>
                            <button class="remove-btn" @click="removeProductFromList(item.productId)" title="ลบสินค้า">
                                &times;
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="summary-buttons">
                <button class="cancel-btn" @click="cancelRefill">ยกเลิก</button>
                <button class="save-btn" @click="saveRefillData" :disabled="saving || hasInsufficientStockComputed">
                    {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
                </button>
            </div>
        </div>

        <div v-if="showAddModal" class="modal-overlay no-print" @click.self="closeAddModal">
            <div class="modal large-modal">
                <h3>เลือกสินค้าในคลัง</h3>
                <div class="search-box">
                    <input type="text" placeholder="ค้นหาสินค้าในคลัง..." v-model="searchKeyword"
                        @input="debouncedFetchWarehouseStocks" />
                    <i class="fas fa-search"></i>
                </div>

                <table class="product-table">
                    <thead>
                        <tr>
                            <th>รหัส</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th>ยี่ห้อ</th>
                            <th>จำนวนในคลัง</th>
                            <th>หน่วย</th>
                            <th>เพิ่มจำนวน</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in warehouseStocks" :key="item.id">
                            <td>{{ item.product.product_code }}</td>
                            <td>{{ item.product.description }}</td>
                            <td>{{ item.product.category }}</td>
                            <td>{{ item.product.brand || '-' }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ item.product.unit || '-' }}</td>
                            <td class="quantity-control-cell">
                                <button class="qty-btn" @click="decrementQuantity(item.id)"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] <= 1">
                                    -
                                </button>
                                <input type="number" min="1" :max="item.quantity"
                                    v-model.number="addQuantities[item.id]" style="width: 70px; text-align: center" />
                                <button class="qty-btn" @click="incrementQuantity(item.id, item.quantity)"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] >= item.quantity">
                                    +
                                </button>

                                <button v-if="addQuantities[item.id] > item.quantity" class="add-btn not-enough-btn"
                                    disabled>
                                    ไม่พอ
                                </button>
                                <button v-else class="add-btn"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] < 1"
                                    @click="addProductToList(item)">
                                    Add
                                </button>
                            </td>
                        </tr>
                        <tr v-if="warehouseStocks.length === 0">
                            <td colspan="7" style="text-align: center">ไม่พบสินค้าที่ค้นหา</td>
                        </tr>
                    </tbody>
                </table>

                <div class="pagination">
                    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
                        ก่อนหน้า
                    </button>
                    <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
                        ถัดไป
                    </button>
                </div>

                <button class="close-btn" @click="closeAddModal">ปิด</button>
            </div>
        </div>

        <div v-if="showSuccessModal" class="modal-overlay no-print">
            <div class="modal success-modal">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>บันทึกข้อมูลสำเร็จ!</h3>
                <p>ทำการเพิ่มสินค้าเข้าสู่รถเรียบร้อยแล้ว</p>
                <div class="modal-buttons centered-buttons">
                    <button class="print-btn" @click="printRefillNote"
                        style="background-color: #607d8b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-print"></i> พิมพ์
                    </button>

                    <button class="csv-btn" @click="downloadCSV">
                        <i class="fas fa-file-csv"></i> Download CSV
                    </button>
                    <button class="modal-cancel-btn" @click="closeSuccessModal">ปิด</button>
                </div>
            </div>
        </div>

        <div v-if="showReturnModal" class="modal-overlay no-print">
            <div class="modal success-modal">
                <h3>ยืนยันการตีสินค้ากลับโกดัง</h3>
                <p>ระบุจำนวนที่ต้องการตีกลับโกดัง</p>
                <br />

                <div class="product-detail" style="text-align: center">
                    <p>
                        <strong>{{ selectedProduct?.product.description }}</strong>
                    </p>
                    <p class="sub-text">รหัส: {{ selectedProduct?.product.product_code }}</p>
                    <p class="sub-text">
                        จำนวนทั้งหมดในรถ: {{ selectedProduct?.quantity }} {{ selectedProduct?.product.unit }}
                    </p>
                </div>

                <div class="return-qty-control">
                    <label>จำนวนที่จะคืน:</label>
                    <div class="qty-wrapper">
                        <button class="qty-btn" @click="decrementReturnQty" :disabled="returnQuantity <= 1">
                            <i class="fas fa-minus"></i>
                        </button>

                        <input type="number" v-model.number="returnQuantity" @input="validateReturnInput"
                            class="qty-input" />

                        <button class="qty-btn" @click="incrementReturnQty"
                            :disabled="returnQuantity >= selectedProduct?.quantity">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="modal-buttons centered-buttons">
                    <button class="modal-cancel-btn" @click="closeReturnModal">ยกเลิก</button>
                    <button class="modal-confirm-btn" @click="returnProduct"
                        :disabled="returnQuantity <= 0 || returnQuantity > selectedProduct?.quantity">
                        ยืนยัน ({{ returnQuantity }})
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showRefillDateModal" class="modal-overlay no-print" @click.self="closeRefillDateModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>เลือกช่วงเวลาที่ขาย</h3>
                </div>

                <div class="date-filter-container">
                    <div class="form-group">
                        <label>ตั้งแต่วันที่</label>
                        <input type="date" v-model="refillStartDate" class="date-input" />
                    </div>
                    <div class="form-group">
                        <label>ถึงวันที่</label>
                        <input type="date" v-model="refillEndDate" class="date-input" />
                    </div>
                    <div>
                        <input type="checkbox" id="includePreorders" v-model="includePreorder" />
                        <label for="includePreorders">รวมสินค้าพรีออเดอร์</label>
                    </div>
                    <div class="form-group button-wrapper">
                        <button class="search-action-btn" @click="refillFromSoldProducts" :disabled="loading">
                            <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-search'"></i> ค้นหา
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <div class="printable-area print-only receipt-layout">
            <div class="receipt-header">
                <h2>BRIGHT MOTOR STORE</h2>
                <p>ใบเบิกสินค้า / ขนของขึ้นรถ</p>
                <div class="dashed-line"></div>
                <div class="receipt-info-row">
                    <span>วันที่: {{ new Date().toLocaleDateString('th-TH') }}</span>
                    <span>เวลา: {{ new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                    }}</span>
                </div>
                <div class="receipt-info-row">
                    <span>รถขนส่ง: {{ selectedTruckPlate }}</span>
                </div>
                <div class="dashed-line"></div>
            </div>

            <div class="receipt-items">
                <div v-for="item in addedProducts" :key="item.productId" class="receipt-item-row">
                    <div class="item-name">
                        <span>{{ item.description }}</span>
                        <span class="item-zone" v-if="item.zone">จุดเก็บ : {{ item.zone }}</span>
                    </div>
                    <div class="item-calc">
                        <span>{{ item.quantity }} {{ item.unit }}</span>
                    </div>
                </div>
            </div>

            <div class="dashed-line"></div>

            <div class="receipt-footer">
                <div class="receipt-total-row">
                    <span>รวมจำนวนรายการ:</span>
                    <span class="grand-total">{{ addedProducts.length }}</span>
                </div>
                <br><br>
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <div style="text-align: center;">
                        <p>.......................................</p>
                        <p>ผู้เบิกสินค้า</p>
                    </div>
                    <div style="text-align: center;">
                        <p>.......................................</p>
                        <p>ผู้ตรวจสอบ</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from '@/lib/axios'
import * as XLSX from 'xlsx'
import moment from 'moment'

// [เพิ่ม] ฟังก์ชันสั่งพิมพ์
const printRefillNote = () => {
    console.log(addedProducts.value)
    window.print()
}

const showRefillDateModal = ref(false)
const refillStartDate = ref(moment().subtract(1, 'days').format('YYYY-MM-DD')) // Default เมื่อวาน
const refillEndDate = ref(moment().format('YYYY-MM-DD'))

const trucks = ref([])
const returnQuantity = ref(1)
const selectedTruckId = ref('')
const truckSearchKeyword = ref('')
const truckStocks = ref([])
const loading = ref(false)
const error = ref(null)
const soldProducts = ref([])
const isRefillConfirmed = ref(false)
const isRefillInsufficient = ref(false)
const insufficientProducts = ref([])
const isRefillInitiated = ref(false)

const selectedProduct = ref({})

// Truck Stock Pagination State
const truckPage = ref(1)
const truckTotalPages = ref(1)

const showAddModal = ref(false)
const showReturnModal = ref(false)
const warehouseStocks = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const addQuantities = ref({})
const includePreorder = ref(false)
const addedProducts = ref([])
const saving = ref(false)

const showSuccessModal = ref(false)
const lastSavedData = ref([])

let debounceTimeout = null
function debounce(func, delay) {
    return (...args) => {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

const selectedTruckPlate = computed(() => {
    const truck = trucks.value.find((t) => t.id === selectedTruckId.value)
    return truck ? truck.plate_number : ''
})

const hasInsufficientStockComputed = computed(() => {
    return addedProducts.value.some((item) => insufficientProducts.value.includes(item.productId))
})

watch(hasInsufficientStockComputed, (newVal) => {
    isRefillInsufficient.value = newVal
    isRefillConfirmed.value = !newVal
})

const truckStocksWithSoldQuantities = computed(() => {
    if (soldProducts.value.length === 0) {
        return truckStocks.value.map((stock) => ({
            ...stock,
            soldQuantity: 0,
            sku: `${stock.product.product_code}`,
        }))
    }

    const soldProductsMap = new Map()
    soldProducts.value.forEach((soldItem) => {
        if (soldProductsMap.has(soldItem.productId)) {
            soldProductsMap.set(
                soldItem.productId,
                soldProductsMap.get(soldItem.productId) + soldItem.quantity,
            )
        } else {
            soldProductsMap.set(soldItem.productId, soldItem.quantity)
        }
    })

    return truckStocks.value.map((stock) => {
        const soldQty = soldProductsMap.get(stock.product_id) || 0
        return {
            ...stock,
            soldQuantity: soldQty,
            sku: `SKU-${stock.product_id}`,
        }
    })
})

watch(selectedTruckId, () => {
    isRefillConfirmed.value = false
    isRefillInsufficient.value = false
    addedProducts.value = []
    isRefillInitiated.value = false
})

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks?perPage=100')
        trucks.value = res.data.data
    } catch (err) {
        error.value = 'โหลดข้อมูลรถไม่สำเร็จ'
        console.error(err)
    }
}

// Updated fetchTruckStocks with pagination
const fetchTruckStocks = async (page = 1) => {
    if (!selectedTruckId.value) {
        truckStocks.value = []
        return
    }
    loading.value = true
    error.value = null
    truckPage.value = page // Update current page state

    try {
        // Sending pagination params
        const res = await axios.get(`/trucks/${selectedTruckId.value}/stocks`, {
            params: {
                page: page,
                perPage: 30,
                search: truckSearchKeyword.value,
            },
        })
        truckStocks.value = res.data.data
        // Assuming backend returns meta for pagination
        truckTotalPages.value = res.data.meta?.last_page || 1

        soldProducts.value = []
        isRefillConfirmed.value = false
        isRefillInsufficient.value = false
    } catch (err) {
        error.value = 'โหลดข้อมูลสินค้าในรถไม่สำเร็จ'
        console.error(err)
    } finally {
        loading.value = false
    }
}

const changeTruckPage = (page) => {
    if (page < 1 || page > truckTotalPages.value) return
    fetchTruckStocks(page)
}

const fetchWarehouseStocks = async () => {
    if (!selectedTruckId.value) return
    loading.value = true
    try {
        const res = await axios.get('/warehouse-stocks', {
            params: {
                page: currentPage.value,
                perPage: 1000,
                search: searchKeyword.value,
            },
        })
        warehouseStocks.value = res.data.data
        warehouseStocks.value.forEach((item) => {
            if (!addQuantities.value[item.id]) {
                addQuantities.value[item.id] = 1
            }
        })
        totalPages.value = res.data.meta.last_page
    } catch (err) {
        console.error('โหลดสินค้าในคลังไม่สำเร็จ', err)
    } finally {
        loading.value = false
    }
}

const debouncedFetchWarehouseStocks = debounce(fetchWarehouseStocks, 500)
const debouncedTruckSearch = debounce(() => {
    fetchTruckStocks(1)
}, 500)

const addProductToList = (item) => {
    const quantity = addQuantities.value[item.id]
    if (!quantity || quantity < 1 || quantity > item.quantity) return

    const existIndex = addedProducts.value.findIndex((p) => p.productId === item.product_id)
    if (existIndex !== -1) {
        addedProducts.value[existIndex].quantity += quantity
        checkSufficiency(addedProducts.value[existIndex])
    } else {
        addedProducts.value.push({
            productId: item.product_id,
            product_code: item.product.product_code,
            description: item.product.description,
            quantity: quantity,
            maxQuantity: item.quantity,
            unit: item.product.unit || '-',
            zone: item.product.zone,
        })
    }
    addQuantities.value[item.id] = null
}

const removeProductFromList = (productId) => {
    addedProducts.value = addedProducts.value.filter((p) => p.productId !== productId)
}

const openAddModal = () => {
    if (!selectedTruckId.value) {
        alert('กรุณาเลือกทะเบียนรถก่อน')
        return
    }
    currentPage.value = 1
    searchKeyword.value = ''
    addQuantities.value = {}
    fetchWarehouseStocks()
    showAddModal.value = true
}

const openReturnModal = (stock) => {
    selectedProduct.value = stock
    returnQuantity.value = stock.quantity
    showReturnModal.value = true
}

const closeAddModal = () => {
    showAddModal.value = false
}

const closeReturnModal = () => {
    showReturnModal.value = false
}

const changePage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    fetchWarehouseStocks()
}

const openRefillDateModal = () => {
    // Reset วันที่เป็นค่า default ทุกครั้งที่เปิด หรือจะจำค่าเดิมไว้ก็ได้
    refillStartDate.value = moment().subtract(1, 'days').format('YYYY-MM-DD')
    refillEndDate.value = moment().format('YYYY-MM-DD')
    showRefillDateModal.value = true
}

const closeRefillDateModal = () => {
    showRefillDateModal.value = false
}

const saveRefillData = async () => {
    if (addedProducts.value.length === 0) return

    saving.value = true
    try {
        const payload = {
            truckId: selectedTruckId.value,
            products: addedProducts.value
                .filter(item => item.quantity > 0) // [แก้ไข] กรองเอาเฉพาะที่ > 0 ส่งไป Backend
                .map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
        }
        await axios.post('/warehouse-stocks/move-to-truck', payload)

        lastSavedData.value = JSON.parse(JSON.stringify(addedProducts.value))
        showSuccessModal.value = true
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        console.error(err)
    } finally {
        saving.value = false
    }
}

const returnProduct = async () => {
    if (returnQuantity.value <= 0 || returnQuantity.value > selectedProduct.value.quantity) {
        alert('จำนวนไม่ถูกต้อง')
        return
    }
    try {
        await axios.post('/warehouse-stocks/move-to-warehouse', {
            truckId: selectedTruckId.value,
            productId: selectedProduct.value.product_id,
            quantity: returnQuantity.value,
        })
        fetchTruckStocks()
        closeReturnModal()
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        console.error(err)
    }
}

const downloadCSV = () => {
    const dataToExport = lastSavedData.value.map((item) => ({
        'รหัสสินค้า (ID)': item.productId,
        ชื่อสินค้า: item.description,
        จำนวนที่เติม: item.quantity,
        หน่วย: item.unit,
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AddedProducts')

    const dateStr = new Date().toISOString().slice(0, 10)
    const fileName = `เติมสินค้า_${selectedTruckPlate.value}_${dateStr}.csv`

    XLSX.writeFile(wb, fileName)
}

const closeSuccessModal = () => {
    showSuccessModal.value = false
    lastSavedData.value = []

    addedProducts.value = []
    soldProducts.value = []
    isRefillConfirmed.value = false
    isRefillInsufficient.value = false
    insufficientProducts.value = []
    isRefillInitiated.value = false

    fetchTruckStocks()
}

const refillFromSoldProducts = async () => {
    if (!refillStartDate.value || !refillEndDate.value) {
        alert('กรุณาเลือกช่วงเวลา')
        return
    }

    loading.value = true
    isRefillConfirmed.value = false
    isRefillInsufficient.value = false
    isRefillInitiated.value = true
    addedProducts.value = []
    soldProducts.value = []
    insufficientProducts.value = []

    try {
        // จัด Format วันที่ให้ครอบคลุมทั้งวัน (00:00:00 - 23:59:59)
        const start = moment(refillStartDate.value).format('YYYY-MM-DD 00:00:00')
        const end = moment(refillEndDate.value).format('YYYY-MM-DD 23:59:59')

        // แก้ไข URL string: เปลี่ยน ? ตัวที่ 2,3 เป็น &
        const response = await axios.get(
            `/sell-logs?truck_id=${selectedTruckId.value}&include_preorder=${includePreorder.value}&start_date=${start}&end_date=${end}&limit=1000`,
        )
        const soldQuantitiesMap = {}

        response.data.data.forEach((log) => {
            log.items.forEach((item) => {
                soldQuantitiesMap[item.product_id] =
                    (soldQuantitiesMap[item.product_id] || 0) + item.quantity
            })
        })

        const productsToAdd = []
        const productIds = Object.keys(soldQuantitiesMap)

        // ... (Logic วน loop เช็ค stock เหมือนเดิม) ...
        for (const productId of productIds) {
            const quantityNeeded = soldQuantitiesMap[productId]
            try {
                const warehouseRes = await axios.get(`/warehouse-stocks/${productId}`)
                const warehouseItem = warehouseRes.data.find(
                    (item) => item.product_id === parseInt(productId),
                )

                if (!warehouseItem || warehouseItem.quantity < quantityNeeded) {
                    insufficientProducts.value.push(parseInt(productId))
                }

                if (warehouseItem) {
                    productsToAdd.push({
                        productId: warehouseItem.product_id,
                        description: warehouseItem.product.description,
                        quantity: quantityNeeded,
                        maxQuantity: warehouseItem.quantity,
                        unit: warehouseItem.product.unit || '-',
                        zone: warehouseItem.product.zone || '-',
                    })
                }
            } catch (err) {
                insufficientProducts.value.push(parseInt(productId))
            }
        }

        addedProducts.value = productsToAdd
        soldProducts.value = addedProducts.value.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }))

        // [เพิ่ม] ปิด Modal เมื่อโหลดข้อมูลเสร็จ
        closeRefillDateModal()
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลยอดขาย')
        console.error(err)
    } finally {
        loading.value = false
    }
}
const decrementQuantity = (id) => {
    if (addQuantities.value[id] && addQuantities.value[id] > 1) {
        addQuantities.value[id]--
    }
}

const incrementQuantity = (id, max) => {
    if (addQuantities.value[id] < max) {
        addQuantities.value[id]++
    }
}

const decrementReturnQty = () => {
    if (returnQuantity.value > 1) returnQuantity.value--
}

const incrementReturnQty = () => {
    if (returnQuantity.value < selectedProduct.value.quantity) returnQuantity.value++
}

const cancelRefill = () => {
    addedProducts.value = []
    soldProducts.value = []
    insufficientProducts.value = []
    isRefillConfirmed.value = false
    isRefillInsufficient.value = false
    isRefillInitiated.value = false
    addQuantities.value = {}
}

const validateReturnInput = () => {
    if (returnQuantity.value === '' || returnQuantity.value === null) return

    const max = selectedProduct.value.quantity
    if (returnQuantity.value > max) {
        returnQuantity.value = max
    } else if (returnQuantity.value < 1) {
        returnQuantity.value = 1
    }
}

// --- [เพิ่ม] ฟังก์ชันจัดการจำนวนสินค้าที่จะเติมเข้ารถ ---

const decrementAddedQuantity = (item) => {
    if (item.quantity > 0) { // [แก้ไข] เปลี่ยนจาก > 1 เป็น > 0
        item.quantity--;
        checkSufficiency(item);
    }
}

const incrementAddedQuantity = (item) => {
    // ดักไว้อีกชั้น: ให้บวกได้ก็ต่อเมื่อจำนวนยังน้อยกว่าในคลัง
    if (item.quantity < item.maxQuantity) {
        item.quantity++;
        checkSufficiency(item);
    }
}

const validateAddedQuantity = (item) => {
    if (item.quantity === '' || item.quantity < 0) {
        item.quantity = 0;
    }
    if (item.quantity > item.maxQuantity) {
        item.quantity = item.maxQuantity;
    }
    checkSufficiency(item);
}

const checkSufficiency = (item) => {
    const currentQty = item.quantity || 0;

    if (currentQty > item.maxQuantity) {
        if (!insufficientProducts.value.includes(item.productId)) {
            insufficientProducts.value.push(item.productId);
        }
    } else {
        insufficientProducts.value = insufficientProducts.value.filter(id => id !== item.productId);
    }
}

onMounted(() => {
    fetchTrucks()
})
</script>

<style scoped>
/* (Styles เดิมทั้งหมด คงไว้ตามที่คุณส่งมา) */
.refill-success {
    background-color: #28a745 !important;
    cursor: default !important;
}

.refill-error {
    background-color: #dc3545 !important;
    cursor: default !important;
}

.sold-quantity {
    color: #28a745;
    font-weight: bold;
    margin-left: 5px;
}

.insufficient-indicator {
    color: #dc3545;
    font-weight: bold;
}

.sufficient-indicator {
    color: #28a745;
    font-weight: bold;
}

.summary-buttons {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.cancel-btn:hover {
    background-color: #5a6268;
}

.product-table-container {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.product-table-container h2 {
    margin-bottom: 1rem;
    font-size: 24px;
}

.top-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 10px;
}

.truck-select-container label {
    font-weight: 600;
    color: #555;
}

.truck-select-container select {
    padding: 10px 15px;
    font-size: 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    min-width: 250px;
    cursor: pointer;
    transition: border-color 0.3s;
}

.truck-select-container select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.add-stock-btn {
    background-color: #38a169;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.add-stock-btn:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
}

.add-stock-btn:hover:not(:disabled) {
    background-color: #2f855a;
}

.refill-btn {
    background-color: #f6ad55;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.refill-btn:disabled {
    background-color: #fbd38d;
    cursor: not-allowed;
}

.refill-btn:hover:not(:disabled) {
    background-color: #dd6b20;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0;
}

.product-table thead tr {
    background-color: var(--secondary-color);
    text-align: left;
}

.product-table th,
.product-table td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
    font-size: 14px;
}

.product-table tbody tr:hover {
    background-color: #f9f9f9;
}

.error-msg {
    color: #e53e3e;
    font-weight: 600;
}

.added-summary {
    margin-top: 2rem;
}

.added-summary h3 {
    margin-bottom: 0.5rem;
}

.save-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
    background-color: #2c7a7b;
}

.remove-btn {
    background: transparent;
    border: none;
    color: #e53e3e;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    padding: 0 8px;
    line-height: 1;
}

.remove-btn:hover {
    color: #a02828;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 50px;
    z-index: 999;
}

.modal {
    background: white;
    padding: 20px;
    width: 90%;
    max-width: 900px;
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.large-modal {
    max-height: 80vh;
    overflow-y: auto;
}

.modal h3 {
    margin-bottom: 1rem;
}

.close-btn {
    margin-top: 15px;
    background-color: #f44336;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    cursor: pointer;
}

.qty-btn {
    background-color: #3b82f6;
    border: none;
    color: white;
    font-weight: 700;
    font-size: 20px;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qty-btn:hover {
    background-color: #2563eb;
}

.qty-btn:disabled {
    background-color: #e5e7eb;
    cursor: not-allowed;
    color: #9ca3af;
}

.quantity-control-cell {
    display: flex;
    align-items: center;
}

.add-btn {
    background-color: #38a169;
    border: none;
    padding: 5px 10px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    margin-left: 8px;
}

.add-btn:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
}

.not-enough-btn {
    background-color: #e53e3e !important;
    color: white !important;
    cursor: not-allowed;
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
    color: white;
}

.return-btn {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    min-width: 80px;
    white-space: nowrap;
    background-color: #f56565;
    color: white;
    cursor: pointer;
}

.disabled-btn {
    background-color: #feb2b2;
    cursor: not-allowed;
}

.badge-medium {
    background-color: #f6e05e;
    color: #4a5568;
}

.badge-high {
    background-color: #48bb78;
    color: white;
}

.success-modal {
    max-width: 400px;
    text-align: center;
    padding: 30px;
    margin-top: 15vh;
    align-self: flex-start;
}

.success-icon {
    font-size: 50px;
    color: #28a745;
    margin-bottom: 15px;
}

.centered-buttons {
    justify-content: center;
    gap: 15px;
    margin-top: 25px;
    display: flex;
}

.csv-btn {
    background-color: #3182ce;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.3s;
}

.csv-btn:hover {
    background-color: #2b6cb0;
}

.modal-cancel-btn {
    background-color: #e53e3e;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.modal-cancel-btn:hover {
    background-color: #c53030;
}

.modal-confirm-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.modal-confirm-btn:hover {
    background-color: #1c6e2f;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
    align-items: center;
}

.pagination button {
    padding: 5px 10px;
    border: 1px solid #ccc;
    background-color: white;
    cursor: pointer;
    border-radius: 4px;
}

.pagination button:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
    color: #aaa;
}

.top-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
}

.right-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.truck-search {
    position: relative;
}

.truck-search input {
    padding: 8px 30px 8px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 250px;
}

.truck-search i {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
}

.sub-text {
    font-size: 0.9em;
    color: #666;
    margin: 5px 0;
}

.return-qty-control {
    margin: 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.qty-wrapper {
    display: flex;
    align-items: center;
    gap: 5px;
}

.qty-input {
    width: 80px;
    text-align: center;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1.1em;
    font-weight: bold;
    -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.date-filter-container {
    display: flex;
    align-items: flex-end;
    gap: 15px;
    padding: 20px 0;
    justify-content: center;
}

.date-input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 0.9em;
}

.search-action-btn {
    padding: 9px 20px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
}

.search-action-btn:hover {
    background-color: #2563eb;
}

.search-action-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
}

/* ซ่อน print-only ในหน้าจอปกติ */
.print-only {
    display: none;
}
</style>

<style>
@media print {

    /* 1. Reset พื้นที่กระดาษ */
    @page {
        size: auto;
        margin: 0mm;
    }

    /* 2. สั่ง Body ให้หดตัวเท่าเนื้อหา */
    html,
    body {
        width: 100%;
        height: fit-content !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: white;
        overflow: hidden !important;
        font-family: 'Courier New', Courier, monospace;
        /* Font แบบ PreOrder */
        font-size: 12px;
        color: #000;
    }

    /* 3. ซ่อนเนื้อหาอื่นแบบ Invisible */
    body * {
        visibility: hidden;
        height: 0;
        overflow: hidden;
    }

    /* 4. ดึงพื้นที่พิมพ์ออกมาแสดง */
    .printable-area {
        visibility: visible !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: fit-content !important;
        background: white !important;
        margin: 0 !important;
        padding: 20px !important;
        /* เพิ่ม Padding นิดหน่อย */
        z-index: 999999 !important;
        display: block !important;
    }

    /* 5. แสดงลูกหลานของพื้นที่พิมพ์ */
    .printable-area * {
        visibility: visible !important;
        height: auto;
    }

    /* 6. Toggle View */
    .no-print {
        display: none !important;
    }

    .print-only {
        display: block !important;
    }

    /* 7. Receipt Styling (Copy จาก PreOrder) */
    .receipt-layout {
        width: 100%;
        max-width: 800px;
        /* จำกัดความกว้างให้อ่านง่าย */
        margin: 0 auto;
    }

    .receipt-header {
        text-align: center;
        margin-bottom: 10px;
    }

    .receipt-header h2 {
        font-size: 16px;
        font-weight: bold;
        margin: 0;
    }

    .receipt-header p {
        font-size: 24px;
        margin: 2px 0;
    }

    .receipt-info-row {
        display: flex;
        justify-content: space-between;
        font-size: 24px;
    }

    .dashed-line {
        border-top: 1px dashed #000;
        margin: 5px 0;
        width: 100%;
        display: block;
    }

    .receipt-item-row {
        margin-bottom: 5px;
    }

    .item-name {
        display: flex;
        justify-content: space-between;
        /* ดันซ้าย-ขวา */
        align-items: baseline;
        /* จัดแนวบรรทัดให้สวยงาม */
        font-size: 24px;
        font-weight: bold;
        width: 100%;
        /* ให้กว้างเต็มพื้นที่ */
    }

    /* [เพิ่ม] ปรับขนาดตัวอักษรจุดเก็บให้เล็กลงนิดหน่อย (Optional) */
    .item-zone {
        font-size: 18px;
        font-weight: normal;
        margin-left: 10px;
        /* เว้นระยะห่างเผื่อชื่อสินค้าสั้น */
        white-space: nowrap;
        /* ห้ามตัดบรรทัด */
    }

    .item-calc {
        display: flex;
        justify-content: space-between;
        font-size: 24px;
        padding-left: 10px;
    }

    .receipt-total-row {
        display: flex;
        justify-content: space-between;
        font-size: 32px;
        font-weight: bold;
    }

    .receipt-footer {
        text-align: center;
        margin-top: 10px;
        font-size: 24px;
    }
}

/* ซ่อนในหน้าจอปกติ */
.print-only {
    display: none;
}
</style>