<template>
    <div class="add-to-truck-page">
        <div class="table-card no-print">
            <!-- Header -->
            <div class="page-header-row">
                <div class="header-title-box">
                    <div class="header-icon-badge">
                        <i class="fas fa-truck-fast"></i>
                    </div>
                    <div>
                        <h2 class="section-title">เบิกสินค้าเข้ารถขนส่ง</h2>
                        <p class="section-subtitle">เลือกทะเบียนรถเพื่อตรวจสอบสต็อกบนรถ เติมสินค้า หรือตีสินค้ากลับโกดัง</p>
                    </div>
                </div>

                <!-- Controls & Actions -->
                <div class="top-controls">
                    <div class="truck-select-group">
                        <label for="truck-select">
                            <i class="fas fa-truck"></i>
                            <span>ทะเบียนรถ:</span>
                        </label>
                        <div class="select-wrapper">
                            <select id="truck-select" v-model="selectedTruckId" @change="onTruckChange" class="truck-select">
                                <option value="" disabled>-- เลือกทะเบียนรถ --</option>
                                <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                                    {{ truck.plate_number }} - {{ truck?.user?.fullname || 'ยังไม่ได้มอบหมาย' }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="right-actions">
                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon-main"></i>
                            <input
                                type="text"
                                placeholder="ค้นหาสินค้าในรถ..."
                                v-model="truckSearchKeyword"
                                @input="debouncedTruckSearch"
                                :disabled="!selectedTruckId"
                                class="main-search-input"
                            />
                        </div>

                        <div class="button-group">
                            <button class="btn btn-primary" @click="openAddModal" :disabled="!selectedTruckId">
                                <i class="fas fa-plus"></i>
                                <span>เพิ่มสินค้า</span>
                            </button>
                            <button
                                :class="[
                                    'btn',
                                    isRefillConfirmed ? 'btn-success' : isRefillInsufficient ? 'btn-danger' : 'btn-warning',
                                ]"
                                @click="openRefillDateModal"
                                :disabled="!selectedTruckId || loading || isRefillInitiated"
                            >
                                <span v-if="isRefillInsufficient">
                                    <i class="fas fa-triangle-exclamation"></i> สินค้าไม่พอ
                                </span>
                                <span v-else-if="isRefillConfirmed">
                                    <i class="fas fa-check"></i> พร้อมยืนยัน
                                </span>
                                <span v-else>
                                    <i class="fas fa-arrows-rotate"></i> เติมจากยอดขาย
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading & Error -->
            <div v-if="loading" class="state-container">
                <div class="loading-spinner"></div>
                <p>กำลังโหลดข้อมูลสินค้าในรถ...</p>
            </div>
            <div v-else-if="error" class="state-container error-state">
                <i class="fas fa-circle-exclamation"></i>
                <p>{{ error }}</p>
            </div>

            <!-- Truck Stocks Table -->
            <div v-else>
                <div class="table-responsive" v-if="truckStocks.length > 0">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>รหัสสินค้า</th>
                                <th>ชื่อสินค้า</th>
                                <th>หมวดหมู่</th>
                                <th>ยี่ห้อ</th>
                                <th class="text-right">จำนวนบนรถ</th>
                                <th class="text-right">พรีออเดอร์</th>
                                <th class="text-right">ขายได้จริง</th>
                                <th>หน่วย</th>
                                <th class="text-center" style="width: 110px;">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="stock in truckStocksWithSoldQuantities" :key="stock.id">
                                <td>
                                    <span class="sku-chip">{{ stock.sku }}</span>
                                </td>
                                <td class="font-medium">{{ stock.product.description }}</td>
                                <td>
                                    <span class="category-chip">{{ stock.product.category }}</span>
                                </td>
                                <td class="text-muted">{{ stock.product.brand || '-' }}</td>
                                <td class="text-right tabular-nums font-bold">
                                    {{ stock.quantity }}
                                    <span v-if="stock.soldQuantity > 0" class="sold-quantity">
                                        (+{{ stock.soldQuantity }})
                                    </span>
                                </td>
                                <td class="text-right tabular-nums">
                                    <span :class="['po-pill', { 'has-po': stock.preOrderQuantity > 0 }]">
                                        {{ stock.preOrderQuantity || 0 }}
                                    </span>
                                </td>
                                <td class="text-right tabular-nums font-bold">
                                    <span :class="stock.availableQuantity < 0 ? 'text-danger' : 'text-success'">
                                        {{ stock.availableQuantity }}
                                    </span>
                                </td>
                                <td class="text-muted text-sm">{{ stock.product.unit || '-' }}</td>
                                <td class="text-center">
                                    <button
                                        v-if="stock.quantity > 0"
                                        class="btn-return"
                                        @click="openReturnModal(stock)"
                                        title="ตีกลับโกดัง"
                                    >
                                        <i class="fas fa-arrow-rotate-left"></i>
                                        <span>ตีกลับ</span>
                                    </button>
                                    <button
                                        v-else
                                        disabled
                                        class="btn-return disabled"
                                        title="ไม่มีสินค้าในรถ"
                                    >
                                        <i class="fas fa-arrow-rotate-left"></i>
                                        <span>ตีกลับ</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="empty-state">
                    <i class="fas fa-truck-ramp-box"></i>
                    <p>{{ selectedTruckId ? 'ไม่มีข้อมูลสินค้าในรถคันนี้' : 'กรุณาเลือกทะเบียนรถด้านบนเพื่อดูสต็อก' }}</p>
                </div>

                <div class="pagination" v-if="truckStocks.length > 0 && truckTotalPages > 1">
                    <button @click="changeTruckPage(truckPage - 1)" :disabled="truckPage === 1" class="page-btn">
                        <i class="fas fa-chevron-left"></i>
                        <span>ก่อนหน้า</span>
                    </button>
                    <span>หน้า {{ truckPage }} / {{ truckTotalPages }}</span>
                    <button @click="changeTruckPage(truckPage + 1)" :disabled="truckPage === truckTotalPages" class="page-btn">
                        <span>ถัดไป</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- Added Products Summary Box -->
            <div v-if="addedProducts.length > 0" class="added-summary-card">
                <div class="summary-header">
                    <div class="summary-title-badge">
                        <i class="fas fa-boxes-packing"></i>
                        <h3>สินค้าที่จะย้ายเข้า รถ {{ selectedTruckPlate }} ({{ addedProducts.length }} รายการ)</h3>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="product-table modal-inner-table">
                        <thead>
                            <tr>
                                <th>รหัส</th>
                                <th>ชื่อสินค้า</th>
                                <th class="text-center" style="width: 170px;">จำนวนที่จะเติม</th>
                                <th>หน่วย</th>
                                <th class="text-center">ความพร้อมในคลัง</th>
                                <th class="text-center" style="width: 60px;">ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in addedProducts" :key="item.productId">
                                <td>
                                    <span class="sku-chip">SKU-{{ item.productId }}</span>
                                </td>
                                <td class="font-medium">{{ item.description }}</td>
                                <td class="text-center">
                                    <div class="stepper-controls centered">
                                        <button
                                            type="button"
                                            class="step-btn"
                                            @click="decrementAddedQuantity(item)"
                                            :disabled="item.quantity <= 0"
                                        >
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            :max="item.maxQuantity"
                                            v-model.number="item.quantity"
                                            @input="checkSufficiency(item)"
                                            @blur="validateAddedQuantity(item)"
                                            class="step-input tabular-nums"
                                        />
                                        <button
                                            type="button"
                                            class="step-btn"
                                            @click="incrementAddedQuantity(item)"
                                            :disabled="item.quantity >= item.maxQuantity"
                                        >
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </td>
                                <td class="text-muted">{{ item.unit }}</td>
                                <td class="text-center">
                                    <span v-if="item.quantity === 0" class="stock-pill pill-medium">
                                        🟡 ยกเว้นการเติม
                                    </span>
                                    <span v-else-if="insufficientProducts.includes(item.productId)" class="stock-pill pill-empty">
                                        🔴 ในคลังไม่พอ
                                    </span>
                                    <span v-else class="stock-pill pill-high">
                                        🟢 ในคลังเพียงพอ
                                    </span>
                                </td>
                                <td class="text-center">
                                    <button class="btn-icon-del" @click="removeProductFromList(item.productId)" title="ลบสินค้า">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="summary-actions">
                    <button class="btn btn-secondary" @click="cancelRefill">
                        <i class="fas fa-xmark"></i>
                        <span>ยกเลิก</span>
                    </button>
                    <button class="btn btn-primary" @click="saveRefillData" :disabled="saving || hasInsufficientStockComputed">
                        <i class="fas fa-check"></i>
                        <span>{{ saving ? 'กำลังบันทึก...' : 'ยืนยันบันทึกเข้ารถ' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Modal (Warehouse Selection) -->
        <div v-if="showAddModal" class="modal-overlay no-print" @click.self="closeAddModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-boxes-stacked"></i>
                        </div>
                        <div>
                            <h3>เลือกสินค้าจากคลังหลัก</h3>
                            <span class="modal-subtitle">เลือกสินค้าและระบุจำนวนที่ต้องการเติมเข้ารถ {{ selectedTruckPlate }}</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeAddModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="search-wrapper" style="width: 100%; margin-bottom: 16px;">
                        <i class="fas fa-search search-icon-main"></i>
                        <input
                            type="text"
                            placeholder="ค้นหาสินค้าในคลัง..."
                            v-model="searchKeyword"
                            @input="debouncedFetchWarehouseStocks"
                            class="main-search-input"
                        />
                    </div>

                    <div class="table-responsive">
                        <table class="product-table modal-inner-table">
                            <thead>
                                <tr>
                                    <th>รหัส</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>หมวดหมู่</th>
                                    <th>ยี่ห้อ</th>
                                    <th class="text-right">ในคลัง</th>
                                    <th>หน่วย</th>
                                    <th class="text-center" style="width: 180px;">ระบุจำนวน</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in warehouseStocks" :key="item.id">
                                    <td>
                                        <span class="sku-chip">{{ item.product.product_code }}</span>
                                    </td>
                                    <td class="font-medium">{{ item.product.description }}</td>
                                    <td>
                                        <span class="category-chip">{{ item.product.category }}</span>
                                    </td>
                                    <td class="text-muted">{{ item.product.brand || '-' }}</td>
                                    <td class="text-right tabular-nums font-bold">{{ item.quantity }}</td>
                                    <td class="text-muted text-sm">{{ item.product.unit || '-' }}</td>
                                    <td class="text-center">
                                        <div class="modal-stepper-wrap">
                                            <div class="stepper-controls">
                                                <button
                                                    type="button"
                                                    class="step-btn"
                                                    @click="decrementQuantity(item.id)"
                                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] <= 1"
                                                >
                                                    <i class="fas fa-minus"></i>
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    :max="item.quantity"
                                                    v-model.number="addQuantities[item.id]"
                                                    class="step-input tabular-nums"
                                                />
                                                <button
                                                    type="button"
                                                    class="step-btn"
                                                    @click="incrementQuantity(item.id, item.quantity)"
                                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] >= item.quantity"
                                                >
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </div>

                                            <button
                                                v-if="addQuantities[item.id] > item.quantity"
                                                class="btn btn-danger btn-sm"
                                                disabled
                                            >
                                                ไม่พอ
                                            </button>
                                            <button
                                                v-else
                                                class="btn btn-primary btn-sm"
                                                :disabled="!addQuantities[item.id] || addQuantities[item.id] < 1"
                                                @click="addProductToList(item)"
                                            >
                                                <i class="fas fa-plus"></i> เพิ่ม
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="warehouseStocks.length === 0">
                                    <td colspan="7" class="empty-state">
                                        <i class="fas fa-box-open"></i>
                                        <p>ไม่พบสินค้าที่ค้นหา</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="pagination" v-if="totalPages > 1">
                        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
                            <i class="fas fa-chevron-left"></i>
                            <span>ก่อนหน้า</span>
                        </button>
                        <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">
                            <span>ถัดไป</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeAddModal">ปิด</button>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <div v-if="showSuccessModal" class="modal-overlay no-print">
            <div class="modal modal-sm text-center">
                <div class="success-icon-box">
                    <i class="fas fa-circle-check"></i>
                </div>
                <h3 class="success-title">บันทึกข้อมูลสำเร็จ!</h3>
                <p class="success-desc">ทำการเพิ่มสินค้าเข้าสู่รถขนส่งเรียบร้อยแล้ว</p>
                <div class="success-action-btns">
                    <button class="btn btn-secondary" @click="printRefillNote">
                        <i class="fas fa-print"></i> พิมพ์ใบเบิก
                    </button>
                    <button class="btn btn-info" @click="downloadCSV">
                        <i class="fas fa-file-csv"></i> ดาวน์โหลด CSV
                    </button>
                    <button class="btn btn-primary" @click="closeSuccessModal">เสร็จสิ้น</button>
                </div>
            </div>
        </div>

        <!-- Return to Warehouse Modal -->
        <div v-if="showReturnModal" class="modal-overlay no-print">
            <div class="modal modal-md">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge danger">
                            <i class="fas fa-arrow-rotate-left"></i>
                        </div>
                        <div>
                            <h3>ยืนยันการตีสินค้ากลับโกดัง</h3>
                            <span class="modal-subtitle">นำสินค้าบนรถส่งคืนเข้าสต็อกคลังหลัก</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeReturnModal">&times;</button>
                </div>

                <div class="modal-body text-center">
                    <div class="return-product-box">
                        <h4>{{ selectedProduct?.product.description }}</h4>
                        <div class="return-meta">
                            <span class="sku-chip">{{ selectedProduct?.product.product_code }}</span>
                            <span>จำนวนบนรถ: <strong>{{ selectedProduct?.quantity }}</strong> {{ selectedProduct?.product.unit }}</span>
                        </div>
                    </div>

                    <div class="return-qty-control">
                        <label>ระบุจำนวนที่จะคืนเข้าโกดัง:</label>
                        <div class="stepper-controls centered">
                            <button class="step-btn" @click="decrementReturnQty" :disabled="returnQuantity <= 1">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input
                                type="number"
                                v-model.number="returnQuantity"
                                @input="validateReturnInput"
                                class="step-input tabular-nums"
                            />
                            <button
                                class="step-btn"
                                @click="incrementReturnQty"
                                :disabled="returnQuantity >= selectedProduct?.quantity"
                            >
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeReturnModal">ยกเลิก</button>
                    <button
                        class="btn btn-danger"
                        @click="returnProduct"
                        :disabled="returnQuantity <= 0 || returnQuantity > selectedProduct?.quantity"
                    >
                        <i class="fas fa-check"></i>
                        <span>ยืนยันตีกลับ ({{ returnQuantity }})</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Refill Date Filter Modal -->
        <div v-if="showRefillDateModal" class="modal-overlay no-print" @click.self="closeRefillDateModal">
            <div class="modal modal-md">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge warning">
                            <i class="fas fa-calendar-days"></i>
                        </div>
                        <div>
                            <h3>เลือกช่วงเวลาที่ขาย</h3>
                            <span class="modal-subtitle">คำนวณยอดขายที่เกิดขึ้นเพื่อเติมสินค้าทดแทน</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeRefillDateModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="date-filter-grid">
                        <div class="form-group">
                            <label>ตั้งแต่วันที่</label>
                            <input type="date" v-model="refillStartDate" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label>ถึงวันที่</label>
                            <input type="date" v-model="refillEndDate" class="form-control" />
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <input
                            type="checkbox"
                            id="includePreorders"
                            v-model="includePreorder"
                            true-value="all"
                            false-value="except-preorder"
                        />
                        <label for="includePreorders">รวมยอดสินค้าพรีออเดอร์ในการคำนวณ</label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeRefillDateModal">ยกเลิก</button>
                    <button class="btn btn-primary" @click="refillFromSoldProducts" :disabled="loading">
                        <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'"></i>
                        <span>ค้นหายอดขายและเตรียมเติม</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Teleport Receipt Area (DO NOT CHANGE OR REMOVE) -->
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
.add-to-truck-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* Page Header & Top Controls */
.page-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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

