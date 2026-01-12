<template>
    <div class="preorder-container">
        <h2 class="section-title no-print">
            <i class="fas fa-truck-loading"></i> จัดการใบส่งของล่วงหน้า & โอนของขึ้นรถ
        </h2>

        <div class="tabs no-print">
            <button :class="['tab-btn', { active: currentTab === 'list' }]" @click="currentTab = 'list'">
                <i class="fas fa-list"></i> รายการใบงาน
            </button>
            <button :class="['tab-btn', { active: currentTab === 'form' }]" @click="currentTab = 'form'">
                <i class="fas fa-plus-circle"></i> เปิดบิลส่งของขึ้นรถ
            </button>
        </div>

        <div v-if="currentTab === 'list'" class="tab-content no-print">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">สถานะการโอนของและบิลล่วงหน้า</h3>

                    <div class="filter-group">
                        <div class="search-input-wrapper small-search">
                            <input type="text" v-model="preOrderSearchTerm" @input="debouncedFetchPreOrders"
                                placeholder="ค้นหาเลขบิล / ลูกค้า..." class="search-input" />
                            <i class="fas fa-search search-icon-inside"></i>
                        </div>

                        <select v-model="filterStatus" @change="fetchPreOrders(1)" class="status-select">
                            <option value="">สถานะทั้งหมด</option>
                            <option value="Pending">Pending (รอรถ)</option>
                            <option value="Completed">Completed (ปิดงาน)</option>
                            <option value="Cancelled">Cancelled (ยกเลิก)</option>
                        </select>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>เลขที่บิล</th>
                                <th>รถขนส่ง</th>
                                <th>ลูกค้า</th>
                                <th>ยอดรวม</th>
                                <th>สถานะ</th>
                                <th>ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="po in preOrders" :key="po.id">
                                <td class="bold">{{ po.bill_no }}</td>
                                <td><i class="fas fa-truck"></i> {{ po.truck?.plate_number || 'ไม่ระบุ' }}</td>
                                <td>{{ po.customer?.name || 'ไม่ระบุ' }}</td>
                                <td class="price-text">฿{{ Number(po.total_sold_price).toLocaleString() }}</td>
                                <td>
                                    <span :class="['status-badge', po.status.toLowerCase()]">
                                        {{ po.status }}
                                    </span>
                                </td>
                                <td class="action-buttons">
                                    <button class="action-btn view-btn" @click="viewDetail(po)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button v-if="po.status === 'Pending'" class="action-btn edit-btn"
                                        @click="editPreOrder(po)">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <button v-if="po.status === 'Pending'" class="action-btn delete-btn"
                                        @click="cancelPreOrder(po)">
                                        <i class="fas fa-undo"></i> ยกเลิก
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="preOrders.length === 0">
                                <td colspan="6" class="text-center py-4">ไม่พบรายการใบงาน</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="modal-pagination" v-if="preOrdersTotalPages > 1" style="margin-top: 20px;">
                    <button @click="changePreOrderPage(preOrderCurrentPage - 1)" :disabled="preOrderCurrentPage === 1">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="page-info">หน้า {{ preOrderCurrentPage }} / {{ preOrdersTotalPages }}</span>
                    <button @click="changePreOrderPage(preOrderCurrentPage + 1)"
                        :disabled="preOrderCurrentPage === preOrdersTotalPages">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="currentTab === 'form'" class="tab-content no-print">
            <div class="form-grid">
                <div class="card info-card">
                    <h3 class="card-title">{{ isEditing ? 'แก้ไขข้อมูลใบงาน' : 'ข้อมูลปลายทาง' }}</h3>
                    <div class="form-group">
                        <label>เลือกรถขนส่ง <span class="required">*</span></label>
                        <select v-model="truckId" class="custom-select" :disabled="isEditing">
                            <option :value="null">-- เลือกรถที่จะนำของขึ้น --</option>
                            <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                                {{ truck.plate_number }} ({{ truck?.user?.fullname || 'ไม่มีชื่อคนขับ' }})
                            </option>
                        </select>
                    </div>
                    <div class="form-group customer-search-group">
                        <label>ลูกค้าปลายทาง <span class="required">*</span></label>
                        <div class="search-input-wrapper">
                            <input :disabled="isEditing" type="text" v-model="customerSearchTerm"
                                placeholder="ค้นหาชื่อลูกค้า..." @input="debouncedSearchCustomers"
                                @focus="showCustomerDropdown = true" @blur="hideCustomerDropdown"
                                class="search-input" />
                            <i class="fas fa-search search-icon-inside"></i>
                        </div>
                        <div class="dropdown" v-if="showCustomerDropdown">
                            <div v-for="c in filteredCustomers" :key="c.id" class="dropdown-item"
                                @mousedown.prevent="selectCustomer(c)">
                                {{ c.name }} ({{ c.customer_no }})
                            </div>
                            <div v-if="filteredCustomers.length === 0" class="dropdown-item disabled">ไม่พบข้อมูลลูกค้า
                            </div>
                        </div>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="preIsCredit" v-model="isCredit" />
                        <label for="preIsCredit">ตั้งยอดเครดิต</label>
                    </div>
                    <div v-if="isCredit" class="credit-type-selector">
                        <label class="radio-label"><input type="radio" v-model="creditType" value="week">
                            รายสัปดาห์</label>
                        <label class="radio-label"><input type="radio" v-model="creditType" value="month">
                            รายเดือน</label>
                    </div>
                </div>

                <div class="card items-card">
                    <div class="card-header">
                        <h3 class="card-title">รายการสินค้า (โอนจากโกดัง)</h3>
                        <button class="add-btn" @click="openStockModal" :disabled="!truckId">
                            <i class="fas fa-plus"></i> เพิ่มสินค้า
                        </button>
                    </div>

                    <div class="table-responsive">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th width="120" class="text-center">จำนวน</th>
                                    <th class="text-right">ราคา</th>
                                    <th class="text-right">รวม</th>
                                    <th class="text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in items" :key="item.productId">
                                    <td class="bold">{{ item.description }}</td>
                                    <td class="text-center">
                                        <input type="number" v-model.number="item.quantity" min="1" class="qty-input">
                                    </td>
                                    <td class="text-right">฿{{ item.price.toLocaleString() }}</td>
                                    <td class="text-right bold">฿{{ (item.quantity * item.price).toLocaleString() }}
                                    </td>
                                    <td class="text-center">
                                        <button class="remove-btn" @click="removeItem(index)">&times;</button>
                                    </td>
                                </tr>
                                <tr v-if="items.length === 0">
                                    <td colspan="5" class="text-center py-4 text-muted">ยังไม่มีรายการสินค้า
                                        กรุณากดปุ่มเพิ่มสินค้า</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="sale-summary" v-if="items.length > 0">
                        <div class="summary-row">
                            <span>ยอดรวมสุทธิ:</span>
                            <span class="total-amount">฿{{ totalSoldPrice.toLocaleString() }}</span>
                        </div>
                        <div class="button-group">
                            <button v-if="isEditing" class="cancel-edit-btn" @click="cancelEditMode">
                                ยกเลิกการแก้ไข
                            </button>
                            <button class="save-btn" @click="submitPreOrder" :disabled="loading">
                                <i class="fas fa-save"></i> {{ loading ? 'กำลังบันทึก...' : (isEditing ?
                                    'บันทึกการแก้ไข' : 'บันทึกใบงานและตัดสต็อก') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showDetailModal" class="modal-overlay printable-modal" @click.self="showDetailModal = false">
            <div class="modal large-modal">
                <div class="modal-header no-print">
                    <h3><i class="fas fa-info-circle"></i> รายละเอียดใบงาน {{ selectedPreOrder?.bill_no }}</h3>
                    <div class="header-actions">
                        <button class="print-btn" @click="printDetail">
                            <i class="fas fa-print"></i> พิมพ์
                        </button>
                        <button class="close-icon-btn" @click="showDetailModal = false">&times;</button>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="screen-only">
                        <div class="print-only-header">
                            <h2>ใบส่งของ / ใบแจ้งหนี้</h2>
                            <div class="print-meta">
                                <p><strong>เลขที่:</strong> {{ selectedPreOrder?.bill_no }}</p>
                                <p><strong>วันที่:</strong> {{ new
                                    Date(selectedPreOrder?.created_at).toLocaleDateString('th-TH') }}</p>
                            </div>
                            <hr class="sign-line" style="border-top: 2px solid #000; margin: 10px 0;">
                        </div>
                        <div class="info-grid-detail">
                            <div class="info-box">
                                <label>รถขนส่ง:</label>
                                <span>{{ selectedPreOrder?.truck?.plate_number }}</span>
                            </div>
                            <div class="info-box">
                                <label>ลูกค้า:</label>
                                <span>{{ selectedPreOrder?.customer?.name }}</span>
                            </div>
                            <div class="info-box">
                                <label>สถานะ:</label>
                                <span :class="['status-badge', selectedPreOrder?.status.toLowerCase()]">{{
                                    selectedPreOrder?.status }}</span>
                            </div>
                            <div class="info-box">
                                <label>เครดิต:</label>
                                <span>{{ selectedPreOrder?.is_credit || 'เงินสด' }}</span>
                            </div>
                        </div>

                        <div class="modal-table-container mt-4">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>สินค้า</th>
                                        <th class="text-center">จำนวน</th>
                                        <th class="text-right">ราคา/หน่วย</th>
                                        <th class="text-right">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in selectedPreOrder?.items" :key="item.id">
                                        <td>{{ item.product?.description }}</td>
                                        <td class="text-center">{{ item.quantity }}</td>
                                        <td class="text-right">฿{{ Number(item.price).toLocaleString() }}</td>
                                        <td class="text-right bold">฿{{ (item.quantity * item.price).toLocaleString() }}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-right bold">รวมสุทธิ:</td>
                                        <td class="text-right bold total-highlight">฿{{
                                            Number(selectedPreOrder?.total_sold_price).toLocaleString() }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div class="print-only receipt-layout">
                        <div class="receipt-header">
                            <h2>BRIGHT MOTOR STORE</h2>
                            <p>ใบส่งของ / ใบแจ้งหนี้</p>
                            <div class="dashed-line"></div>
                            <div class="receipt-info-row">
                                <span>Date: {{ new Date(selectedPreOrder?.created_at).toLocaleDateString('th-TH')
                                }}</span>
                                <span>Time: {{ new Date(selectedPreOrder?.created_at).toLocaleTimeString('th-TH', {
                                    hour:
                                        '2-digit', minute: '2-digit'
                                }) }}</span>
                            </div>
                            <div class="receipt-info-row">
                                <span>No: {{ selectedPreOrder?.bill_no }}</span>
                            </div>
                            <div class="receipt-info-row">
                                <span>Customer: {{ selectedPreOrder?.customer?.name }}</span>
                            </div>
                            <div class="dashed-line"></div>
                        </div>

                        <div class="receipt-items">
                            <div v-for="item in selectedPreOrder?.items" :key="item.id" class="receipt-item-row">
                                <div class="item-name">{{ item.product?.description }}</div>
                                <div class="item-calc">
                                    <span>{{ item.quantity }} x {{ Number(item.price).toLocaleString() }}</span>
                                    <span class="item-total">{{ (item.quantity * item.price).toLocaleString() }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="dashed-line"></div>

                        <div class="receipt-footer">
                            <div class="receipt-total-row">
                                <span>ยอดรวม:</span>
                                <span class="grand-total">{{ Number(selectedPreOrder?.total_sold_price).toLocaleString()
                                }}</span>
                            </div>
                            <br>
                            <p>ขอบคุณที่ใช้บริการ</p>
                        </div>
                    </div>
                </div>

                <div class="modal-footer no-print">
                    <button class="cancel-btn-modal" @click="showDetailModal = false">ปิดหน้าต่าง</button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay no-print" @click.self="closeStockModal">
            <div class="modal large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-boxes"></i> เลือกสินค้าจากโกดังหลัก</h3>
                    <button class="close-icon-btn" @click="closeStockModal">&times;</button>
                </div>

                <div class="modal-search-bar">
                    <div class="search-input-wrapper">
                        <i class="fas fa-search search-icon-inside"></i>
                        <input type="text" v-model="searchKeyword" @input="debouncedSearch"
                            placeholder="ค้นหาชื่อสินค้า หรือ SKU..." class="modal-search-input">
                    </div>
                </div>

                <div class="modal-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>สินค้า</th>
                                <th class="text-right">คงเหลือ</th>
                                <th class="text-right">ราคาขาย</th>
                                <th class="text-center" width="150">จำนวนที่จะโอน</th>
                                <th class="text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody v-if="!loading">
                            <tr v-for="stock in warehouseStocks" :key="stock.id">
                                <td class="bold">{{ stock.product.description }}</td>
                                <td class="text-right">{{ stock.quantity }} {{ stock.product.unit || 'ชิ้น' }}</td>
                                <td class="text-right">฿{{ Number(stock.product.sell_price).toLocaleString() }}</td>
                                <td class="text-center">
                                    <input type="number" v-model.number="addQuantities[stock.id]" min="1"
                                        :max="stock.quantity" class="modal-qty-input">
                                </td>
                                <td class="text-center">
                                    <button class="mini-add-btn" @click="addItem(stock)"
                                        :disabled="!addQuantities[stock.id] || addQuantities[stock.id] > stock.quantity || addQuantities[stock.id] < 1">
                                        <i class="fas fa-plus"></i> เพิ่ม
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="warehouseStocks.length === 0">
                                <td colspan="5" class="text-center py-4">ไม่พบสินค้าในคลัง</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="modal-pagination" v-if="totalPages > 1">
                    <button @click="changeModalPage(currentPage - 1)" :disabled="currentPage === 1">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="page-info">หน้า {{ currentPage }} / {{ totalPages }}</span>
                    <button @click="changeModalPage(currentPage + 1)" :disabled="currentPage === totalPages">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

// --- State Management ---
const currentTab = ref('list');
const loading = ref(false);
const preOrders = ref([]);
const trucks = ref([]);
const allCustomers = ref([]);
const warehouseStocks = ref([]);
const filterStatus = ref('');

// State สำหรับ Pagination หน้า PreOrder
const preOrderCurrentPage = ref(1);
const preOrdersTotalPages = ref(1);

// [เพิ่ม] State สำหรับ Search PreOrder
const preOrderSearchTerm = ref('');

// Form State
const truckId = ref(null);
const customerId = ref(null);
const customerSearchTerm = ref('');
const showCustomerDropdown = ref(false);
const isCredit = ref(false);
const creditType = ref('week');
const items = ref([]);

// Edit Mode State
const isEditing = ref(false);
const editingId = ref(null);

// Modal & Pagination State
const showModal = ref(false);
const showDetailModal = ref(false);
const selectedPreOrder = ref(null);
const searchKeyword = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const addQuantities = ref({});

// --- Utility ---
let searchTimeout = null;
const debounce = (func, delay) => {
    let timeout = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

// --- Computed ---
const filteredCustomers = computed(() => {
    if (!customerSearchTerm.value) return allCustomers.value.slice(0, 10);
    const query = customerSearchTerm.value.toLowerCase();
    return allCustomers.value.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.customer_no && String(c.customer_no).includes(query))
    ).slice(0, 10);
});

const totalSoldPrice = computed(() => items.value.reduce((sum, i) => sum + (i.quantity * i.price), 0));

// --- Functions ---

// [แก้ไข] รองรับ Pagination และ Search
const fetchPreOrders = async (page = 1) => {
    try {
        preOrderCurrentPage.value = page;

        const res = await axios.get('/pre-orders', {
            params: {
                status: filterStatus.value,
                page: page,
                limit: 10,
                search: preOrderSearchTerm.value // [เพิ่ม] ส่ง search term ไปที่ API
            }
        });

        preOrders.value = res.data.data;
        preOrdersTotalPages.value = res.data.meta?.last_page || 1;

    } catch (e) {
        console.error("Fetch PreOrders Error:", e);
    }
};

// [เพิ่ม] Debounce สำหรับ search pre-orders เพื่อไม่ให้ยิง API รัวๆ
const debouncedFetchPreOrders = debounce(() => {
    fetchPreOrders(1); // ค้นหาใหม่ ให้กลับไปหน้า 1
}, 500);

const changePreOrderPage = (page) => {
    if (page >= 1 && page <= preOrdersTotalPages.value) {
        fetchPreOrders(page);
    }
};

const fetchInitialData = async () => {
    try {
        const [tRes, cRes] = await Promise.all([axios.get('/trucks'), axios.get('/customers')]);
        trucks.value = tRes.data.data;
        allCustomers.value = cRes.data.data;
    } catch (e) {
        console.error("Initial Load Error:", e);
    }
};

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
const debouncedSearchCustomers = debounce(searchCustomers, 300);

const fetchWarehouseStocks = async () => {
    if (!truckId.value) return;
    loading.value = true;
    try {
        const res = await axios.get('/warehouse-stocks', {
            params: {
                page: currentPage.value,
                search: searchKeyword.value,
                limit: 1000
            }
        });
        warehouseStocks.value = res.data.data;
        warehouseStocks.value.forEach(item => {
            if (!addQuantities.value[item.id]) {
                addQuantities.value[item.id] = 1;
            }
        });
        totalPages.value = res.data.meta.last_page;
    } catch (err) {
        console.error('โหลดสินค้าในคลังไม่สำเร็จ', err);
    } finally {
        loading.value = false;
    }
};

const debouncedSearch = debounce(() => {
    currentPage.value = 1;
    fetchWarehouseStocks();
}, 500);

const changeModalPage = (page) => {
    currentPage.value = page;
    fetchWarehouseStocks();
};

const openStockModal = () => {
    if (!truckId.value) {
        return Swal.fire('แจ้งเตือน', 'กรุณาเลือกรถที่จะรับของก่อน', 'warning');
    }
    searchKeyword.value = '';
    currentPage.value = 1;
    fetchWarehouseStocks();
    showModal.value = true;
};

const closeStockModal = () => {
    showModal.value = false;
};

const selectCustomer = (c) => {
    customerId.value = c.id;
    customerSearchTerm.value = `${c.name} (${c.customer_no})`;
    showCustomerDropdown.value = false;
};

const hideCustomerDropdown = () => {
    setTimeout(() => {
        showCustomerDropdown.value = false;
        if (customerId.value === null) {
            if (!customerSearchTerm.value) customerSearchTerm.value = '';
        }
    }, 150);
};

const addItem = (stock) => {
    const qty = addQuantities.value[stock.id];
    const existing = items.value.find(i => i.productId === stock.product_id);

    if (existing) {
        existing.quantity += qty;
    } else {
        items.value.push({
            productId: stock.product_id,
            category: stock.product.category,
            description: stock.product.description,
            quantity: qty,
            price: parseFloat(stock.product.sell_price),
            discount: 0,
            soldPrice: parseFloat(stock.product.sell_price),
            isPaid: true
        });
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `เพิ่ม ${stock.product.description} แล้ว`,
        showConfirmButton: false,
        timer: 1000
    });
};

const removeItem = (index) => {
    items.value.splice(index, 1);
};

const editPreOrder = async (po) => {
    try {
        loading.value = true;
        const res = await axios.get(`/pre-orders/${po.id}`);
        const data = res.data;

        truckId.value = data.truck_id;
        customerId.value = data.customer_id;

        let customer = allCustomers.value.find(c => c.id === data.customer_id);
        if (!customer && data.customer) {
            customer = data.customer;
        }

        if (customer) {
            customerSearchTerm.value = `${customer.name} (${customer.customer_no})`;
        } else if (data.customer) {
            customerSearchTerm.value = `${data.customer.name} (${data.customer.customer_no})`;
        }

        isCredit.value = !!data.is_credit;
        if (data.is_credit) creditType.value = data.is_credit;

        items.value = data.items.map(i => ({
            productId: i.product_id,
            description: i.product?.description || 'สินค้า',
            quantity: i.quantity,
            price: Number(i.price),
            sold_price: Number(i.sold_price),
            discount: 0,
            is_paid: true
        }));

        isEditing.value = true;
        editingId.value = po.id;
        currentTab.value = 'form';

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลเพื่อแก้ไขได้', 'error');
    } finally {
        loading.value = false;
    }
};

const cancelEditMode = () => {
    isEditing.value = false;
    editingId.value = null;
    items.value = [];
    truckId.value = null;
    customerId.value = null;
    customerSearchTerm.value = '';
    currentTab.value = 'list';
};

const submitPreOrder = async () => {
    if (!truckId.value || !customerId.value || items.value.length === 0) {
        return Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
    }

    loading.value = true;

    const payload = {
        truckId: truckId.value,
        customerId: customerId.value,
        isCredit: isCredit.value ? creditType.value : null,
        totalPrice: totalSoldPrice.value,
        totalDiscount: 0,
        totalSoldPrice: totalSoldPrice.value,
        items: items.value.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            sold_price: i.price,
            discount: "0.00"
        }))
    };

    try {
        if (isEditing.value) {
            await axios.put(`/pre-orders/${editingId.value}`, payload);
            Swal.fire('สำเร็จ', 'แก้ไขข้อมูลเรียบร้อยแล้ว', 'success');
        } else {
            await axios.post('/pre-orders', payload);
            Swal.fire('สำเร็จ', 'เปิดบิลและโอนสินค้าขึ้นรถแล้ว', 'success');
        }

        cancelEditMode();
        fetchPreOrders();
    } catch (e) {
        Swal.fire('ผิดพลาด', e.response?.data?.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
        loading.value = false;
    }
};

