<template>
    <div class="product-table-container">
        <h2>รายการสินค้าในรถ</h2>

        <div class="top-controls">
            <div class="truck-select-container">
                <label for="truck-select">เลือกทะเบียนรถ:</label>
                <select id="truck-select" v-model="selectedTruckId" @change="fetchTruckStocks">
                    <option value="" disabled>-- เลือกรถ --</option>
                    <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                        {{ truck.plate_number }} - {{ truck.user.fullname }}
                    </option>
                </select>
            </div>

            <button class="add-stock-btn" @click="openAddModal" :disabled="!selectedTruckId">
                <i class="fas fa-plus"></i> เพิ่มสินค้า
            </button>
        </div>

        <div v-if="loading">กำลังโหลดข้อมูล...</div>
        <div v-else-if="error" class="error-msg">{{ error }}</div>
        <div v-else>
            <table class="product-table" v-if="truckStocks.length > 0">
                <thead>
                    <tr>
                        <th>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th>หมวดหมู่</th>
                        <th>ยี่ห้อ</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th>ต้นทุน</th>
                        <th>ราคาขาย</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="stock in truckStocks" :key="stock.id">
                        <td>SKU-{{ stock.product_id }}</td>
                        <td>{{ stock.product.description }}</td>
                        <td>{{ stock.product.category }}</td>
                        <td>{{ stock.product.brand || '-' }}</td>
                        <td>{{ stock.quantity }}</td>
                        <td>{{ stock.product.unit || '-' }}</td>
                        <td>{{ parseFloat(stock.product.cost_price).toFixed(2) }} บาท</td>
                        <td>{{ parseFloat(stock.product.sell_price).toFixed(2) }} บาท</td>
                    </tr>
                </tbody>
            </table>
            <div v-else>
                <p>ไม่มีข้อมูลสินค้าในรถคันนี้</p>
            </div>
        </div>

        <!-- สรุปสินค้าที่เลือกเพิ่ม -->
        <div v-if="addedProducts.length > 0" class="added-summary">
            <h3>สินค้าที่จะย้ายเข้า รถ {{ selectedTruckPlate }}</h3>
            <table class="product-table">
                <thead>
                    <tr>
                        <th>รหัส</th>
                        <th>ชื่อสินค้า</th>
                        <th>จำนวน</th>
                        <th>หน่วย</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in addedProducts" :key="item.productId">
                        <td>SKU-{{ item.productId }}</td>
                        <td>{{ item.description }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.unit }}</td>
                        <td>
                            <button class="remove-btn" @click="removeProductFromList(item.productId)" title="ลบสินค้า">
                                &times;
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <button class="save-btn" @click="saveMoveToTruck" :disabled="saving">
                {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
        </div>

        <!-- Modal เพิ่มสินค้า -->
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
            <div class="modal large-modal">
                <h3>เลือกสินค้าในคลัง</h3>
                <div class="search-box">
                    <input type="text" placeholder="ค้นหาสินค้าในคลัง..." v-model="searchKeyword"
                        @input="debouncedFetchWarehouseStocks" />
                    <i class="fas fa-search"></i>
                </div>

                <table class="product-table">
                    <thead>
                        <tr>
                            <th>รหัส</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th>ยี่ห้อ</th>
                            <th>จำนวนในคลัง</th>
                            <th>หน่วย</th>
                            <th>เพิ่มจำนวน</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in warehouseStocks" :key="item.id">
                            <td>SKU-{{ item.product_id }}</td>
                            <td>{{ item.product.description }}</td>
                            <td>{{ item.product.category }}</td>
                            <td>{{ item.product.brand || '-' }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ item.product.unit || '-' }}</td>
                            <td class="quantity-control-cell">
                                <button class="qty-btn" @click="decrementQuantity(item.id)"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] <= 1">-</button>
                                <input type="number" min="1" :max="item.quantity"
                                    v-model.number="addQuantities[item.id]" style="width: 70px; text-align: center;" />
                                <button class="qty-btn" @click="incrementQuantity(item.id, item.quantity)"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] >= item.quantity">+</button>
                                <button class="add-btn"
                                    :disabled="!addQuantities[item.id] || addQuantities[item.id] < 1 || addQuantities[item.id] > item.quantity"
                                    @click="addProductToList(item)">
                                    Add
                                </button>
                            </td>
                        </tr>
                        <tr v-if="warehouseStocks.length === 0">
                            <td colspan="7" style="text-align:center;">ไม่พบสินค้าที่ค้นหา</td>
                        </tr>
                    </tbody>
                </table>

                <div class="pagination">
                    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
                    <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
                    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
                </div>

                <button class="close-btn" @click="closeAddModal">ปิด</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/lib/axios'

const trucks = ref([])
const selectedTruckId = ref('')
const truckStocks = ref([])
const loading = ref(false)
const error = ref(null)

const showAddModal = ref(false)
const warehouseStocks = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const addQuantities = ref({})

const addedProducts = ref([])
const saving = ref(false)

let debounceTimeout = null
function debounce(func, delay) {
    return (...args) => {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks')
        trucks.value = res.data
    } catch (err) {
        error.value = 'โหลดข้อมูลรถไม่สำเร็จ'
        console.error(err)
    }
}

const fetchTruckStocks = async () => {
    if (!selectedTruckId.value) {
        truckStocks.value = []
        return
    }
    loading.value = true
    error.value = null
    try {
        const res = await axios.get(`/trucks/${selectedTruckId.value}/stocks`)
        truckStocks.value = res.data.data
    } catch (err) {
        error.value = 'โหลดข้อมูลสินค้าในรถไม่สำเร็จ'
        console.error(err)
    } finally {
        loading.value = false
    }
}

