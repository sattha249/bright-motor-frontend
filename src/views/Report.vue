<template>
    <div class="report-container">
        <h2 class="section-title"><i class="fas fa-chart-line"></i> รายงานการขาย</h2>

        <div class="filter-card">
            <div class="filter-group">
                <label>ตั้งแต่วันที่:</label>
                <input type="date" v-model="filters.startDate" @change="fetchReports(1)" />
            </div>
            <div class="filter-group">
                <label>ถึงวันที่:</label>
                <input type="date" v-model="filters.endDate" @change="fetchReports(1)" />
            </div>
            <div class="filter-group">
                <label>จุดขาย (รถ/โกดัง):</label>
                <select v-model="filters.truckId" @change="fetchReports(1)">
                    <option value="">ทั้งหมด</option>
                    <option :value="0">โกดังหลัก</option>
                    <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                        {{ truck.plate_number }}
                    </option>
                </select>
            </div>
            <div class="filter-actions">
                <button class="export-btn" @click="exportToExcel" :disabled="reports.length === 0">
                    <i class="fas fa-file-excel"></i> Export Excel
                </button>
            </div>
        </div>

        <div class="card">
            <div v-if="loading" class="loading-state">กำลังโหลดข้อมูล...</div>
            <div v-else-if="reports.length === 0" class="empty-state">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>

            <div v-else class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th>เลขที่บิล</th>
                            <th>ลูกค้า</th>
                            <th>จุดขาย</th>
                            <th>ยอดรวม (บาท)</th>
                            <th>ส่วนลด (บาท)</th>
                            <th>ยอดสุทธิ (บาท)</th>
                            <th>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="report in reports" :key="report.id">
                            <tr class="main-row">
                                <td>{{ formatDate(report.created_at) }}</td>
                                <td>{{ report.bill_no }}</td>
                                <td>{{ report.customer?.name || '-' }}</td>
                                <td>{{ getTruckName(report.truck) }}</td>
                                <td>{{ formatCurrency(report.total_price) }}</td>
                                <td class="text-red">{{ formatCurrency(report.total_discount) }}</td>
                                <td class="text-green font-bold">{{ formatCurrency(report.total_sold_price) }}</td>
                                <td>
                                    <button class="toggle-btn" @click="toggleDetails(report.id)">
                                        <i
                                            :class="expandedRows.includes(report.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="expandedRows.includes(report.id)" class="detail-row">
                                <td colspan="8">
                                    <div class="detail-container">
                                        <h4>รายการสินค้าในบิล {{ report.bill_no }}</h4>
                                        <table class="detail-table">
                                            <thead>
                                                <tr>
                                                    <th>สินค้า</th>
                                                    <th>จำนวน</th>
                                                    <th>ราคาต่อหน่วย</th>
                                                    <th>ส่วนลดต่อหน่วย</th>
                                                    <th>ราคาสุทธิ (รวม)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="item in report.items" :key="item.id">
                                                    <td>{{ item.product_id }}</td>
                                                    <td>{{ item.quantity }}</td>
                                                    <td>{{ formatCurrency(item.price) }}</td>
                                                    <td>{{ formatCurrency(item.discount) }}</td>
                                                    <td>{{ formatCurrency(item.quantity * item.sold_price) }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="4" class="text-right">รวมทั้งหมด</td>
                            <td>{{ formatCurrency(totalSummary.totalPrice) }}</td>
                            <td>{{ formatCurrency(totalSummary.totalDiscount) }}</td>
                            <td>{{ formatCurrency(totalSummary.totalSoldPrice) }}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="pagination" v-if="meta && meta.last_page > 1">
                <button @click="fetchReports(meta.current_page - 1)"
                    :disabled="!meta.previous_page_url">ก่อนหน้า</button>
                <span>หน้า {{ meta.current_page }} / {{ meta.last_page }}</span>
                <button @click="fetchReports(meta.current_page + 1)" :disabled="!meta.next_page_url">ถัดไป</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from '@/lib/axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment';

const reports = ref([]);
const trucks = ref([]);
const meta = ref(null);
const loading = ref(false);
const expandedRows = ref([]);

const filters = ref({
    startDate: '',
    endDate: '',
    truckId: ''
});

// Fetch Data
const fetchReports = async (page = 1) => {
    loading.value = true;
    try {
        const params = {
            page,
            start_date: filters.value.startDate,
            end_date: filters.value.endDate,
            truck_id: filters.value.truckId
        };
        const res = await axios.get('/sell-logs', { params });
        reports.value = res.data.data;
        meta.value = res.data.meta;
    } catch (error) {
        console.error('Error fetching reports:', error);
    } finally {
        loading.value = false;
    }
};

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks');
        trucks.value = res.data;
    } catch (error) {
        console.error('Error fetching trucks:', error);
    }
};

