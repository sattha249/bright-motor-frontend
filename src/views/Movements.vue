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