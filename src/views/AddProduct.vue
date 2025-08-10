<template>
    <div class="form-container">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form class="product-form" @submit.prevent="saveProduct">
            <div class="form-group">
                <label for="description">ชื่อสินค้า</label>
                <input v-model="form.description" type="text" id="description" placeholder="ป้อนชื่อสินค้า" />
                <small v-if="errors.description" class="error">{{ errors.description }}</small>
            </div>

            <div class="form-group">
                <label for="category">หมวดหมู่</label>
                <input v-model="form.category" type="text" id="category" placeholder="ป้อนหมวดหมู่" />
                <small v-if="errors.category" class="error">{{ errors.category }}</small>
            </div>

            <div class="form-group">
                <label for="brand">ยี่ห้อ</label>
                <input v-model="form.brand" type="text" id="brand" placeholder="ป้อนยี่ห้อ (เว้นว่างได้)" />
            </div>

            <div class="form-group">
                <label for="model">รุ่น</label>
                <input v-model="form.model" type="text" id="model" placeholder="ป้อนรุ่นสินค้า (เว้นว่างได้)" />
            </div>

            <div class="form-group">
                <label for="cost_price">ราคาทุน (บาท)</label>
                <input v-model="form.cost_price" type="number" id="cost_price" placeholder="ป้อนราคาทุน" />
                <small v-if="errors.cost_price" class="error">{{ errors.cost_price }}</small>
            </div>

            <div class="form-group">
                <label for="sell_price">ราคาขาย (บาท)</label>
                <input v-model="form.sell_price" type="number" id="sell_price" placeholder="ป้อนราคาขาย" />
                <small v-if="errors.sell_price" class="error">{{ errors.sell_price }}</small>
            </div>

            <div class="form-group">
                <label for="unit">หน่วย</label>
                <input v-model="form.unit" type="text" id="unit" placeholder="เช่น ชิ้น, ขวด, กล่อง" />
                <small v-if="errors.unit" class="error">{{ errors.unit }}</small>
            </div>

            <div class="form-actions">
                <button type="submit" class="save-btn">บันทึก</button>
                <router-link to="/products" class="cancel-btn">ยกเลิก</router-link>
            </div>
        </form>
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
    unit: ''
})

const errors = reactive({
    category: '',
    description: '',
    cost_price: '',
    sell_price: '',
    unit: ''
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
.form-container {
    background-color: var(--card-bg);
    padding: 30px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    max-width: 800px;
    margin: 0 auto;
}

.form-container h2 {
    text-align: center;
    margin-bottom: 25px;
    font-size: 24px;
}

.product-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #555;
}

.form-group input,
.form-group select {
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 20px;
}

.save-btn,
.cancel-btn {
    padding: 12px 25px;
    border: none;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
    text-decoration: none;
}

.save-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
}

.save-btn:hover {
    background-color: #43a047;
}

.cancel-btn {
    background-color: #e0e0e0;
    color: #666;
}

.cancel-btn:hover {
    background-color: #c0c0c0;
}

.error {
    color: red;
    font-size: 14px;
    margin-top: 5px;
}

@media (max-width: 768px) {
    .product-form {
        grid-template-columns: 1fr;
    }
}
</style>