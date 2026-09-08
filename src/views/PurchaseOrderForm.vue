<template>
    <div class="po-form-container">
        <!-- Header Banner -->
        <div class="po-form-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i :class="isEditing ? 'fas fa-pen-to-square' : 'fas fa-file-circle-plus'"></i>
                </div>
                <div>
                    <h2 class="section-title">{{ isEditing ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อใหม่' }}</h2>
                    <p class="section-subtitle">ระบุข้อมูลผู้จำหน่ายและเลือกสินค้าเพื่อทำใบสั่งซื้อเข้าสต็อก</p>
                </div>
            </div>

            <button class="btn btn-secondary" @click="cancel">
                <i class="fas fa-arrow-left"></i>
                <span>ย้อนกลับ</span>
            </button>
        </div>

        <div class="form-grid-split">
            <!-- Left Card: Supplier & Notes -->
            <div class="card form-card">
                <h3 class="card-title">
                    <i class="fas fa-truck-field"></i> ข้อมูลผู้จำหน่าย
                </h3>
                <div class="form-group">
                    <label>ผู้จำหน่าย (Supplier) <span class="required">*</span></label>
                    <input
                        type="text"
                        v-model="form.supplier_name"
                        placeholder="ชื่อร้านค้า หรือผู้จำหน่าย..."
                        class="form-control"
                        required
                    />
                </div>
                <div class="form-group">
                    <label>หมายเหตุ</label>
                    <textarea
                        v-model="form.notes"
                        placeholder="รายละเอียดเพิ่มเติม หรือเงื่อนไขการส่ง..."
                        class="form-control"
                        rows="3"
                    ></textarea>
                </div>
            </div>

            <!-- Right Card: Product Search & Add -->
            <div class="card form-card">
                <h3 class="card-title">
                    <i class="fas fa-boxes-stacked"></i> เพิ่มรายการสินค้า
                </h3>
                <div class="add-item-form">
                    <div class="search-group">
                        <label class="font-semibold text-sm mb-1 block">ค้นหาสินค้าจากระบบ</label>
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon-inside"></i>
                            <input
                                type="text"
                                v-model="searchTerm"
                                @input="handleSearchInput"
                                placeholder="พิมพ์ชื่อ หรือ รหัส SKU สินค้า..."
                                class="form-control search-input-styled"
                            />
                            <button v-if="searchTerm" class="clear-search-btn" @click="clearSearch" type="button">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div v-if="searchResults.length" class="search-results-dropdown">
                            <div
                                v-for="product in searchResults"
                                :key="product.id"
                                class="result-item"
                                @click="selectProduct(product)"
                            >
                                <div class="product-info">
                                    <span class="product-name font-bold">{{ product.description }}</span>
                                    <span class="product-brand text-muted text-xs">{{ product.brand || 'ทั่วไป' }} • {{ product.category }}</span>
                                </div>
                                <span class="product-code-pill">#{{ product.product_code }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedProduct" class="selected-product-box animate-fade-in">
                        <div class="selected-name-bar">
                            <i class="fas fa-box"></i>
                            <span class="font-bold">{{ selectedProduct.description }}</span>
                        </div>
                        <div class="selected-product-controls">
                            <div class="form-group">
                                <label>จำนวน</label>
                                <input
                                    type="number"
                                    v-model.number="addItemForm.quantity"
                                    min="1"
                                    class="form-control tabular-nums text-center"
                                />
                            </div>
                            <div class="form-group">
                                <label>ต้นทุน/หน่วย (บาท)</label>
                                <input
                                    type="number"
                                    v-model.number="addItemForm.cost_price"
                                    step="0.01"
                                    min="0"
                                    class="form-control tabular-nums text-right"
                                />
                            </div>
                            <button class="btn btn-primary add-item-btn" @click="addItemToList" type="button">
                                <i class="fas fa-plus"></i> เพิ่มลงรายการ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary Items Card -->
        <div class="table-card">
            <div class="table-card-header">
                <div>
                    <h3 class="card-title">สรุปรายการสินค้าในใบสั่งซื้อ</h3>
                    <p class="card-subtitle">ทั้งหมด {{ form.items.length }} รายการ</p>
                </div>
            </div>

            <div class="table-container">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th width="60" class="text-center">#</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th width="150" class="text-center">จำนวน</th>
                            <th width="150" class="text-right">ต้นทุน/หน่วย</th>
                            <th width="160" class="text-right">รวมเงิน</th>
                            <th width="70" class="text-center">ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in form.items" :key="index">
                            <td class="text-center text-muted tabular-nums">{{ index + 1 }}</td>
                            <td class="font-bold text-main">{{ item.product_name }}</td>
                            <td>
                                <span class="stock-pill pill-medium">{{ item.category || 'ทั่วไป' }}</span>
                            </td>
                            <td class="text-center">
                                <div class="stepper-wrap">
                                    <button class="step-btn" @click="updateItemQuantity(index, -1)" :disabled="item.quantity <= 1">-</button>
                                    <input type="number" v-model.number="item.quantity" min="1" class="form-control step-input tabular-nums">
                                    <button class="step-btn" @click="updateItemQuantity(index, 1)">+</button>
                                </div>
                            </td>
                            <td class="text-right tabular-nums">฿{{ item.cost_price.toFixed(2) }}</td>
                            <td class="text-right tabular-nums font-bold text-success">
                                ฿{{ (item.quantity * item.cost_price).toFixed(2) }}
                            </td>
                            <td class="text-center">
                                <button class="btn-icon-danger" @click="removeItem(index)" title="ลบรายการ">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="form.items.length === 0">
                            <td colspan="7" class="text-center py-5 text-muted">
                                <div class="empty-state">
                                    <i class="fas fa-basket-shopping empty-icon"></i>
                                    <p class="empty-title">ยังไม่มีรายการสินค้าในใบสั่งซื้อ</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot v-if="form.items.length > 0">
                        <tr class="total-row-footer">
                            <td colspan="5" class="text-right font-bold" style="font-size: 1.05rem;">ยอดรวมสุทธิทั้งสิ้น (Total):</td>
                            <td class="text-right tabular-nums font-bold text-success" style="font-size: 1.25rem;">
                                ฿{{ totalCost.toFixed(2) }}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- Action Bar -->
        <div class="action-footer-bar">
            <button class="btn btn-secondary" @click="cancel">ยกเลิก</button>
            <button class="btn btn-primary save-po-btn" @click="submitForm" :disabled="loading || form.items.length === 0">
                <i class="fas fa-check"></i>
                <span v-if="loading">กำลังบันทึก...</span>
                <span v-else>{{ isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างใบสั่งซื้อ' }}</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const poId = computed(() => route.params.id);
const isEditing = computed(() => !!poId.value);

const form = ref({
    supplier_name: '',
    notes: '',
    items: [],
});
const loading = ref(false);

const searchTerm = ref('');
const searchResults = ref([]);
const selectedProduct = ref(null);
const addItemForm = ref({ quantity: 1, cost_price: 0 });

let debounceTimer = null;

const totalCost = computed(() => {
    return form.value.items.reduce((total, item) => {
        return total + (item.quantity * item.cost_price);
    }, 0);
});

// --- Logic การค้นหาและเลือกสินค้า ---

// [ใหม่] ฟังก์ชันล้างค่าการค้นหา
const clearSearch = () => {
    searchTerm.value = '';
    searchResults.value = [];
    selectedProduct.value = null;
    addItemForm.value = { quantity: 1, cost_price: 0 };
};

// [ปรับปรุง] เมื่อผู้ใช้พิมพ์
const handleSearchInput = () => {
    // ถ้ามีการพิมพ์แก้ไข ให้เคลียร์สินค้าที่เลือกไว้ (เพื่อให้เลือกใหม่)
    if (selectedProduct.value) {
        selectedProduct.value = null;
        addItemForm.value = { quantity: 1, cost_price: 0 };
    }
    debouncedSearch();
};

const debouncedSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (!searchTerm.value || searchTerm.value.length < 2) {
            searchResults.value = [];
            return;
        }
        try {
            const res = await axios.get(`/products?search=${searchTerm.value}&perPage=1000`);
            searchResults.value = res.data.data;
        } catch (error) { console.error('Search error:', error); }
    }, 500);
};

// [ปรับปรุง] เลือกสินค้าแล้วชื่อค้างไว้
const selectProduct = (product) => {
    selectedProduct.value = product;
    addItemForm.value.cost_price = parseFloat(product.cost_price) || 0;

    // เอาชื่อสินค้ามาใส่ใน Input ค้างไว้
    searchTerm.value = product.description;

    // ซ่อน Dropdown
    searchResults.value = [];
};

// [ปรับปรุง] เพิ่มสินค้าแล้วค่อยล้าง
const addItemToList = () => {
    if (!selectedProduct.value || addItemForm.value.quantity < 1 || addItemForm.value.cost_price < 0) {
        Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกสินค้า, จำนวน, และราคาต้นทุน', 'warning');
        return;
    }

    const existingItem = form.value.items.find(item => item.product_id === selectedProduct.value.id);
    if (existingItem) {
        existingItem.quantity += addItemForm.value.quantity;
    } else {
        form.value.items.push({
            product_id: selectedProduct.value.id,
            category: selectedProduct.value.category,
            product_name: selectedProduct.value.description,
            quantity: addItemForm.value.quantity,
            cost_price: addItemForm.value.cost_price,
        });
    }

    // เพิ่มเสร็จแล้ว ล้างค่าทั้งหมด
    clearSearch();
};

const removeItem = (index) => {
    form.value.items.splice(index, 1);
};

const updateItemQuantity = (index, amount) => {
    const item = form.value.items[index];
    if (item.quantity + amount > 0) {
        item.quantity += amount;
    }
};

// --- จบ Logic การค้นหา ---

const fetchPOData = async () => {
    loading.value = true;
    try {
        const res = await axios.get(`/purchase-orders/${poId.value}`);
        const po = res.data;
        form.value = {
            id: po.id,
            supplier_name: po.supplier_name,
            notes: po.notes,
            items: po.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product.description,
                quantity: item.quantity,
                cost_price: parseFloat(item.cost_price)
            }))
        };
    } catch (error) {
        Swal.fire('Error', 'ไม่พบข้อมูลใบสั่งซื้อ', 'error');
        router.push({ name: 'PurchaseOrders' });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (isEditing.value) {
        fetchPOData();
    }
});

