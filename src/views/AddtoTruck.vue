<template>
    <div class="product-table-container">
        <h2 class="no-print">รายการสินค้าในรถ</h2>

        <div class="top-controls no-print">
            <div class="truck-select-container">
                <label for="truck-select">เลือกทะเบียนรถ:</label>
                <select id="truck-select" v-model="selectedTruckId" @change="onTruckChange">
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
                        <th>จำนวน(preorder)</th>
                        <th>จำนวนที่ขายได้</th>
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
                        <td>
                            <span :class="{ 'preorder-quantity': stock.preOrderQuantity > 0 }">
                                {{ stock.preOrderQuantity || 0 }}
                            </span>
                        </td>
                        <td>
                            <span :class="{
                                'negative-quantity': stock.availableQuantity < 0,
                                'positive-quantity': stock.availableQuantity > 0,
                            }">
                                {{ stock.availableQuantity }}
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
                        <td class="quantity-control-cell quantity-control-centered">
                            <button class="qty-btn" @click="decrementAddedQuantity(item)"
                                :disabled="item.quantity <= 0">
                                -
                            </button>

                            <input type="number" min="0" :max="item.maxQuantity" v-model.number="item.quantity"
                                @input="checkSufficiency(item)" @blur="validateAddedQuantity(item)"
                                class="qty-inline-input" />

                            <button class="qty-btn" @click="incrementAddedQuantity(item)"
                                :disabled="item.quantity >= item.maxQuantity">
                                +
                            </button>
                        </td>
                        <td>{{ item.unit }}</td>
                        <td>
                            <span v-if="item.quantity === 0" class="excluded-indicator">
                                🟡 ยกเว้นการเติม
                            </span>
                            <span v-else-if="insufficientProducts.includes(item.productId)"
                                class="insufficient-indicator">
                                🔴 ไม่พอ
                            </span>
                            <span v-else class="sufficient-indicator">
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
                                    v-model.number="addQuantities[item.id]" class="qty-inline-input" />
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
                            <td colspan="7" class="text-center">ไม่พบสินค้าที่ค้นหา</td>
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
                    <button class="print-btn" @click="printRefillNote">
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

                <div class="product-detail text-center">
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
                        <input type="checkbox" id="includePreorders" v-model="includePreorder" true-value="all" false-value="except-preorder" />
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

        <Teleport to="body">
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
                    <div class="signature-row">
                        <div class="text-center">
                            <p>.......................................</p>
                            <p>ผู้เบิกสินค้า</p>
                        </div>
                        <div class="text-center">
                            <p>.......................................</p>
                            <p>ผู้ตรวจสอบ</p>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

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

// Pre-order State
const preOrders = ref([])
const preOrderItems = ref([])
const preOrderLoading = ref(false)

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
const includePreorder = ref('except-preorder')
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

const preOrderQuantitiesMap = computed(() => {
    const map = new Map()
    preOrderItems.value.forEach((item) => {
        const pId = item.product_id || item.productId
        const qty = Number(item.quantity) || 0
        if (pId) {
            map.set(Number(pId), (map.get(Number(pId)) || 0) + qty)
        }
    })
    return map
})

const truckStocksWithSoldQuantities = computed(() => {
    const poQtyMap = preOrderQuantitiesMap.value

    const soldProductsMap = new Map()
    if (soldProducts.value.length > 0) {
        soldProducts.value.forEach((soldItem) => {
            const pId = soldItem.productId || soldItem.product_id
            if (pId) {
                soldProductsMap.set(
                    pId,
                    (soldProductsMap.get(pId) || 0) + soldItem.quantity,
                )
            }
        })
    }

    return truckStocks.value.map((stock) => {
        const soldQty = soldProductsMap.get(stock.product_id) || 0
        const preOrderQty = poQtyMap.get(Number(stock.product_id)) || 0
        const availableQty = (Number(stock.quantity) || 0) - preOrderQty
        return {
            ...stock,
            soldQuantity: soldQty,
            preOrderQuantity: preOrderQty,
            availableQuantity: availableQty,
            sku: stock.product?.product_code || `SKU-${stock.product_id}`,
        }
    })
})

