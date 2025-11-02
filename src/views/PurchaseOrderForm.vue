<template>
    <div class="po-form-container">
        <h2 class="section-title">
            <i :class="isEditing ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            {{ isEditing ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อใหม่' }}
        </h2>

        <div class="form-grid">
            <div class="card">
                <h3 class="card-title">ข้อมูลใบสั่งซื้อ</h3>
                <div class="form-group">
                    <label>ผู้จำหน่าย (Supplier)</label>
                    <input type="text" v-model="form.supplier_name" placeholder="ชื่อร้านค้า หรือผู้จำหน่าย" />
                </div>
                <div class="form-group">
                    <label>หมายเหตุ</label>
                    <textarea v-model="form.notes" placeholder="รายละเอียดเพิ่มเติม"></textarea>
                </div>
            </div>

            <div class="card">
                <h3 class="card-title">เพิ่มรายการสินค้า</h3>
                <div class="add-item-form">
                    <div class="search-group">
                        <label>ค้นหาสินค้า</label>
                        <input type="text" v-model="searchTerm" @input="debouncedSearch"
                            placeholder="พิมพ์ชื่อ หรือ รหัสสินค้า..." />
                        <div v-if="searchResults.length" class="search-results">
                            <div v-for="product in searchResults" :key="product.id" class="result-item"
                                @click="selectProduct(product)">
                                {{ product.description }} ({{ product.brand }})
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedProduct" class="selected-product-form">
                        <div class="form-group">
                            <label>จำนวน</label>
                            <input type="number" v-model.number="addItemForm.quantity" min="1" />
                        </div>
                        <div class="form-group">
                            <label>ราคาต้นทุน/หน่วย</label>
                            <input type="number" v-model.number="addItemForm.cost_price" step="0.01" min="0" />
                        </div>
                        <button class="add-btn" @click="addItemToList">
                            <i class="fas fa-plus"></i> เพิ่ม
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card summary-card">
            <h3 class="card-title">สรุปรายการ ({{ form.items.length }} รายการ)</h3>
            <div class="table-responsive">
                <table class="product-table summary-table">
                    <thead>
                        <tr>
                            <th>สินค้า</th>
                            <th>จำนวน</th>
                            <th>ต้นทุน/หน่วย</th>
                            <th>รวม</th>
                            <th>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in form.items" :key="index">
                            <td>{{ item.product_name }}</td>

                            <td class="quantity-control-cell">
                                <button class-="qty-btn" @click="updateItemQuantity(index, -1)"
                                    :disabled="item.quantity <= 1">-</button>
                                <input type="number" v-model.number="item.quantity" min="1" class="qty-input">
                                <button class-="qty-btn" @click="updateItemQuantity(index, 1)">+</button>
                            </td>

                            <td>{{ item.cost_price.toFixed(2) }}</td>
                            <td>{{ (item.quantity * item.cost_price).toFixed(2) }}</td>
                            <td>
                                <button class="remove-btn" @click="removeItem(index)">&times;</button>
                            </td>
                        </tr>
                        <tr v-if="form.items.length === 0">
                            <td colspan="5" style="text-align: center;">ยังไม่มีรายการสินค้า</td>
                        </tr>
                    </tbody>

                    <tfoot v-if="form.items.length > 0">
                        <tr class="total-row">
                            <td colspan="3" class="total-label">ยอดรวมสุทธิ (Total)</td>
                            <td class="total-value">{{ totalCost.toFixed(2) }}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div class="action-bar">
            <button class="cancel-btn" @click="cancel">ยกเลิก</button>
            <button class="save-btn" @click="submitForm" :disabled="loading || form.items.length === 0">
                <span v-if="loading">กำลังบันทึก...</span>
                <span v-else>บันทึกใบสั่งซื้อ</span>
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

// ดึงข้อมูล PO เดิม (กรณีแก้ไข)
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

// Search Products
const debouncedSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (searchTerm.value.length < 2) {
            searchResults.value = [];
            return;
        }
        try {
            const res = await axios.get(`/products?search=${searchTerm.value}`);
            searchResults.value = res.data.data;
        } catch (error) { console.error('Search error:', error); }
    }, 500);
};

const selectProduct = (product) => {
    selectedProduct.value = product;
    addItemForm.value.cost_price = parseFloat(product.cost_price) || 0;
    searchTerm.value = '';
    searchResults.value = [];
};

// Add/Remove Items
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
            product_name: selectedProduct.value.description,
            quantity: addItemForm.value.quantity,
            cost_price: addItemForm.value.cost_price,
        });
    }
    selectedProduct.value = null;
    addItemForm.value = { quantity: 1, cost_price: 0 };
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

// Submit (Create/Update)
const submitForm = async () => {
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
    max-width: 1200px;
    margin: 2rem auto;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 2rem;
    text-align: center;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.card {
    background-color: var(--card-bg);
    padding: 1.5rem 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.card-title {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 16px;
}

.form-group textarea {
    min-height: 100px;
}

.add-item-form .search-group {
    position: relative;
    margin-bottom: 1rem;
}

.search-results {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    max-height: 200px;
    overflow-y: auto;
    width: 100%;
    z-index: 10;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgb(0 0 0 / 0.1);
}

.result-item {
    padding: 8px 12px;
    cursor: pointer;
}

.result-item:hover {
    background-color: #f0f0f0;
}

.selected-product-form {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 10px;
    align-items: end;
}

.add-btn {
    background-color: #3182ce;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
}

.summary-card {
    margin-top: 1.5rem;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
}

.product-table th,
.product-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.product-table th {
    background-color: #f8f9fa;
}

.remove-btn {
    background: transparent;
    border: none;
    color: #e53e3e;
    font-size: 20px;
    cursor: pointer;
}

.action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.save-btn,
.cancel-btn {
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-size: 16px;
}

.save-btn {
    background-color: var(--primary-color);
    color: white;
}

.save-btn:disabled {
    background-color: #a0aec0;
}

.cancel-btn {
    background-color: #e2e8f0;
    color: #4a5568;
}

.quantity-control-cell {
    display: flex;
    align-items: center;
    gap: 5px;
}

.qty-input {
    width: 60px;
    text-align: center;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
}

.qty-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    /* ทำให้เป็นวงกลม */
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
}

.qty-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.qty-btn:hover:not(:disabled) {
    background-color: #2c7a7b;
}

/* สไตล์สำหรับแถวสรุปยอดรวม (Total Row) */
.total-row {
    background-color: #f8f9fa;
    border-top: 2px solid #ddd;
}

.total-label {
    text-align: right !important;
    font-size: 1.1rem;
    font-weight: bold;
}

.total-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary-color);
}

@media (max-width: 900px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>