const cancelPreOrder = (po) => {
    Swal.fire({
        title: 'ดึงของกลับโกดัง?',
        text: `ยกเลิกบิล ${po.bill_no} และดึงสินค้าจากรถกลับเข้าโกดังหลัก`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        confirmButtonText: 'ยืนยันยกเลิกและคืนของ'
    }).then(async (res) => {
        if (res.isConfirmed) {
            try {
                await axios.post(`/pre-orders/${po.id}/cancel`);
                Swal.fire('เรียบร้อย', 'คืนของเข้าโกดังแล้ว', 'success');
                fetchPreOrders();
            } catch (e) {
                Swal.fire('Error', 'ไม่สามารถยกเลิกได้', 'error');
            }
        }
    });
};

const viewDetail = async (po) => {
    try {
        const res = await axios.get(`/pre-orders/${po.id}`);
        selectedPreOrder.value = res.data;
        showDetailModal.value = true;
    } catch (e) {
        Swal.fire('Error', 'ไม่สามารถดึงข้อมูลรายละเอียดได้', 'error');
    }
};


const printDetail = () => {
    window.print();
};

onMounted(() => {
    fetchPreOrders();
    fetchInitialData();
});
</script>

<style scoped>
/* --- Layout & Global (Styles เดิม) --- */
/* ... (Style เดิมทั้งหมด) ... */

