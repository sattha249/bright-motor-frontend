<template>
    <div class="sale-view-container">
        <!-- Header Banner -->
        <div class="sale-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-cash-register"></i>
                </div>
                <div>
                    <h2 class="section-title">บันทึกการขายสินค้า (หน้าโกดัง)</h2>
                    <p class="section-subtitle">เปิดบิลขายหน้าร้าน คิดเงิน คำนวณส่วนลด และจัดการการชำระเงินเครดิต</p>
                </div>
            </div>
            <div class="header-location-tag">
                <i class="fas fa-warehouse"></i>
                <span>โกดังหลัก</span>
            </div>
        </div>

        <!-- POS Workspace Layout -->
        <div class="pos-workspace-card">
            <!-- Top Controls: Customer & Credit Terms -->
            <div class="pos-top-controls">
                <div class="customer-picker-box">
                    <label class="control-label">
                        <i class="fas fa-user-tag"></i> เลือกลูกค้า (Customer) <span class="text-danger">*</span>
                    </label>
                    <div class="search-input-wrapper">
                        <i class="fas fa-search search-icon-inside"></i>
                        <input
                            type="text"
                            v-model="customerSearchTerm"
                            placeholder="ค้นหาชื่อลูกค้า หรือ รหัสลูกค้า..."
                            class="form-control customer-search-input"
                            @input="debouncedSearchCustomers"
                            @focus="showCustomerDropdown = true"
                            @blur="hideCustomerDropdown"
                        />
                        <div class="dropdown-menu-list" v-if="showCustomerDropdown">
                            <div
                                v-for="customer in filteredCustomers"
                                :key="customer.id"
                                class="dropdown-item-option"
                                @mousedown.prevent="selectCustomer(customer)"
                            >
                                <div class="customer-option-row">
                                    <span class="customer-name font-bold">{{ customer.name }}</span>
                                    <span class="customer-code text-muted">({{ customer.customer_no }})</span>
                                </div>
                            </div>
                            <div v-if="filteredCustomers.length === 0" class="dropdown-item-option disabled text-muted text-center py-2">
                                ไม่พบข้อมูลลูกค้า
                            </div>
                        </div>
                    </div>
                </div>

                <div class="credit-management-box">
                    <label class="control-label">
                        <i class="fas fa-credit-card"></i> เงื่อนไขการชำระเงิน
                    </label>
                    <div class="credit-pill-wrapper">
                        <div class="checkbox-pill" :class="{ active: isCredit }">
                            <input type="checkbox" id="isCredit" v-model="isCredit" @change="handleCreditChange" />
                            <label for="isCredit">ขายเงินเชื่อ (ติดเครดิต)</label>
                        </div>

                        <div v-if="isCredit" class="credit-sub-terms">
                            <label class="radio-pill" :class="{ active: creditType === 'week' }">
                                <input type="radio" value="week" v-model="creditType" />
                                <span>รายสัปดาห์</span>
                            </label>
                            <label class="radio-pill" :class="{ active: creditType === 'month' }">
                                <input type="radio" value="month" v-model="creditType" />
                                <span>รายเดือน</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Bar: Add Product Button -->
            <div class="pos-cart-header">
                <div class="cart-title-info">
                    <h3 class="card-title">
                        <i class="fas fa-basket-shopping"></i> รายการสินค้าในบิล
                    </h3>
                    <span class="cart-badge">{{ totalItems }} ชิ้น</span>
                </div>
                <button class="btn btn-primary" @click="openModal" :disabled="customerId === null">
                    <i class="fas fa-plus-circle"></i>
                    <span>เลือกสินค้าเพิ่ม</span>
                </button>
            </div>

            <!-- Cart Table -->
            <div class="table-container">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th width="50" class="text-center">#</th>
                            <th v-if="isCredit" width="80" class="text-center">จ่ายแล้ว</th>
                            <th>สินค้า</th>
                            <th>ประเภท</th>
                            <th width="120" class="text-center">จำนวน</th>
                            <th width="130" class="text-right">ราคา/หน่วย</th>
                            <th width="130" class="text-right">ส่วนลด/หน่วย</th>
                            <th width="140" class="text-right">รวมสุทธิ</th>
                            <th width="70" class="text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in items" :key="item.productId">
                            <td class="text-center text-muted tabular-nums">{{ index + 1 }}</td>
                            <td v-if="isCredit" class="text-center">
                                <input type="checkbox" v-model="item.is_paid" class="table-checkbox" />
                            </td>
                            <td>
                                <div class="font-bold text-main">{{ item.description }}</div>
                            </td>
                            <td>
                                <span class="stock-pill pill-medium">{{ item.category || 'ทั่วไป' }}</span>
                            </td>
                            <td class="text-center">
                                <input
                                    type="number"
                                    v-model.number="item.quantity"
                                    min="1"
                                    class="form-control table-qty-input tabular-nums text-center"
                                />
                            </td>
                            <td class="text-right tabular-nums">฿{{ parseFloat(item.price).toFixed(2) }}</td>
                            <td class="text-right">
                                <input
                                    type="number"
                                    v-model.number="item.discount"
                                    min="0"
                                    :max="item.price"
                                    class="form-control table-discount-input tabular-nums text-right"
                                    @input="validateItemDiscount(item)"
                                />
                            </td>
                            <td class="text-right tabular-nums font-bold text-success">
                                ฿{{ (item.quantity * (item.price - item.discount)).toFixed(2) }}
                            </td>
                            <td class="text-center">
                                <button class="btn-icon-danger" @click="removeItem(item.productId)" title="ลบรายการ">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="items.length === 0">
                            <td :colspan="isCredit ? 9 : 8" class="text-center py-5">
                                <div class="empty-cart-state">
                                    <i class="fas fa-cart-arrow-down empty-icon"></i>
                                    <p class="empty-title">ยังไม่มีรายการสินค้าในบิล</p>
                                    <p class="empty-desc">เลือกลูกค้าแล้วคลิก "เลือกสินค้าเพิ่ม" เพื่อทำรายการ</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Discount & Summary Checkout Area -->
            <div class="pos-checkout-pane">
                <div class="discount-management-card">
                    <h4 class="card-subtitle-bold"><i class="fas fa-tags"></i> ส่วนลดทั้งบิล</h4>
                    <div class="discount-btn-group">
                        <button
                            v-for="pct in [5, 10, 15]"
                            :key="pct"
                            @click="applyDiscountPercentage(pct)"
                            class="pct-btn"
                            :class="{ active: selectedDiscount === pct }"
                            :disabled="items.length === 0"
                        >
                            {{ pct }}%
                        </button>
                    </div>
                    <div class="manual-discount-row">
                        <input
                            type="number"
                            v-model.number="manualDiscountAmount"
                            placeholder="ระบุส่วนลด (บาท)"
                            class="form-control tabular-nums text-right"
                            style="width: 170px;"
                            :disabled="items.length === 0"
                        />
                        <button
                            @click="applyManualDiscount"
                            class="btn btn-secondary btn-sm"
                            :disabled="items.length === 0"
                        >
                            เฉลี่ยลด
                        </button>
                    </div>
                </div>

                <div class="sale-summary-card">
                    <div class="summary-line">
                        <span>ราคารวม (ก่อนลด):</span>
                        <span class="tabular-nums">฿{{ totalOriginalPrice.toFixed(2) }}</span>
                    </div>
                    <div class="summary-line text-danger">
                        <span>ส่วนลดรวม:</span>
                        <span class="tabular-nums">-฿{{ totalDiscountAmount.toFixed(2) }}</span>
                    </div>

                    <template v-if="isCredit">
                        <div class="summary-divider"></div>
                        <div class="summary-line text-success">
                            <span>จ่ายวันนี้:</span>
                            <span class="tabular-nums font-bold">฿{{ totalPaidToday.toFixed(2) }}</span>
                        </div>
                        <div class="summary-line text-warning">
                            <span>ค้างชำระ (Credit):</span>
                            <span class="tabular-nums font-bold">฿{{ totalCreditAmount.toFixed(2) }}</span>
                        </div>
                    </template>

                    <div class="summary-line grand-total-line">
                        <span>ยอดสุทธิทั้งสิ้น:</span>
                        <span class="grand-total-price tabular-nums">฿{{ totalSalePrice.toFixed(2) }}</span>
                    </div>

                    <button
                        class="btn btn-primary checkout-btn"
                        @click="saveSale"
                        :disabled="items.length === 0 || loading"
                    >
                        <i class="fas fa-check-double"></i>
                        <span>{{ loading ? 'กำลังบันทึก...' : 'บันทึกการขาย' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Item Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-warehouse"></i>
                        </div>
                        <div>
                            <h3>เลือกสินค้าจากโกดัง</h3>
                            <span class="modal-subtitle">เลือกสินค้าพร้อมระบุจำนวนเพื่อเพิ่มลงในรายการขาย</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="modal-search-box" style="margin-bottom: 16px;">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon-inside"></i>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
                                v-model="searchKeyword"
                                @input="debouncedFetchWarehouseStock"
                                class="form-control"
                            />
                        </div>
                    </div>

                    <div class="modal-table-wrap">
                        <table class="product-table modal-inner-table">
                            <thead>
                                <tr>
                                    <th>รหัส</th>
                                    <th>สินค้า</th>
                                    <th>ประเภท</th>
                                    <th class="text-right">คงเหลือ</th>
                                    <th class="text-right">ราคาขาย</th>
                                    <th class="text-center" width="150">จำนวนที่ต้องการ</th>
                                    <th class="text-center" width="100">เพิ่ม</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="stock in filteredStocks" :key="stock.id">
                                    <td class="text-muted tabular-nums">SKU-{{ stock.product_id }}</td>
                                    <td class="font-medium">{{ stock.product.description }}</td>
                                    <td>
                                        <span class="stock-pill pill-medium">{{ stock.product.category || 'ทั่วไป' }}</span>
                                    </td>
                                    <td class="text-right tabular-nums font-bold">
                                        <span :class="['stock-pill', stock.quantity > 10 ? 'pill-high' : stock.quantity > 0 ? 'pill-low' : 'pill-empty']">
                                            {{ stock.quantity }}
                                        </span>
                                    </td>
                                    <td class="text-right tabular-nums font-bold">฿{{ parseFloat(stock.product.sell_price).toFixed(2) }}</td>
                                    <td class="text-center">
                                        <input
                                            type="number"
                                            v-model.number="stock.tempQuantity"
                                            min="1"
                                            :max="stock.quantity"
                                            class="form-control table-qty-input tabular-nums text-center"
                                            style="width: 80px; margin: 0 auto;"
                                        />
                                    </td>
                                    <td class="text-center">
                                        <button
                                            class="btn btn-primary btn-sm"
                                            :disabled="!stock.tempQuantity || stock.tempQuantity < 1 || stock.tempQuantity > stock.quantity"
                                            @click="addItemToSale(stock)"
                                        >
                                            <i class="fas fa-plus"></i> เพิ่ม
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="filteredStocks.length === 0">
                                    <td colspan="7" class="text-center py-4 text-muted">ไม่พบสินค้าหรือคลังว่าง</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeModal">เสร็จสิ้น / ปิด</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

// State
const truckId = ref(0);
const customerId = ref(null);
const isCredit = ref(false);
const creditType = ref('week');

const items = ref([]);
const trucks = ref([]);
const allCustomers = ref([]); // ใช้เก็บผลลัพธ์จากการค้นหา
const customerSearchTerm = ref('');
const showCustomerDropdown = ref(false);
const manualDiscountAmount = ref(0);
const warehouseStocks = ref([]);
const loading = ref(false);
const showModal = ref(false);
const searchKeyword = ref('');

// Computed
const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));
const totalOriginalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + (item.quantity * item.price), 0)
);
const totalDiscountAmount = computed(() =>
    items.value.reduce((sum, item) => sum + (item.quantity * item.discount), 0)
);
const totalSalePrice = computed(() => totalOriginalPrice.value - totalDiscountAmount.value);

