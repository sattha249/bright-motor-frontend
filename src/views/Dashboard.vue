<template>
    <div class="dashboard-widgets">
        <div class="widget">
            <h3>จำนวนสินค้าทั้งหมด</h3>
            <p class="value">1,234</p>
        </div>
        <div class="widget">
            <h3>สินค้าใกล้หมด</h3>
            <p class="value">56</p>
        </div>
        <div class="widget">
            <h3>มูลค่าสต็อก</h3>
            <p class="value">1,500,000 บาท</p>
        </div>
    </div>

    <div class="product-table-container">
        <h2>รายการสินค้า</h2>
        <router-link to="/products" class="add-product-btn">
            <i class="fas fa-plus"></i> เพิ่มสินค้าใหม่
        </router-link>
        <table class="product-table">
            <thead>
                <tr>
                    <th>รูป</th>
                    <th>รหัสสินค้า</th>
                    <th>ชื่อสินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคา</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><img src="https://via.placeholder.com/50" alt="Product Image"></td>
                    <td>SKU-001</td>
                    <td>สมาร์ทโฟน X Pro</td>
                    <td>150</td>
                    <td>12,500 บาท</td>
                    <td><span class="status-in-stock">ในสต็อก</span></td>
                    <td>
                        <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
</script>

<style scoped>
.dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.widget {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
    text-align: center;
}

.widget h3 {
    font-size: 18px;
    color: #666;
    margin-bottom: 10px;
}

.widget .value {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary-color);
}

.product-table-container {
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.product-table-container h2 {
    margin-bottom: 20px;
    font-size: 24px;
    display: inline-block;
}

.add-product-btn {
    float: right;
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
    text-decoration: none;
}

.add-product-btn:hover {
    background-color: #43a047;
}

.add-product-btn i {
    margin-right: 5px;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.product-table thead tr {
    background-color: var(--secondary-color);
    text-align: left;
}

.product-table th,
.product-table td {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
}

.product-table tbody tr:hover {
    background-color: #f9f9f9;
}

.product-table img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 8px;
}

.status-in-stock,
.status-low-stock,
.status-out-stock {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
    color: var(--white-color);
}

.status-in-stock {
    background-color: #4CAF50;
}

.status-low-stock {
    background-color: #ff9800;
}

.status-out-stock {
    background-color: #f44336;
}

.action-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    margin: 0 5px;
    padding: 5px;
    border-radius: 5px;
    transition: background-color 0.3s;
}

.edit-btn {
    color: #2196F3;
}

.delete-btn {
    color: #f44336;
}
</style>