/* [แก้ไข] เพิ่ม Style ให้ filter-group เป็น Flex และมี gap */
.filter-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

/* [เพิ่ม] Style ให้ช่องค้นหาเล็กใน header */
.small-search {
    width: 250px !important;
    /* หรือขนาดที่ต้องการ */
}

/* ... (Style เดิมอื่นๆ ต่อจากนี้) ... */
.preorder-container {
    max-width: 1240px;
    margin: 2rem auto;
    padding: 0 1.5rem;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: #2d3748;
}

.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.text-center {
    text-align: center !important;
}

.text-right {
    text-align: right !important;
}

.bold {
    font-weight: 700;
}

.py-4 {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
}

.mt-4 {
    margin-top: 1.5rem;
}

/* Tabs */
.tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
    border-bottom: 2px solid #e2e8f0;
}

.tab-btn {
    padding: 12px 24px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 600;
    color: #718096;
    transition: 0.3s;
    font-size: 1rem;
}

.tab-btn.active {
    color: var(--primary-color);
    border-bottom: 3px solid var(--primary-color);
}

.tab-btn i {
    margin-right: 8px;
}

/* Dashboard */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.status-select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
}

.price-text {
    color: #3182ce;
    font-weight: 700;
}

.status-badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
}

.status-badge.pending {
    background: #feebc8;
    color: #92400e;
}

