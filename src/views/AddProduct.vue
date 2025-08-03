<template>
    <div class="form-container">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form class="product-form">
            <div class="form-group">
                <label for="product-name">ชื่อสินค้า</label>
                <input type="text" id="product-name" name="product-name" placeholder="ป้อนชื่อสินค้า" required />
            </div>
            <div class="form-group">
                <label for="product-sku">รหัสสินค้า (SKU)</label>
                <input type="text" id="product-sku" name="product-sku" placeholder="ป้อนรหัสสินค้า" />
            </div>
            <div class="form-group">
                <label for="category">หมวดหมู่</label>
                <select id="category" name="category">
                    <option value="">เลือกหมวดหมู่</option>
                    <option value="electronics">อิเล็กทรอนิกส์</option>
                    <option value="apparel">เสื้อผ้า</option>
                    <option value="home">ของใช้ในบ้าน</option>
                </select>
            </div>
            <div class="form-group">
                <label for="quantity">จำนวน</label>
                <input type="number" id="quantity" name="quantity" placeholder="ป้อนจำนวนสินค้า" required />
            </div>
            <div class="form-group">
                <label for="price">ราคาต่อหน่วย (บาท)</label>
                <input type="number" id="price" name="price" placeholder="ป้อนราคา" required />
            </div>
            <div class="form-group">
                <label for="product-image">รูปภาพสินค้า</label>
                <input type="file" id="product-image" name="product-image" />
            </div>
            <div class="form-actions">
                <button type="submit" class="save-btn">บันทึก</button>
                <router-link to="/products" class="cancel-btn">ยกเลิก</router-link>
            </div>
        </form>
    </div>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
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

@media (max-width: 768px) {
    .product-form {
        grid-template-columns: 1fr;
    }
}
</style>