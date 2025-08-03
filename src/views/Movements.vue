<template>
    <div class="product-table-container">
        <h2>ประวัติการเคลื่อนไหวสต็อก</h2>
        <table class="product-table">
            <thead>
                <tr>
                    <th>วันที่</th>
                    <th>รหัสสินค้า</th>
                    <th>ชื่อสินค้า</th>
                    <th>ประเภท</th>
                    <th>จำนวน</th>
                    <th>หมายเหตุ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>2025-08-01</td>
                    <td>SKU-001</td>
                    <td>สมาร์ทโฟน X Pro</td>
                    <td><span class="movement-in">รับเข้า</span></td>
                    <td>+50</td>
                    <td>รับจากซัพพลายเออร์ A</td>
                </tr>
                <tr>
                    <td>2025-08-01</td>
                    <td>SKU-002</td>
                    <td>หูฟังบลูทูธ</td>
                    <td><span class="movement-out">เบิกออก</span></td>
                    <td>-10</td>
                    <td>ขายให้ลูกค้าออนไลน์</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
// ไม่ต้องมีโค้ด JavaScript ที่นี่
</script>

<style scoped>
/* คัดลอก CSS ส่วนที่เกี่ยวกับตารางสินค้าจาก Dashboard.vue มาที่นี่ได้เลย */
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

.movement-in,
.movement-out {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
    color: var(--white-color);
}

.movement-in {
    background-color: #4CAF50;
    /* สีเขียว */
}

.movement-out {
    background-color: #f44336;
    /* สีแดง */
}
</style>