.status-badge.synced {
    background: #bee3f8;
    color: #2a4365;
}

.status-badge.completed {
    background: #c6f6d5;
    color: #22543d;
}

.status-badge.cancelled {
    background: #fed7d7;
    color: #822727;
}

/* Form */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 25px;
}

.required {
    color: #e53e3e;
}

.form-group {
    margin-bottom: 1.5rem;
    position: relative;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #4a5568;
}

.custom-select,
.search-input {
    width: 100%;
    padding: 11px 15px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    background: #f8fafc;
    transition: 0.2s;
}

.custom-select:focus,
.search-input:focus {
    border-color: var(--primary-color);
    outline: none;
    background: white;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon-inside {
    position: absolute;
    right: 15px;
    color: #a0aec0;
}

.dropdown {
    position: absolute;
    width: 100%;
    background: white;
    border: 1px solid #e2e8f0;
    z-index: 50;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    margin-top: 5px;
    max-height: 250px;
    overflow-y: auto;
}

.dropdown-item {
    padding: 12px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f7fafc;
    transition: 0.2s;
}

.dropdown-item:hover {
    background: #f7fafc;
    color: var(--primary-color);
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 1rem;
    cursor: pointer;
}

.checkbox-group input {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.credit-type-selector {
    display: flex;
    gap: 20px;
    margin-top: 15px;
    padding: 12px;
    background: #f1f5f9;
    border-radius: 10px;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

/* Product Table */
.product-table {
    width: 100%;
    border-collapse: collapse;
}

.product-table th {
    padding: 12px;
    border-bottom: 2px solid #edf2f7;
    color: #718096;
    font-size: 0.9rem;
}

.product-table td {
    padding: 15px 12px;
    border-bottom: 1px solid #edf2f7;
}

.qty-input {
    width: 80px;
    padding: 8px;
    text-align: center;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-weight: 700;
}

.remove-btn {
    color: #e53e3e;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 10px;
}

.sale-summary {
    margin-top: 2rem;
    border-top: 2px solid #edf2f7;
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.summary-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    font-size: 1.2rem;
    font-weight: 600;
}

.total-amount {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--primary-color);
}

.save-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 15px 40px;
    border-radius: 35px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: 0.3s;
}

.save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(49, 130, 206, 0.4);
}

