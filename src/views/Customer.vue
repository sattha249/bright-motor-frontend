<template>
    <div class="main-content-container">
        <h2 class="section-title">Customers</h2>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Customer List</h3>
                <div class="search-box">
                    <input type="text" placeholder="Search customers..." v-model="searchQuery" />
                    <i class="fas fa-search"></i>
                </div>
                <button class="primary-btn" @click="toggleForm">
                    {{ showForm ? 'Cancel' : 'Add New Customer' }}
                </button>
            </div>

            <div v-if="showForm" class="form-container">
                <h4 class="form-title">{{ isEditing ? 'Edit Customer' : 'Add Customer' }}</h4>
                <form @submit.prevent="submitForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="name">Name</label>
                            <input type="text" id="name" v-model="form.name" required>
                        </div>
                        <div class="form-group">
                            <label for="customerNo">Customer No</label>
                            <input type="text" id="customerNo" v-model="form.customerNo">
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" v-model="form.email">
                        </div>
                        <div class="form-group">
                            <label for="tel">Tel</label>
                            <input type="text" id="tel" v-model="form.tel">
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <textarea id="address" v-model="form.address"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="district">District</label>
                            <input type="text" id="district" v-model="form.district">
                        </div>
                        <div class="form-group">
                            <label for="province">Province</label>
                            <input type="text" id="province" v-model="form.province">
                        </div>
                        <div class="form-group">
                            <label for="postCode">Post Code</label>
                            <input type="text" id="postCode" v-model="form.postCode">
                        </div>
                        <div class="form-group">
                            <label for="country">Country</label>
                            <input type="text" id="country" v-model="form.country">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Save</button>
                    </div>
                </form>
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Tel</th>
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="customer in customers" :key="customer.id">
                            <td>{{ customer.id }}</td>
                            <td>{{ customer.name }}</td>
                            <td>{{ customer.tel }}</td>
                            <td>{{ customer.address }}</td>
                            <td class="action-buttons">
                                <button class="edit-btn" @click="editCustomer(customer)">Edit</button>
                                <button class="delete-btn" @click="deleteCustomer(customer.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination-controls">
                <button :disabled="!pagination.previous_page_url" @click="fetchCustomers(pagination.current_page - 1)"
                    class="pagination-btn">
                    Previous
                </button>
                <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
                <button :disabled="!pagination.next_page_url" @click="fetchCustomers(pagination.current_page + 1)"
                    class="pagination-btn">
                    Next
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

async function fetchCustomers(page = 1, search = '') {
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
/* โค้ด CSS เดิม */
.main-content-container {
    padding: 2rem;
}

.section-title {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--text-color-primary);
}

.card {
    background-color: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.card-title {
    font-size: 1.4rem;
    font-weight: 600;
}

.search-box {
    position: relative;
    flex-grow: 1;
    max-width: 300px;
}

.search-box input {
    width: 100%;
    padding: 10px 15px;
    padding-left: 40px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 14px;
}

.search-box i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.primary-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.primary-btn:hover {
    background-color: #43a047;
}

.form-container {
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 2rem;
}

.form-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--white-color);
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
}

.secondary-btn {
    background-color: transparent;
    color: var(--text-color-primary);
    border: 1px solid var(--border-color);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.secondary-btn:hover {
    background-color: #f0f0f0;
}

.table-responsive {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.edit-btn,
.delete-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
}

.edit-btn {
    background-color: #ffc107;
    color: var(--white-color);
}

.delete-btn {
    background-color: #dc3545;
    color: var(--white-color);
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
    gap: 1rem;
}

.pagination-btn {
    background-color: var(--primary-color);
    color: var(--white-color);
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.pagination-btn:hover:enabled {
    background-color: #43a047;
}

.pagination-btn:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
    color: var(--text-color-secondary);
}
</style>