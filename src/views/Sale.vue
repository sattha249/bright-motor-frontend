<template>
    <div class="sale-container">
        <h2><i class="fas fa-cash-register"></i> บันทึกการขายสินค้า (หน้าโกดัง)</h2>
        <div class="card">

            <div class="controls-group">
                <div class="info-group">
                    <label>สถานที่ขาย:</label>
                    <span class="location-tag">โกดังหลัก</span>
                </div>

                <div class="select-group customer-search-group">
                    <label>ลูกค้า (Customer):</label>
                    <input type="text" v-model="customerSearchTerm" placeholder="ค้นหาลูกค้า..."
                        @input="debouncedSearchCustomers" @focus="showCustomerDropdown = true"
                        @blur="hideCustomerDropdown" />
                    <div class="dropdown" v-if="showCustomerDropdown">
                        <div v-for="customer in filteredCustomers" :key="customer.id" class="dropdown-item"
                            @mousedown.prevent="selectCustomer(customer)">
                            {{ customer.name }} ({{ customer.customer_no }})
                        </div>
                        <div v-if="filteredCustomers.length === 0" class="dropdown-item disabled">ไม่พบลูกค้า</div>
                    </div>
                </div>
            </div>

            <div class="add-item-bar">
                <button class="add-item-btn" @click="openModal" :disabled="customerId === null">
                    <i class="fas fa-box-open"></i> เพิ่มรายการสินค้า
                </button>

                <div class="credit-options-container">
                    <div class="checkbox-group main-credit">
                        <input type="checkbox" id="isCredit" v-model="isCredit" @change="handleCreditChange" />
                        <label for="isCredit">ติดเครดิต</label>
                    </div>

                    <div v-if="isCredit" class="credit-type-options">
                        <label class="radio-label">
                            <input type="radio" value="week" v-model="creditType"> สัปดาห์
                        </label>
                        <label class="radio-label">
                            <input type="radio" value="month" v-model="creditType"> เดือน
                        </label>
                    </div>
                </div>
            </div>

            <div class="summary-table-container">
                <h3>รายการสินค้าที่เลือก (Total: {{ totalItems }})</h3>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th v-if="isCredit" class="text-center">จ่าย</th>
                            <th>สินค้า</th>
                            <th>ประเภท</th>
                            <th>จำนวน</th>
                            <th>ราคา/หน่วย</th>
                            <th>ส่วนลด/หน่วย</th>
                            <th>รวมสุทธิ</th>
                            <th>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in items" :key="item.productId">
                            <td>{{ index + 1 }}</td>

                            <td v-if="isCredit" class="text-center">
                                <input type="checkbox" v-model="item.is_paid" class="paid-checkbox">
                            </td>

                            <td>{{ item.description }}</td>
                            <td>{{ item.category }}</td>
                            <td>
                                <input type="number" v-model.number="item.quantity" min="1" class="qty-input" />
                            </td>
                            <td>฿{{ parseFloat(item.price).toFixed(2) }}</td>
                            <td class="discount-cell">฿{{ parseFloat(item.discount || 0).toFixed(2) }}</td>
                            <td>฿{{ (item.quantity * (item.price - item.discount)).toFixed(2) }}</td>
                            <td>
                                <button class="remove-item-btn" @click="removeItem(item.productId)">
                                    &times;
                                </button>
                            </td>
                        </tr>
                        <tr v-if="items.length === 0">
                            <td :colspan="isCredit ? 8 : 7" style="text-align: center;">กรุณาเพิ่มรายการสินค้า</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="action-bar discount-controls-bar">
                <div class="discount-controls">
                    <label>ส่วนลดรวม:</label>
                    <div class="discount-btn-group">
                        <button v-for="pct in [5, 10, 15]" :key="pct" @click="applyDiscountPercentage(pct)"
                            class="discount-btn" :class="{ 'active': selectedDiscount === pct }"
                            :disabled="items.length === 0">
                            {{ pct }}%
                        </button>
                    </div>
                    <div class="discount-input-group">
                        <input type="number" v-model.number="manualDiscountAmount" placeholder="หรือกรอกจำนวนเงิน"
                            class="manual-discount-input" :disabled="items.length === 0" />
                        <button @click="applyManualDiscount" class="discount-btn apply-manual-btn"
                            :disabled="items.length === 0">เฉลี่ยลด</button>
                    </div>
                </div>

                <div class="sale-summary">
                    <p class="summary-line">รวมราคาสินค้า (ก่อนลด): ฿{{ totalOriginalPrice.toFixed(2) }}</p>
                    <p class="summary-line discount-amount">ส่วนลดรวม: ฿{{ totalDiscountAmount.toFixed(2) }}</p>

                    <template v-if="isCredit">
                        <hr class="summary-divider">
                        <p class="summary-line paid-today">จ่ายวันนี้: ฿{{ totalPaidToday.toFixed(2) }}</p>
                        <p class="summary-line credit-amount">ค้างชำระ (Credit): ฿{{ totalCreditAmount.toFixed(2) }}</p>
                        <hr class="summary-divider">
                    </template>

                    <h3 class="summary-line total-price">รวมทั้งสิ้น: ฿{{ totalSalePrice.toFixed(2) }}</h3>
                    <button class="save-sale-btn" @click="saveSale" :disabled="items.length === 0 || loading">
                        {{ loading ? 'กำลังบันทึก...' : 'บันทึกการขาย' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
                <h3>เลือกสินค้าในโกดัง</h3>
                <div class="search-box">
                    <input type="text" placeholder="ค้นหาสินค้า..." v-model="searchKeyword"
                        @input="debouncedFetchWarehouseStock" />
                    <i class="fas fa-search"></i>
                </div>

                <table class="product-table">
                    <thead>
                        <tr>
                            <th>รหัส</th>
                            <th>สินค้า</th>
                            <th>ประเภท</th>
                            <th>คงเหลือ</th>
                            <th>ราคาขาย</th>
                            <th>จำนวนที่ต้องการ</th>
                            <th>เพิ่ม</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="stock in filteredStocks" :key="stock.id">
                            <td>SKU-{{ stock.product_id }}</td>
                            <td>{{ stock.product.description }}</td>
                            <td>{{ stock.product.category }}</td>
                            <td>{{ stock.quantity }}</td>
                            <td>฿{{ parseFloat(stock.product.sell_price).toFixed(2) }}</td>
                            <td class="quantity-control-cell">
                                <input type="number" v-model.number="stock.tempQuantity" min="1" :max="stock.quantity"
                                    class="qty-input" />
                            </td>
                            <td>
                                <button class="add-to-list-btn"
                                    :disabled="stock.tempQuantity < 1 || stock.tempQuantity > stock.quantity"
                                    @click="addItemToSale(stock)">
                                    เพิ่ม
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredStocks.length === 0">
                            <td colspan="6" style="text-align: center;">ไม่พบสินค้าหรือคลังว่าง</td>
                        </tr>
                    </tbody>
                </table>

                <button class="close-btn" @click="closeModal">ปิด</button>
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
    items.value.forEach(item => { item.discount = item.price * discountFactor; });
    manualDiscountAmount.value = 0;
};

const applyManualDiscount = () => {
    selectedDiscount.value = 0;
    if (manualDiscountAmount.value < 0 || manualDiscountAmount.value > totalOriginalPrice.value) {
        Swal.fire('ผิดพลาด', 'ส่วนลดต้องไม่เป็นค่าลบและไม่เกินราคารวมทั้งหมด', 'error');
        return;
    }
    if (items.value.length === 0) return;
    const totalOriginal = totalOriginalPrice.value;
    const discountTotal = manualDiscountAmount.value;
    items.value.forEach(item => {
        const itemOriginalPrice = item.quantity * item.price;
        const ratio = itemOriginalPrice / totalOriginal;
        item.discount = discountTotal * ratio;
    });
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
/* ... Styles เดิม ... */
.sale-container {
    padding: 2rem;
    max-width: 1000px;
    margin: auto;
}

.sale-container h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 28px;
    color: var(--text-color-primary);
}

.card {
    background-color: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.controls-group,
.add-item-bar,
.action-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.add-item-bar {
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
}

/* [ใหม่] Credit Options Styles */
.credit-options-container {
    display: flex;
    align-items: center;
    gap: 20px;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    cursor: pointer;
}

.checkbox-group input {
    transform: scale(1.2);
}

.credit-type-options {
    display: flex;
    gap: 15px;
    background-color: #f0f4f8;
    padding: 5px 15px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    cursor: pointer;
    color: var(--text-color-primary);
}

/* ... (Styles ตารางและอื่นๆ เหมือนเดิม) ... */
.product-table {
    width: 100%;
    border-collapse: collapse;
}

.product-table th,
.product-table td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}

.product-table th {
    background-color: var(--secondary-color);
    font-weight: 600;
}

.text-center {
    text-align: center !important;
}

.paid-checkbox {
    transform: scale(1.5);
    cursor: pointer;
}

/* ... (Styles อื่นๆ คงเดิม) ... */
.select-group select {
    padding: 10px 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    min-width: 200px;
    font-size: 16px;
}

.add-item-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.add-item-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
}