/* Buttons */
.button-group {
    display: flex;
    gap: 15px;
    align-items: center;
}

.cancel-edit-btn {
    background: #cbd5e0;
    color: #2d3748;
    border: none;
    padding: 15px 30px;
    border-radius: 35px;
    font-weight: 700;
    cursor: pointer;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.action-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: none;
    color: white;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}

.view-btn {
    background: #3182ce;
}

.edit-btn {
    background: #ecc94b;
    color: #744210;
}

.delete-btn {
    background: #e53e3e;
    width: auto;
    padding: 0 15px;
    font-weight: 600;
    gap: 8px;
}

.add-btn {
    background: #48bb78;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(26, 32, 44, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    width: 95%;
    max-width: 900px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #edf2f7;
    padding-bottom: 1rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.print-btn {
    background: #4a5568;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.modal-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #2d3748;
}

.close-icon-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: #a0aec0;
    cursor: pointer;
    line-height: 1;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
}

/* Detail Specific */
.info-grid-detail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
}

.info-box {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.info-box label {
    font-size: 0.85rem;
    color: #718096;
    font-weight: 600;
}

.info-box span {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
}

.total-highlight {
    font-size: 1.5rem;
    color: var(--primary-color);
}

.modal-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.cancel-btn-modal {
    background: #cbd5e0;
    color: #4a5568;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}

/* Stock Modal */
.modal-search-bar {
    margin-bottom: 1.5rem;
}

.modal-search-input {
    width: 100%;
    padding: 12px 15px 12px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    font-size: 1rem;
}

.modal-search-bar .search-icon-inside {
    left: 15px;
    right: auto;
}

.modal-table-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #edf2f7;
    border-radius: 12px;
}

.modal-qty-input {
    width: 90px;
    padding: 8px;
    border: 1px solid #cbd5e0;
    border-radius: 8px;
    text-align: center;
    font-weight: 700;
    color: var(--primary-color);
}

.mini-add-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
}