const submitForm = async () => {
    if (!form.value.supplier_name || form.value.supplier_name.trim() === '') {
        Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อผู้จำหน่าย (Supplier)', 'warning');
        return; // หยุดการทำงานทันที
    }

    // [เดิม] 2. ตรวจสอบรายการสินค้า
    if (form.value.items.length === 0) {
        Swal.fire('ผิดพลาด', 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ', 'warning'); // เปลี่ยน type เป็น warning จะดู soft กว่า error ครับ
        return;
    }
    loading.value = true;
    try {
        const payload = {
            supplier_name: form.value.supplier_name,
            notes: form.value.notes,
            items: form.value.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                cost_price: item.cost_price,
            })),
        };

        if (isEditing.value) {
            await axios.put(`/purchase-orders/${poId.value}`, payload);
        } else {
            await axios.post('/purchase-orders', payload);
        }

        Swal.fire('สำเร็จ!', 'บันทึกใบสั่งซื้อเรียบร้อยแล้ว', 'success');
        router.push({ name: 'PurchaseOrders' });

    } catch (error) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกใบสั่งซื้อได้', 'error');
        console.error('PO submit error:', error);
    } finally {
        loading.value = false;
    }
};

const cancel = () => {
    router.back();
};
</script>

<style scoped>
.po-form-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.po-form-header {
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

/* Split Grid */
.form-grid-split {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 1.5rem;
    align-items: start;
}

.form-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.card-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-title i {
    color: var(--primary-color);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 6px;
}

.required {
    color: #ef4444;
}

/* Search Dropdown */
.search-group {
    position: relative;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input-styled {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
}

.clear-search-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
}

.clear-search-btn:hover {
    color: #ef4444;
}

.search-results-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 50;
    max-height: 240px;
    overflow-y: auto;
}