const filteredStocks = computed(() => {
    // แก้ไข: ไม่กรองซ้ำที่ฝั่ง Client เพราะ API กรองมาให้แล้ว
    return warehouseStocks.value;
});

const filteredCustomers = computed(() => {
    // แก้ไข: ไม่กรองซ้ำที่ฝั่ง Client เพราะ API กรองมาให้แล้ว
    return allCustomers.value;
});

const totalPaidToday = computed(() => {
    return items.value
        .filter(item => item.is_paid)
        .reduce((sum, item) => {
            const netPrice = item.price - (item.discount || 0);
            return sum + (item.quantity * netPrice);
        }, 0);
});

const totalCreditAmount = computed(() => {
    return items.value
        .filter(item => !item.is_paid)
        .reduce((sum, item) => {
            const netPrice = item.price - (item.discount || 0);
            return sum + (item.quantity * netPrice);
        }, 0);
});

// Helper Functions
// แก้ไข: แยก timer ของแต่ละการ debounce
const debounce = (func, delay) => {
    let timeout = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

const handleCreditChange = () => {
    if (!isCredit.value) {
        items.value.forEach(item => item.is_paid = true);
    } else {
        creditType.value = 'week';
        items.value.forEach(item => item.is_paid = false);
    }
};

// Data Fetching
const fetchInitialData = async () => {
    loading.value = true;
    try {
        // โหลดข้อมูลลูกค้าชุดแรก
        const customerRes = await axios.get('/customers', {
            params: { per_page: 20 }
        });
        allCustomers.value = customerRes.data.data;
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลเริ่มต้นได้', 'error');
    } finally {
        loading.value = false;
    }
};

// [ใหม่] ฟังก์ชันค้นหาลูกค้าแบบ Server-side
const searchCustomers = async () => {
    try {
        const res = await axios.get('/customers', {
            params: {
                search: customerSearchTerm.value,
                per_page: 20
            }
        });
        allCustomers.value = res.data.data;
    } catch (error) {
        console.error("Search error", error);
    }
};

const fetchWarehouseStock = async () => {
    loading.value = true;
    const url = '/warehouse-stocks';
    try {
        const res = await axios.get(url, {
            params: {
                search: searchKeyword.value, // ส่งคำค้นหาไปที่ API
                limit: 10
            }
        });
        // ตรวจสอบโครงสร้างข้อมูลที่ได้จาก API
        const stockData = Array.isArray(res.data) ? res.data : res.data.data || res.data;

        warehouseStocks.value = stockData.map(stock => ({
            ...stock,
            tempQuantity: 1,
            product: stock.product || { sell_price: '0', description: '', unit: '' }
        }));
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถโหลดสินค้าในโกดังได้', 'error');
    } finally {
        loading.value = false;
    }
};

// Debounce Wrappers
const debouncedFetchWarehouseStock = debounce(fetchWarehouseStock, 300);
const debouncedSearchCustomers = debounce(searchCustomers, 300);

const selectCustomer = (customer) => {
    customerId.value = customer.id;
    customerSearchTerm.value = `${customer.name} (${customer.customer_no})`;
    showCustomerDropdown.value = false;
};

const hideCustomerDropdown = () => {
    setTimeout(() => {
        showCustomerDropdown.value = false;
        if (customerId.value === null) {
            // ถ้าลูกค้าไม่มีใน list แต่เคยพิมพ์ไว้ ให้ลองค้นหาใหม่หรือเคลียร์
            // แต่ในกรณี server-side search ปล่อยค่าค้างไว้เพื่อให้รู้ว่าพิมพ์อะไรไปจะดีกว่า
            // หรือถ้าจะเคลียร์ก็ uncomment บรรทัดล่าง
            // if (!customerSearchTerm.value) customerSearchTerm.value = ''; 
        }
    }, 150);
};

const selectedDiscount = ref(0);

const applyDiscountPercentage = (percent) => {
    selectedDiscount.value = percent;
    const discountFactor = percent / 100;
    items.value.forEach(item => {
        item.discount = Math.round((item.price * discountFactor) * 100) / 100;
    });
    manualDiscountAmount.value = 0;
};

const validateItemDiscount = (item) => {
    if (item.discount === '' || item.discount === null || isNaN(item.discount)) {
        item.discount = 0;
        return;
    }
    if (item.discount < 0) {
        item.discount = 0;
    }
    if (item.discount > item.price) {
        item.discount = item.price;
    }
    item.discount = Math.round(item.discount * 100) / 100;
    selectedDiscount.value = 0; // ล้างไฮไลท์ปุ่มส่วนลดรวม
};

const distributeDiscount = (itemsList, discountTotal) => {
    if (itemsList.length === 0) return;
    const totalOriginal = itemsList.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (totalOriginal === 0) return;

    let allocatedTotal = 0;
    const itemsWithAllocation = itemsList.map(item => {
        const itemLineTotal = item.quantity * item.price;
        const ratio = itemLineTotal / totalOriginal;
        const itemTotalDiscount = discountTotal * ratio;
        const rawUnitDiscount = itemTotalDiscount / item.quantity;
        const roundedUnitDiscount = Math.round(rawUnitDiscount * 100) / 100;
        const finalUnitDiscount = Math.min(item.price, Math.max(0, roundedUnitDiscount));
        allocatedTotal += finalUnitDiscount * item.quantity;
        return {
            item,
            unitDiscount: finalUnitDiscount,
            quantity: item.quantity,
            price: item.price
        };
    });

    let diff = discountTotal - allocatedTotal;
    const sortedAllocations = [...itemsWithAllocation].sort((a, b) => a.quantity - b.quantity);
    diff = Math.round(diff * 100) / 100;

    if (diff > 0) {
        for (const alloc of sortedAllocations) {
            while (diff >= (alloc.quantity * 0.01) && alloc.unitDiscount + 0.01 <= alloc.price) {
                alloc.unitDiscount = Math.round((alloc.unitDiscount + 0.01) * 100) / 100;
                diff = Math.round((diff - (alloc.quantity * 0.01)) * 100) / 100;
            }
        }
        if (diff > 0) {
            for (const alloc of sortedAllocations) {
                const step = alloc.quantity * 0.01;
                if (Math.abs(diff - step) < Math.abs(diff) && alloc.unitDiscount + 0.01 <= alloc.price) {
                    alloc.unitDiscount = Math.round((alloc.unitDiscount + 0.01) * 100) / 100;
                    diff = Math.round((diff - step) * 100) / 100;
                    break;
                }
            }
        }
    } else if (diff < 0) {
        for (const alloc of sortedAllocations) {
            while (diff <= -(alloc.quantity * 0.01) && alloc.unitDiscount - 0.01 >= 0) {
                alloc.unitDiscount = Math.round((alloc.unitDiscount - 0.01) * 100) / 100;
                diff = Math.round((diff + (alloc.quantity * 0.01)) * 100) / 100;
            }
        }
        if (diff < 0) {
            for (const alloc of sortedAllocations) {
                const step = alloc.quantity * 0.01;
                if (Math.abs(diff + step) < Math.abs(diff) && alloc.unitDiscount - 0.01 >= 0) {
                    alloc.unitDiscount = Math.round((alloc.unitDiscount - 0.01) * 100) / 100;
                    diff = Math.round((diff + step) * 100) / 100;
                    break;
                }
            }
        }
    }

    itemsWithAllocation.forEach(alloc => {
        alloc.item.discount = alloc.unitDiscount;
    });
};

const applyManualDiscount = () => {
    selectedDiscount.value = 0;
    if (manualDiscountAmount.value < 0 || manualDiscountAmount.value > totalOriginalPrice.value) {
        Swal.fire('ผิดพลาด', 'ส่วนลดต้องไม่เป็นค่าลบและไม่เกินราคารวมทั้งหมด', 'error');
        return;
    }
    if (items.value.length === 0) return;
    distributeDiscount(items.value, manualDiscountAmount.value);
    manualDiscountAmount.value = parseFloat(totalDiscountAmount.value.toFixed(2));
};

const openModal = () => {
    if (customerId.value === null) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกลูกค้าก่อน', 'warning');
        return;
    }
    // รีเซ็ตคำค้นหาก่อนเปิด Modal เพื่อให้แสดงทั้งหมดก่อน หรือจะคงค่าเดิมก็ได้
    searchKeyword.value = '';
    fetchWarehouseStock();
    showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const addItemToSale = (stockItem) => {
    const quantity = stockItem.tempQuantity;
    const existingItem = items.value.find(item => item.productId === stockItem.product_id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        items.value.push({
            productId: stockItem.product_id,
            description: stockItem.product.description,
            category: stockItem.product.category,
            quantity: quantity,
            price: parseFloat(stockItem.product.sell_price),
            discount: 0,
            is_paid: !isCredit.value
        });
    }
    closeModal();
};

const removeItem = (productId) => {
    items.value = items.value.filter(item => item.productId !== productId);
    manualDiscountAmount.value = 0;
};

const saveSale = async () => {
    if (items.value.length === 0) {
        Swal.fire('แจ้งเตือน', 'กรุณาเพิ่มรายการสินค้าก่อนบันทึก', 'warning');
        return;
    }

    loading.value = true;
    try {
        const finalIsCredit = isCredit.value ? creditType.value : null;

        const payload = {
            truckId: null,
            customerId: customerId.value,
            isCredit: finalIsCredit,
            totalDiscount: totalDiscountAmount.value.toFixed(2),
            totalSoldPrice: totalSalePrice.value.toFixed(2),
            items: items.value.map(item => {
                const finalPrice = item.price - item.discount;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount.toFixed(2),
                    sold_price: finalPrice.toFixed(2),
                    is_paid: isCredit.value ? !!item.is_paid : true
                };
            })
        };

        await axios.post('/sell-logs', payload);

        Swal.fire('สำเร็จ!', 'บันทึกการขายเรียบร้อยแล้ว', 'success');

        // Reset state
        customerId.value = null;
        items.value = [];
        isCredit.value = false;
        creditType.value = 'week';
        manualDiscountAmount.value = 0;
        customerSearchTerm.value = '';
        // โหลดข้อมูลตั้งต้นใหม่
        fetchInitialData();

    } catch (error) {
        Swal.fire('ผิดพลาด!', 'เกิดข้อผิดพลาดในการบันทึกการขาย', 'error');
        console.error('Sale error:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchInitialData();
    // fetchWarehouseStock(); // ไม่จำเป็นต้องโหลด warehouse ทันที รอเปิด Modal ดีกว่า
});
</script>

<style scoped>
.sale-view-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.sale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-title-box {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.section-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0.2rem 0 0 0;
}

.header-location-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-location-tag i {
    color: var(--primary-color);
}

/* Workspace Card */
.pos-workspace-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Top Controls */
.pos-top-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.control-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 8px;
}

