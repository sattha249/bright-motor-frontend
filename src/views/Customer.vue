<template>
    <div class="customer-view-container">
        <!-- Header Banner -->
        <div class="customer-header">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <h2 class="section-title">จัดการข้อมูลลูกค้า (Customers)</h2>
                    <p class="section-subtitle">บันทึกและตรวจสอบรายชื่อลูกค้า ข้อมูลติดต่อ และที่อยู่สำหรับการจัดส่ง</p>
                </div>
            </div>
            <button class="btn btn-primary" @click="toggleForm">
                <i :class="showForm ? 'fas fa-times' : 'fas fa-user-plus'"></i>
                <span>{{ showForm ? 'ยกเลิก / ปิดฟอร์ม' : 'เพิ่มลูกค้าใหม่' }}</span>
            </button>
        </div>

        <!-- Add/Edit Form Card -->
        <div v-if="showForm" class="form-card animate-fade-in">
            <div class="form-card-header">
                <div class="form-card-title">
                    <i class="fas" :class="isEditing ? 'fa-user-pen' : 'fa-user-plus'"></i>
                    <h3>{{ isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'กรอกข้อมูลลูกค้าใหม่' }}</h3>
                </div>
            </div>

            <form @submit.prevent="submitForm">
                <div class="form-grid-modern">
                    <div class="form-group">
                        <label for="name">ชื่อ-นามสกุล / ชื่อร้าน <span class="required">*</span></label>
                        <input type="text" id="name" v-model="form.name" class="form-control" required placeholder="ระบุชื่อลูกค้า..." />
                    </div>
                    <div class="form-group">
                        <label for="customerNo">รหัสลูกค้า</label>
                        <input type="text" id="customerNo" v-model="form.customerNo" class="form-control" placeholder="เช่น CUS-001" />
                    </div>
                    <div class="form-group">
                        <label for="tel">เบอร์โทรศัพท์</label>
                        <input type="text" id="tel" v-model="form.tel" class="form-control" placeholder="08X-XXX-XXXX" />
                    </div>
                    <div class="form-group">
                        <label for="email">อีเมล</label>
                        <input type="email" id="email" v-model="form.email" class="form-control" placeholder="example@domain.com" />
                    </div>
                    <div class="form-group full-width">
                        <label for="address">ที่อยู่จัดส่ง</label>
                        <textarea id="address" v-model="form.address" class="form-control" rows="2" placeholder="บ้านเลขที่, ถนน, ซอย..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="district">เขต/อำเภอ</label>
                        <input type="text" id="district" v-model="form.district" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="province">จังหวัด</label>
                        <input type="text" id="province" v-model="form.province" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="postCode">รหัสไปรษณีย์</label>
                        <input type="text" id="postCode" v-model="form.postCode" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="country">ประเทศ</label>
                        <input type="text" id="country" v-model="form.country" class="form-control" placeholder="ไทย" />
                    </div>
                </div>

                <div class="form-actions-bar">
                    <button type="button" class="btn btn-secondary" @click="toggleForm">ยกเลิก</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i>
                        <span>{{ isEditing ? 'บันทึกการแก้ไข' : 'บันทึกลูกค้า' }}</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Customer List Table Card -->
        <div class="table-card">
            <div class="table-card-header">
                <div>
                    <h3 class="card-title">รายชื่อลูกค้าทั้งหมด</h3>
                    <p class="card-subtitle">ค้นหาและจัดการฐานข้อมูลลูกค้าในระบบ</p>
                </div>

                <div class="filter-controls-row">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon-main"></i>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, เบอร์โทร..."
                            v-model="searchQuery"
                            class="filter-search-input"
                        />
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th width="70" class="text-center">#</th>
                            <th width="120">รหัสลูกค้า</th>
                            <th>ชื่อ-นามสกุล / ชื่อร้าน</th>
                            <th width="150">เบอร์โทร</th>
                            <th>ที่อยู่ / พื้นที่</th>
                            <th width="110" class="text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="customer in customers" :key="customer.id">
                            <td class="text-center text-muted tabular-nums">{{ customer.id }}</td>
                            <td>
                                <span class="customer-no-badge">{{ customer.customer_no || '-' }}</span>
                            </td>
                            <td>
                                <div class="font-bold text-main">{{ customer.name }}</div>
                                <small v-if="customer.email" class="text-muted">{{ customer.email }}</small>
                            </td>
                            <td class="tabular-nums">
                                <span v-if="customer.tel" class="tel-text">
                                    <i class="fas fa-phone-alt"></i> {{ customer.tel }}
                                </span>
                                <span v-else class="text-muted">-</span>
                            </td>
                            <td>
                                <div class="address-text">{{ customer.address || '-' }}</div>
                                <small v-if="customer.province" class="text-muted">{{ customer.district }} {{ customer.province }} {{ customer.post_code }}</small>
                            </td>
                            <td class="text-center">
                                <div class="action-btns-group">
                                    <button class="btn-icon edit-btn" @click="editCustomer(customer)" title="แก้ไขข้อมูล">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <button class="btn-icon delete-btn" @click="deleteCustomer(customer.id)" title="ลบลูกค้า">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="customers.length === 0">
                            <td colspan="6" class="text-center py-5 text-muted">
                                <div class="empty-state">
                                    <i class="fas fa-user-slash empty-icon"></i>
                                    <p class="empty-title">ไม่พบข้อมูลลูกค้า</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination-container" v-if="pagination.last_page > 1">
                <button
                    :disabled="!pagination.previous_page_url"
                    @click="fetchCustomers(pagination.current_page - 1, searchQuery)"
                    class="pagination-btn"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-indicator">หน้า {{ pagination.current_page }} / {{ pagination.last_page }}</span>
                <button
                    :disabled="!pagination.next_page_url"
                    @click="fetchCustomers(pagination.current_page + 1, searchQuery)"
                    class="pagination-btn"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '@/lib/axios';