.qty-input {
    width: 60px;
    padding: 5px;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.remove-item-btn {
    background-color: #e53e3e;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.save-sale-btn {
    background-color: var(--primary-color);
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    transition: background-color 0.3s;
}

.save-sale-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
}

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
    z-index: 1000;
}

.modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
}

.search-box {
    position: relative;
    margin-bottom: 1rem;
}

.search-box input {
    width: 100%;
    padding: 10px 15px;
    padding-left: 40px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.search-box i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.add-to-list-btn {
    background-color: #3182ce;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
}

.add-to-list-btn:disabled {
    background-color: #a0aec0;
}

.close-btn {
    margin-top: 1rem;
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

.customer-search-group {
    position: relative;
}

.customer-search-group input {
    padding: 10px 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    min-width: 250px;
}

.dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: white;
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 50;
    max-height: 200px;
    overflow-y: auto;
}

.dropdown-item {
    padding: 10px 15px;
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid #f4f4f4;
}

.dropdown-item:hover {
    background-color: var(--secondary-color);
}

.dropdown-item.disabled {
    cursor: default;
    color: #999;
}

.discount-controls-bar {
    flex-direction: column;
    align-items: flex-start;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    width: 100%;
}

.discount-controls {
    display: flex;
    gap: 20px;
    margin-bottom: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.discount-controls label {
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
}

.discount-btn-group {
    display: flex;
    gap: 8px;
}

.discount-btn {
    background-color: #f6ad55;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.discount-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.manual-discount-input {
    padding: 8px 10px;
    width: 150px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
}

.apply-manual-btn {
    background-color: #4299e1;
}

.sale-summary {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.summary-line {
    width: 350px;
    text-align: right;
    font-size: 1.1rem;
    font-weight: 500;
}

.discount-amount {
    color: #e53e3e;
    font-weight: 600;
    font-size: 1.2rem;
    border-top: 1px dashed var(--border-color);
    padding-top: 8px;
}

.total-price {
    font-size: 1.8rem;
    color: var(--primary-color);
    font-weight: 700;
}

.paid-today {
    color: #38a169;
    /* สีเขียว */
    font-weight: 600;
}

.credit-amount {
    color: #e53e3e;
    /* สีแดง */
    font-weight: 600;
}

.summary-divider {
    width: 100%;
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 5px 0;
}

.discount-btn.active {
    background-color: #c05621;
    /* สีเข้มขึ้น */
    color: white;
    transform: scale(1.05);
    /* ขยายเล็กน้อย */
    box-shadow: 0 0 0 2px rgba(237, 137, 54, 0.5);
    /* เพิ่มเงาขอบ */
}
</style>