.header-icon-badge.danger {
    background: #fef2f2;
    color: #dc2626;
}

.header-icon-badge.warning {
    background: #fffbeb;
    color: #d97706;
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

.top-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;
    margin-top: 10px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.truck-select-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.truck-select-group label {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

.truck-select-group label i {
    color: var(--primary-color);
}

.select-wrapper {
    position: relative;
}

.truck-select {
    padding: 10px 32px 10px 14px;
    font-size: 0.92rem;
    font-family: inherit;
    font-weight: 600;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    background: #f8fafc;
    color: var(--text-primary);
    cursor: pointer;
    min-width: 260px;
    transition: all 0.2s ease;
    appearance: auto;
}

.truck-select:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.right-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-left: auto;
}

.search-wrapper {
    position: relative;
    width: 250px;
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

.button-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Button & Pill styles */
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

.po-pill {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    background: #f1f5f9;
}

.po-pill.has-po {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 700;
}

.sold-quantity {
    color: #059669;
    font-size: 0.8rem;
    font-weight: 700;
    margin-left: 4px;
}

.btn-return {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    border-radius: var(--radius-md);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-return:hover:not(.disabled) {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
}

.btn-return.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Added Summary Card */
.added-summary-card {
    margin-top: 32px;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: var(--radius-lg);
    padding: 24px;
}

.summary-header {
    margin-bottom: 16px;
}

.summary-title-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #1e293b;
}

.summary-title-badge i {
    color: var(--primary-color);
    font-size: 1.25rem;
}

.summary-title-badge h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
}

.stepper-controls {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    background: #ffffff;
    overflow: hidden;
}

.stepper-controls.centered {
    margin: 0 auto;
}

.step-btn {
    width: 34px;
    height: 34px;
    border: none;
    background: #f8fafc;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}

.step-btn:hover:not(:disabled) {
    background: #e2e8f0;
}

.step-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.step-input {
    width: 50px;
    height: 34px;
    border: none;
    text-align: center;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    outline: none;
}

.summary-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

/* Success Modal */
.modal-sm {
    max-width: 440px;
    width: 95%;
    padding: 32px 24px;
}

.success-icon-box {
    width: 64px;
    height: 64px;
    background: #ecfdf5;
    color: #059669;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    margin: 0 auto 16px auto;
}

.success-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 6px 0;
}

.success-desc {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 0 0 24px 0;
}

.success-action-btns {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.success-action-btns button {
    width: 100%;
    justify-content: center;
}

/* Return Modal */
.return-product-box {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 20px;
}

.return-product-box h4 {
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: var(--text-primary);
}

.return-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.return-qty-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin: 20px 0;
}

.return-qty-control label {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
}

/* Refill Date Modal */
.date-filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--text-primary);
}

.checkbox-group input {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.modal-stepper-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

/* Print Receipt Layout */
.signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
}

.text-center {
    text-align: center;
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

@media (max-width: 768px) {
    .page-header-row {
        flex-direction: column;
        align-items: stretch;
    }

    .top-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .truck-select-group {
        flex-direction: column;
        align-items: stretch;
    }

    .truck-select {
        width: 100%;
    }

    .right-actions {
        flex-direction: column;
        align-items: stretch;
        margin-left: 0;
    }

    .search-wrapper {
        width: 100%;
    }

    .button-group {
        flex-direction: column;
    }

    .button-group button {
        width: 100%;
        justify-content: center;
    }

    .date-filter-grid {
        grid-template-columns: 1fr;
    }
}
</style>