const fetchWarehouseStocks = async () => {
    if (!selectedTruckId.value) return
    loading.value = true
    try {
        const res = await axios.get('/warehouse-stocks', {
            params: {
                page: currentPage.value,
                perPage: 10,
                search: searchKeyword.value,
            },
        })
        warehouseStocks.value = res.data.data
        warehouseStocks.value.forEach(item => {
            if (!addQuantities.value[item.id]) {
                addQuantities.value[item.id] = 1 // กำหนดค่าเริ่มต้นเป็น 1
            }
        })
        totalPages.value = res.data.meta.last_page
    } catch (err) {
        console.error('โหลดสินค้าในคลังไม่สำเร็จ', err)
    } finally {
        loading.value = false
    }
}

const debouncedFetchWarehouseStocks = debounce(fetchWarehouseStocks, 500)

const onSearchInput = () => {
    debouncedFetchWarehouseStocks()
}

const addProductToList = (item) => {
    const quantity = addQuantities.value[item.id]
    if (!quantity || quantity < 1 || quantity > item.quantity) return

    const existIndex = addedProducts.value.findIndex(p => p.productId === item.product_id)
    if (existIndex !== -1) {
        addedProducts.value[existIndex].quantity += quantity
    } else {
        addedProducts.value.push({
            productId: item.product_id,
            description: item.product.description,
            quantity: quantity,
            unit: item.product.unit || '-',
        })
    }
    addQuantities.value[item.id] = null
}

const openAddModal = () => {
    if (!selectedTruckId.value) {
        alert('กรุณาเลือกทะเบียนรถก่อน')
        return
    }
    currentPage.value = 1
    searchKeyword.value = ''
    addQuantities.value = {}
    fetchWarehouseStocks()
    showAddModal.value = true
}

const closeAddModal = () => {
    showAddModal.value = false
}

const changePage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    fetchWarehouseStocks()
}

const saveMoveToTruck = async () => {
    if (!selectedTruckId.value || addedProducts.value.length === 0) {
        alert('กรุณาเลือกสินค้าและรถให้ครบถ้วน')
        return
    }

    saving.value = true

    try {
        const payload = {
            truckId: selectedTruckId.value,
            products: addedProducts.value.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        }
        await axios.post('/warehouse-stocks/move-to-truck', payload)
        alert('ย้ายสินค้าเรียบร้อยแล้ว')
        addedProducts.value = []
        fetchTruckStocks()
        closeAddModal()
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการย้ายสินค้า')
        console.error(err)
    } finally {
        saving.value = false
    }
}

const removeProductFromList = (productId) => {
    addedProducts.value = addedProducts.value.filter(item => item.productId !== productId)
}

const decrementQuantity = (id) => {
    if (addQuantities.value[id] && addQuantities.value[id] > 1) {
        addQuantities.value[id]--
    }
}

const incrementQuantity = (id, max) => {
    if (addQuantities.value[id] < max) {
        addQuantities.value[id]++
    }
}

onMounted(() => {
    fetchTrucks()
})
</script>

<style scoped>
.product-table-container {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.product-table-container h2 {
    margin-bottom: 1rem;
    font-size: 24px;
}

.top-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 10px;
}

.truck-select-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.truck-select-container label {
    font-weight: 600;
    color: #555;
}

.truck-select-container select {
    padding: 10px 15px;
    font-size: 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    min-width: 250px;
    cursor: pointer;
    transition: border-color 0.3s;
}

.truck-select-container select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.add-stock-btn {
    background-color: #38a169;
    color: white;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.3s;
}

.add-stock-btn:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
}

.add-stock-btn:hover:not(:disabled) {
    background-color: #2f855a;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0;
}

.product-table thead tr {
    background-color: var(--secondary-color);
    text-align: left;
}

.product-table th,
.product-table td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
    font-size: 14px;
}

.product-table tbody tr:hover {
    background-color: #f9f9f9;
}

.error-msg {
    color: #e53e3e;
    font-weight: 600;
}

.added-summary {
    margin-top: 2rem;
}

.added-summary h3 {
    margin-bottom: 0.5rem;
}

.save-btn {
    margin-top: 10px;
    background-color: var(--primary-color);
    color: var(--white-color);
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.save-btn:hover {
    background-color: #2c7a7b;
}

.remove-btn {
    background: transparent;
    border: none;
    color: #e53e3e;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    padding: 0 8px;
    line-height: 1;
}

.remove-btn:hover {
    color: #a02828;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 50px;
    z-index: 999;
}

.modal {
    background: white;
    padding: 20px;
    width: 90%;
    max-width: 900px;
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.large-modal {
    max-height: 80vh;
    overflow-y: auto;
}

.modal h3 {
    margin-bottom: 1rem;
}

.close-btn {
    margin-top: 15px;
    background-color: #f44336;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    cursor: pointer;
}

.qty-btn {
    background-color: #4299e1;
    border: none;
    color: white;
    font-weight: 700;
    font-size: 20px;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    margin-right: 5px;
}

.qty-btn:disabled {
    background-color: #a0c4ff;
    cursor: not-allowed;
}

.quantity-control-cell {
    display: flex;
    align-items: center;
}

.add-btn {
    background-color: #38a169;
    border: none;
    padding: 5px 10px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    margin-left: 8px;
}

.add-btn:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
}
</style>
