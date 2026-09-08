<template>
    <div class="add-product-page">
        <div class="form-card">
            <div class="card-header">
                <div class="header-icon-box">
                    <i class="fas fa-box-open"></i>
                </div>
                <div>
                    <h2 class="card-title">เพิ่มสินค้าใหม่</h2>
                    <p class="card-subtitle">กรอกข้อมูลรายละเอียดสินค้าเพื่อบันทึกลงในระบบแคตตาล็อก</p>
                </div>
            </div>

            <form class="product-form" @submit.prevent="saveProduct">
                <div class="form-group">
                    <label for="product_code">
                        <span>รหัสสินค้า</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.product_code"
                        type="text"
                        id="product_code"
                        placeholder="เช่น P001, PART-0912"
                        class="form-control"
                        :class="{ 'has-error': errors.product_code }"
                    />
                    <small v-if="errors.product_code" class="error-msg">{{ errors.product_code }}</small>
                </div>

                <div class="form-group">
                    <label for="description">
                        <span>ชื่อสินค้า</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.description"
                        type="text"
                        id="description"
                        placeholder="ป้อนชื่อและรายละเอียดสินค้า"
                        class="form-control"
                        :class="{ 'has-error': errors.description }"
                    />
                    <small v-if="errors.description" class="error-msg">{{ errors.description }}</small>
                </div>

                <div class="form-group">
                    <label for="category">
                        <span>หมวดหมู่</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.category"
                        type="text"
                        id="category"
                        placeholder="เช่น อะไหล่เครื่องยนต์, น้ำมันเครื่อง"
                        class="form-control"
                        :class="{ 'has-error': errors.category }"
                    />
                    <small v-if="errors.category" class="error-msg">{{ errors.category }}</small>
                </div>

                <div class="form-group">
                    <label for="brand">
                        <span>ยี่ห้อ (แบรนด์)</span>
                    </label>
                    <input
                        v-model="form.brand"
                        type="text"
                        id="brand"
                        placeholder="เช่น Honda, Yamaha (เว้นว่างได้)"
                        class="form-control"
                    />
                </div>

                <div class="form-group">
                    <label for="model">
                        <span>รุ่น</span>
                    </label>
                    <input
                        v-model="form.model"
                        type="text"
                        id="model"
                        placeholder="เช่น Wave110i, Click150 (เว้นว่างได้)"
                        class="form-control"
                    />
                </div>

                <div class="form-group">
                    <label for="cost_price">
                        <span>ราคาทุน (บาท)</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.cost_price"
                        type="number"
                        step="0.01"
                        id="cost_price"
                        placeholder="0.00"
                        class="form-control tabular-nums"
                        :class="{ 'has-error': errors.cost_price }"
                    />
                    <small v-if="errors.cost_price" class="error-msg">{{ errors.cost_price }}</small>
                </div>

                <div class="form-group">
                    <label for="sell_price">
                        <span>ราคาขาย (บาท)</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.sell_price"
                        type="number"
                        step="0.01"
                        id="sell_price"
                        placeholder="0.00"
                        class="form-control tabular-nums"
                        :class="{ 'has-error': errors.sell_price }"
                    />
                    <small v-if="errors.sell_price" class="error-msg">{{ errors.sell_price }}</small>
                </div>

                <div class="form-group">
                    <label for="unit">
                        <span>หน่วยนับ</span>
                        <span class="required">*</span>
                    </label>
                    <input
                        v-model="form.unit"
                        type="text"
                        id="unit"
                        placeholder="เช่น ชิ้น, กล่อง, ชุด"
                        class="form-control"
                        :class="{ 'has-error': errors.unit }"
                    />
                    <small v-if="errors.unit" class="error-msg">{{ errors.unit }}</small>
                </div>

                <div class="form-group">
                    <label for="zone">
                        <span>จุดจัดเก็บในคลัง (Zone)</span>
                    </label>
                    <input
                        v-model="form.zone"
                        type="text"
                        id="zone"
                        placeholder="เช่น A-01, Shelf-B (เว้นว่างได้)"
                        class="form-control"
                    />
                </div>

                <div class="form-group">
                    <label for="max_quantity">
                        <span>ค่าแสดงเปอร์เซ็นต์ (Max Quantity)</span>
                    </label>
                    <input
                        v-model="form.max_quantity"
                        type="number"
                        id="max_quantity"
                        placeholder="ค่าเริ่มต้น 100"
                        class="form-control tabular-nums"
                    />
                    <span class="help-text">ใช้แสดงระดับสินค้าในสต็อก (มีมาก/ปานกลาง/ใกล้หมด/หมด)</span>
                </div>

                <div class="form-actions">
                    <router-link to="/products" class="btn btn-secondary">
                        <i class="fas fa-xmark"></i>
                        <span>ยกเลิก</span>
                    </router-link>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i>
                        <span>บันทึกสินค้า</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import axios from '../lib/axios'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
    category: '',
    description: '',
    brand: '',
    model: '',
    cost_price: '',
    sell_price: '',
    unit: '',
    product_code: '',
    zone: '',
    max_quantity: 100
})

const errors = reactive({
    category: '',
    description: '',
    cost_price: '',
    sell_price: '',
    unit: '',
    product_code: ''
})

const validateForm = () => {
    let valid = true
    Object.keys(errors).forEach(key => errors[key] = '')

    if (!form.description.trim()) {
        errors.description = 'กรุณากรอกชื่อสินค้า'
        valid = false
    }
    if (!form.category.trim()) {
        errors.category = 'กรุณากรอกหมวดหมู่'
        valid = false
    }
    if (!form.cost_price) {
        errors.cost_price = 'กรุณากรอกราคาทุน'
        valid = false
    }
    if (!form.sell_price) {
        errors.sell_price = 'กรุณากรอกราคาขาย'
        valid = false
    }
    if (!form.unit.trim()) {
        errors.unit = 'กรุณากรอกหน่วยสินค้า'
        valid = false
    }
    if (!form.product_code.trim()) {
        errors.product_code = 'กรุณากรอกรหัสสินค้า'
        valid = false
    }
    if (form.max_quantity <= 0) {
        form.max_quantity = 100
    }

    return valid
}

const saveProduct = async () => {
    if (!validateForm()) return

    try {
        await axios.post('/products', form)
        alert('บันทึกสินค้าสำเร็จ')
        router.push('/products')
    } catch (error) {
        console.error(error)
        alert('เกิดข้อผิดพลาดในการบันทึกสินค้า')
    }
}
</script>

<style scoped>
.add-product-page {
    display: flex;
    justify-content: center;
    padding: 12px 0 32px 0;
}

.form-card {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    max-width: 840px;
    width: 100%;
    padding: 32px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 28px;
}

.header-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
}

.card-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
}

.card-subtitle {
    font-size: 0.84rem;
    color: var(--text-muted);
    margin: 3px 0 0 0;
}

.product-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.required {
    color: #dc2626;
}

.form-control {
    padding: 11px 14px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.92rem;
    font-family: inherit;
    color: var(--text-primary);
    background: #f8fafc;
    transition: all 0.2s ease;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-control.has-error {
    border-color: #dc2626;
    background: #fef2f2;
}

.help-text {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.error-msg {
    color: #dc2626;
    font-size: 0.78rem;
    font-weight: 500;
}

.form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
    .product-form {
        grid-template-columns: 1fr;
    }

    .form-card {
        padding: 24px 18px;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions button,
    .form-actions a {
        width: 100%;
        justify-content: center;
    }
}
</style>