watch(selectedTruckId, (newVal) => {
    includePreorder.value = 'except-preorder'
    isRefillConfirmed.value = false
    isRefillInsufficient.value = false
    addedProducts.value = []
    isRefillInitiated.value = false
    if (!newVal) {
        preOrders.value = []
        preOrderItems.value = []
    }
})

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks', { params: { perPage: 100 } })
        trucks.value = res.data.data
    } catch (err) {
        error.value = 'โหลดข้อมูลรถไม่สำเร็จ'
        console.error(err)
    }
}

// Fetch Pre-orders for selected truck
const fetchPreOrders = async (status = 'Pending') => {
    if (!selectedTruckId.value) {
        preOrders.value = []
        preOrderItems.value = []
        return
    }
    preOrderLoading.value = true
    try {
        const params = {
            truckId: selectedTruckId.value,
            limit: 1000,
        }
        if (status) {
            params.status = status
        }
        const res = await axios.get('/pre-orders', { params })
        preOrders.value = res.data.data || []
        console.log('📦 Fetched pre-orders for truck:', selectedTruckId.value, preOrders.value)

        // Loop เพื่อเอา item ของแต่ละรายการออกมา (ผ่าน /pre-orders/:id)
        if (preOrders.value.length > 0) {
            const detailResults = await Promise.allSettled(
                preOrders.value.map((po) => axios.get(`/pre-orders/${po.id}`))
            )
            const allItems = []
            detailResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value?.data) {
                    const poData = result.value.data
                    if (Array.isArray(poData.items)) {
                        allItems.push(...poData.items)
                    }
                }
            })
            preOrderItems.value = allItems
            console.log('📦 Fetched pre-order items:', preOrderItems.value)
        } else {
            preOrderItems.value = []
        }
    } catch (err) {
        console.error('โหลดข้อมูล Pre-order ไม่สำเร็จ:', err)
    } finally {
        preOrderLoading.value = false
    }
}

const onTruckChange = () => {
    fetchTruckStocks(1)
    fetchPreOrders()
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
/* ===========================================
   AddtoTruck.vue - Page-specific styles only
   Shared styles: see common.css and print.css
   =========================================== */

/* --- Refill Button States --- */
.refill-success {
    background-color: #28a745 !important;
    cursor: default !important;
}

.refill-error {
    background-color: #dc3545 !important;
    cursor: default !important;
}

/* --- Quantity Indicators --- */
.sold-quantity {
    color: #28a745;
    font-weight: bold;
    margin-left: 5px;
}

.preorder-quantity {
    color: #2563eb;
    font-weight: bold;
}

.negative-quantity {
    color: #dc3545;
    font-weight: bold;
}

.positive-quantity {
    color: #28a745;
    font-weight: bold;
}

.insufficient-indicator {
    color: #e53e3e;
    font-weight: bold;
}

.sufficient-indicator {
    color: #28a745;
    font-weight: bold;
}

.excluded-indicator {
    color: #d97706;
    font-weight: bold;
}

/* --- Layout --- */
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

.summary-buttons {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

.added-summary {
    margin-top: 2rem;
}

.added-summary h3 {
    margin-bottom: 0.5rem;
}

/* --- Truck Select --- */
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

/* --- Truck Search (override search-box for compact layout) --- */
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

/* --- Action Buttons --- */
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

/* --- Warehouse Modal Add Button --- */
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

/* --- Quantity Controls --- */
.quantity-control-cell {
    display: flex;
    align-items: center;
}

.quantity-control-centered {
    gap: 5px;
    justify-content: center;
}

.qty-inline-input {
    width: 70px;
    text-align: center;
}

/* --- Return to Warehouse --- */
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

/* --- Return Modal --- */
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

/* --- Modal Override (align-items: flex-start for this page) --- */
.modal-overlay {
    align-items: flex-start;
    padding-top: 50px;
}

/* --- Success Modal Buttons --- */
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

.print-btn {
    background-color: #607d8b;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* --- Refill Date Modal --- */
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

/* --- Utility --- */
.text-center {
    text-align: center;
}

/* --- Print Receipt (scoped styles for receipt layout) --- */
.signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
}
</style>