.mini-add-btn:hover:not(:disabled) {
    background: #2b6cb0;
    transform: scale(1.05);
}

.mini-add-btn:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
}

/* Global Data Table */
.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: #f8fafc;
    padding: 15px;
    text-align: left;
    font-size: 0.85rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #edf2f7;
}

.data-table td {
    padding: 15px;
    border-bottom: 1px solid #edf2f7;
}

.print-only {
    display: none;
}

.screen-only {
    display: block;
}

/* Modal Pagination */
.modal-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 1.5rem;
}

.modal-pagination button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-pagination button:hover:not(:disabled) {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

/* Added Pagination Style for Main List */
.pagination {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 1.5rem;
    align-items: center;
}

.pagination button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4a5568;
}

.pagination button:hover:not(:disabled) {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.pagination button:disabled {
    background-color: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
}

.page-info {
    font-weight: 700;
    color: #4a5568;
}


@media (max-width: 1024px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<style>
@media print {

    /* 1. Reset พื้นที่กระดาษ */
    @page {
        size: auto;
        margin: 0mm;
        /* ไร้ขอบ */
    }

    /* 2. สั่ง Body ให้หดตัวเท่าเนื้อหา ห้ามมีความสูงค้าง */
    html,
    body {
        width: 100%;
        height: fit-content !important;
        /* ใช้ fit-content แทน auto เพื่อความชัวร์ */
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: white;
        overflow: hidden !important;
        /* ซ่อนส่วนเกินที่อาจจะล้นไปหน้า 2 */
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        color: #000;
    }

    /* 3. ซ่อนเนื้อหาอื่นแบบ Invisible (แต่ยังคง Layout ไว้กันพัง) */
    body * {
        visibility: hidden;
        height: 0;
        overflow: hidden;
    }

    /* 4. ดึง Modal ออกมาจากมิติเดิม มาแปะทับหน้าจอ */
    .printable-modal {
        visibility: visible !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;

        /* บังคับความสูงให้พอดีเนื้อหา */
        height: fit-content !important;

        /* ล้างค่า Overlay */
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 999999 !important;
        display: block !important;
    }

    /* 5. แสดงลูกหลาน */
    .printable-modal * {
        visibility: visible !important;
        height: auto;
    }

    /* 6. จัดกล่อง Modal */
    .printable-modal .modal {
        position: relative !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 5px !important;
        /* Padding น้อยที่สุด */
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        overflow: hidden !important;
        /* ตัดส่วนเกินใน Modal */
    }

    /* 7. เนื้อหา Modal */
    .modal-body {
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
    }

    /* 8. Toggle View */
    .screen-only {
        display: none !important;
    }

    .print-only {
        display: block !important;
    }

    /* 9. Receipt Styling */
    .receipt-layout {
        width: 100%;
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
    }

    .receipt-item-row {
        margin-bottom: 5px;
    }

    .item-name {
        font-size: 24px;
        font-weight: bold;
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

    /* 10. Hide Unwanted Elements */
    .no-print,
    .modal-footer,
    .close-icon-btn,
    .print-btn,
    .modal-header {
        display: none !important;
    }
}
</style>