.result-item {
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s ease;
}

.result-item:hover {
    background: #eff6ff;
}

.product-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.product-code-pill {
    font-size: 0.8rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 600;
}

/* Selected Product Box */
.selected-product-box {
    margin-top: 1rem;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.selected-name-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary-color);
    font-size: 0.95rem;
}

.selected-product-controls {
    display: grid;
    grid-template-columns: 100px 160px 1fr;
    gap: 12px;
    align-items: end;
}

.add-item-btn {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

/* Table Stepper */
.stepper-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.step-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--text-main);
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
}

.step-btn:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: #eff6ff;
}

.step-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.step-input {
    width: 60px;
    text-align: center;
    padding: 6px 8px;
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

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.empty-icon {
    font-size: 2.5rem;
    color: #cbd5e1;
}

.empty-title {
    font-size: 0.95rem;
    color: #64748b;
    margin: 0;
}

.total-row-footer td {
    border-top: 2px solid var(--border-color);
    padding-top: 14px;
    padding-bottom: 14px;
}

.action-footer-bar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.save-po-btn {
    padding: 12px 28px;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}

@media (max-width: 1024px) {
    .form-grid-split {
        grid-template-columns: 1fr;
    }
    .selected-product-controls {
        grid-template-columns: 1fr;
    }
}
</style>