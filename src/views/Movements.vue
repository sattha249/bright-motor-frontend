<template>
    <div class="page-container movements-page">
        <!-- Page Header -->
        <div class="page-header-card">
            <div class="header-content-wrap">
                <div class="header-left-group">
                    <div class="page-icon-badge">
                        <i class="fas fa-history"></i>
                    </div>
                    <div>
                        <h1 class="page-title">ประวัติการเคลื่อนไหวสต็อก</h1>
                        <p class="page-subtitle">บันทึกการรับเข้า เบิกออก และการโอนย้ายสินค้าในระบบ</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table Card -->
        <div class="card table-card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 140px;">วันที่</th>
                            <th style="width: 140px;">รหัสสินค้า</th>
                            <th>ชื่อสินค้า</th>
                            <th style="width: 120px;">ประเภท</th>
                            <th class="text-right" style="width: 110px;">จำนวน</th>
                            <th>หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="tabular-nums font-medium text-secondary">2025-08-01</td>
                            <td class="tabular-nums font-bold text-primary">SKU-001</td>
                            <td class="font-medium">สมาร์ทโฟน X Pro</td>
                            <td>
                                <span class="stock-pill pill-high">
                                    <i class="fas fa-arrow-down"></i> รับเข้า
                                </span>
                            </td>
                            <td class="text-right tabular-nums font-bold text-success">+50</td>
                            <td class="text-secondary">รับจากซัพพลายเออร์ A</td>
                        </tr>
                        <tr>
                            <td class="tabular-nums font-medium text-secondary">2025-08-01</td>
                            <td class="tabular-nums font-bold text-primary">SKU-002</td>
                            <td class="font-medium">หูฟังบลูทูธ</td>
                            <td>
                                <span class="stock-pill pill-empty">
                                    <i class="fas fa-arrow-up"></i> เบิกออก
                                </span>
                            </td>
                            <td class="text-right tabular-nums font-bold text-danger">-10</td>
                            <td class="text-secondary">ขายให้ลูกค้าออนไลน์</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
</script>

<style scoped>
.movements-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.page-header-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.header-content-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.page-icon-badge {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.15));
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    border: 1px solid rgba(37, 99, 235, 0.2);
}

.page-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.page-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.2rem 0 0 0;
}

.table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
}
</style>