const customers = ref([]);
const pagination = ref({
    current_page: 1,
    last_page: 1,
    previous_page_url: null,
    next_page_url: null,
});

const showForm = ref(false);
const isEditing = ref(false);
const form = ref({
    id: null,
    customerNo: '',
    name: '',
    email: '',
    tel: '',
    address: '',
    district: '',
    province: '',
    postCode: '',
    country: '',
});

const searchQuery = ref('');

// สร้างตัวแปรสำหรับ debounce timer
let debounceTimer = null;

// ฟังก์ชัน debounce แบบแมนนวล
const debounceSearch = (callback, delay) => {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

const debouncedFetchCustomers = debounceSearch((query) => {
    fetchCustomers(1, query);
}, 500);

// Watcher สำหรับตรวจจับการเปลี่ยนแปลงของ searchQuery
watch(searchQuery, (newQuery) => {
    debouncedFetchCustomers(newQuery);
});

async function fetchCustomers(page = 1, search = searchQuery.value) {
    try {
        const response = await axios.get('/customers', {
            params: {
                page: page,
                search: search,
            },
        });
        customers.value = response.data.data;
        pagination.value = response.data.meta;
    } catch (error) {
        console.error('Failed to fetch customers:', error);
    }
}

async function submitForm() {
    try {
        const payload = {
            customer_no: form.value.customerNo,
            name: form.value.name,
            email: form.value.email,
            tel: form.value.tel,
            address: form.value.address,
            district: form.value.district,
            province: form.value.province,
            post_code: form.value.postCode,
            country: form.value.country,
        };

        if (isEditing.value) {
            await axios.put(`/customers/${form.value.id}`, payload);
        } else {
            await axios.post('/customers', payload);
        }

        await fetchCustomers(pagination.value.current_page, searchQuery.value);
        resetForm();
        showForm.value = false;
        isEditing.value = false;
    } catch (error) {
        console.error('Failed to save customer:', error);
    }
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            await axios.delete(`/customers/${id}`);
            await fetchCustomers(pagination.value.current_page, searchQuery.value);
        } catch (error) {
            console.error('Failed to delete customer:', error);
        }
    }
}

function editCustomer(customer) {
    form.value = { ...customer };
    form.value.customerNo = customer.customer_no;
    form.value.postCode = customer.post_code;
    isEditing.value = true;
    showForm.value = true;
}

function toggleForm() {
    showForm.value = !showForm.value;
    if (!showForm.value) {
        resetForm();
        isEditing.value = false;
    }
}

function resetForm() {
    form.value = {
        id: null,
        customerNo: '',
        name: '',
        email: '',
        tel: '',
        address: '',
        district: '',
        province: '',
        postCode: '',
        country: '',
    };
}

onMounted(() => {
    fetchCustomers();
});
</script>

<style scoped>
.customer-view-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.customer-header {
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

/* Form Card */
.form-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-card-header {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
}

.form-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.form-card-title i {
    color: var(--primary-color);
    font-size: 1.2rem;
}

.form-card-title h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.form-grid-modern {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
}

.form-group.full-width {
    grid-column: 1 / -1;
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

.form-actions-bar {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

/* Table Card Header */
.table-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.25rem;
}

.filter-controls-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon-main {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    font-size: 0.875rem;
}

.filter-search-input {
    padding: 0.6rem 1rem 0.6rem 2.25rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-size: 0.875rem;
    color: var(--text-main);
    width: 240px;
    outline: none;
    transition: all 0.2s ease;
}

.filter-search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.customer-no-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #f1f5f9;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.85rem;
    color: #475569;
}

.tel-text {
    font-size: 0.875rem;
    color: var(--text-main);
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.tel-text i {
    color: var(--primary-color);
    font-size: 0.75rem;
}

.address-text {
    font-size: 0.875rem;
    color: var(--text-main);
}

.action-btns-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.15s ease;
}

.btn-icon:hover {
    transform: translateY(-1px);
}

.edit-btn {
    background: #fef3c7;
    color: #b45309;
}
.edit-btn:hover {
    background: #fde68a;
}

.delete-btn {
    background: #fef2f2;
    color: #dc2626;
}
.delete-btn:hover {
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

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
    animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>