// Helpers
const formatDate = (date) => moment(date).format('DD/MM/YYYY HH:mm');
const formatCurrency = (value) => Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 });

const getTruckName = (truck) => {
    if (!truck) return 'โกดังหลัก';
    return `รถ ${truck.plate_number}`;
};

const toggleDetails = (id) => {
    if (expandedRows.value.includes(id)) {
        expandedRows.value = expandedRows.value.filter(rowId => rowId !== id);
    } else {
        expandedRows.value.push(id);
    }
};

// Computed Summary
const totalSummary = computed(() => {
    return reports.value.reduce((acc, report) => {
        acc.totalPrice += Number(report.total_price);
        acc.totalDiscount += Number(report.total_discount);
        acc.totalSoldPrice += Number(report.total_sold_price);
        return acc;
    }, { totalPrice: 0, totalDiscount: 0, totalSoldPrice: 0 });
});

// Export Excel
const exportToExcel = () => {
    // เตรียมข้อมูลสำหรับ Excel (Flat Data)
    const data = reports.value.flatMap(report => {
        return report.items.map(item => ({
            'วันที่': formatDate(report.created_at),
            'เลขที่บิล': report.bill_no,
            'ลูกค้า': report.customer?.name || '-',
            'จุดขาย': getTruckName(report.truck),
            'รหัสสินค้า': item.product_id,
            'จำนวน': item.quantity,
            'ราคาต่อหน่วย': Number(item.price),
            'ส่วนลดต่อหน่วย': Number(item.discount),
            'ราคาสุทธิ (รวม)': Number(item.quantity * item.sold_price)
        }));
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `sales_report_${moment().format('YYYYMMDD_HHmm')}.xlsx`);
};

onMounted(() => {
    fetchTrucks();
    fetchReports();
});
</script>

<style scoped>
.report-container {
    padding: 2rem;
    max-width: 1200px;
    margin: auto;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text-color-primary);
}

/* Filter Section */
.filter-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.filter-group label {
    font-weight: 600;
    font-size: 14px;
    color: #666;
}

.filter-group input,
.filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    min-width: 180px;
}

.filter-actions {
    margin-left: auto;
}

.export-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.3s;
}

.export-btn:hover {
    background-color: #218838;
}

.export-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* Table Styles */
.card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.report-table {
    width: 100%;
    border-collapse: collapse;
}

.report-table th,
.report-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.report-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #444;
}

.text-right {
    text-align: right;
}

.text-red {
    color: #e53e3e;
}

.text-green {
    color: #28a745;
}

.font-bold {
    font-weight: bold;
}

/* Detail Row */
.toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--primary-color);
}

.detail-row {
    background-color: #fcfcfc;
}

.detail-container {
    padding: 15px 30px;
    border-left: 4px solid var(--primary-color);
}

.detail-table {
    width: 100%;
    margin-top: 10px;
    border: 1px solid #eee;
}

.detail-table th {
    background-color: #e9ecef;
    font-size: 13px;
}

.total-row {
    background-color: #f1f1f1;
    font-weight: bold;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
    align-items: center;
}

.pagination button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
}

.pagination button:disabled {
    background: #f5f5f5;
    color: #ccc;
}
</style>