.customer-picker-box {
    position: relative;
}

.customer-search-input {
    padding-left: 2.25rem;
}

.dropdown-menu-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 50;
    max-height: 220px;
    overflow-y: auto;
    margin-top: 4px;
}

.dropdown-item-option {
    padding: 10px 14px;
    cursor: pointer;
    font-size: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s ease;
}

.dropdown-item-option:hover:not(.disabled) {
    background: #eff6ff;
    color: var(--primary-color);
}

.customer-option-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Credit pill */
.credit-pill-wrapper {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.checkbox-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1.5px solid var(--border-color);
    background: #ffffff;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-main);
    transition: all 0.2s ease;
}

.checkbox-pill.active {
    border-color: #d97706;
    background: #fffbeb;
    color: #92400e;
}

.checkbox-pill input {
    cursor: pointer;
}

.credit-sub-terms {
    display: inline-flex;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 10px;
    gap: 4px;
}

.radio-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.825rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
}

.radio-pill.active {
    background: #ffffff;
    color: var(--text-main);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.radio-pill input {
    display: none;
}

/* Cart Header */
.pos-cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-title-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.cart-badge {
    background: #eff6ff;
    color: var(--primary-color);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
}

/* Table Controls */
.table-qty-input,
.table-discount-input {
    padding: 6px 10px;
    font-size: 0.875rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.table-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.btn-icon-danger {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #fef2f2;
    color: #dc2626;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
}

.btn-icon-danger:hover {
    background: #fee2e2;
}

.empty-cart-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    gap: 8px;
}

.empty-icon {
    font-size: 2.5rem;
    color: #cbd5e1;
    margin-bottom: 4px;
}

.empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: #64748b;
    margin: 0;
}

.empty-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
}

/* Checkout Pane */
.pos-checkout-pane {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    align-items: start;
}

.discount-management-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.card-subtitle-bold {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.discount-btn-group {
    display: flex;
    gap: 8px;
}

.pct-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--text-main);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pct-btn:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.pct-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #ffffff;
}

.pct-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.manual-discount-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.sale-summary-card {
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-muted);
}

.summary-divider {
    border-top: 1px dashed var(--border-color);
    margin: 4px 0;
}

.grand-total-line {
    border-top: 1px dashed var(--border-color);
    padding-top: 10px;
    margin-top: 4px;
    font-weight: 700;
    color: var(--text-main);
    font-size: 1rem;
}

.grand-total-price {
    font-size: 1.6rem;
    color: var(--primary-color);
    font-weight: 800;
}

.checkout-btn {
    width: 100%;
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 1rem;
    margin-top: 6px;
}

@media (max-width: 1024px) {
    .pos-top-controls {
        grid-template-columns: 1fr;
    }
    .pos-checkout-pane {
        grid-template-columns: 1fr;
    }
}
</style>