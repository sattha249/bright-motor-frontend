<template>
    <div class="manage-truck-tab">
        <div class="form-group">
            <label for="truckSelect">เลือกทะเบียนรถ *</label>
            <select id="truckSelect" v-model="selectedTruckId" required @change="onTruckChange">
                <option value="" disabled>-- เลือกทะเบียนรถ --</option>
                <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                    {{ truck.plate_number }}
                </option>
            </select>
        </div>

        <div v-if="selectedTruckId" class="manage-form">
            <div class="form-group">
                <label for="driverSelect">เลือกผู้ขับขี่ *</label>
                <select id="driverSelect" v-model="selectedDriverId" required>
                    <option value="" disabled>-- เลือกคนขับ --</option>
                    <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
                        {{ driver.fullname }} ({{ driver.username }})
                    </option>
                </select>
            </div>
            <div class="button-group">
                <button type="button" class="save-btn" @click="assignDriver" :disabled="loading">
                    <span v-if="loading">กำลังบันทึก...</span>
                    <span v-else>บันทึก</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

const trucks = ref([]);
const drivers = ref([]);
const selectedTruckId = ref('');
const selectedDriverId = ref('');
const loading = ref(false);

const fetchTrucks = async () => {
    try {
        const res = await axios.get('/trucks');
        trucks.value = res.data;
    } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลรถได้', err);
    }
};

const fetchDrivers = async () => {
    try {
        const res = await axios.get('/users?role=truck');
        drivers.value = res.data.data;
    } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลคนขับได้', err);
    }
};

const onTruckChange = () => {
    const selectedTruck = trucks.value.find(t => t.id === selectedTruckId.value);
    selectedDriverId.value = selectedTruck && selectedTruck.user_id ? selectedTruck.user_id : '';
};

const assignDriver = async () => {
    if (!selectedTruckId.value || !selectedDriverId.value) {
        Swal.fire('ผิดพลาด!', 'กรุณาเลือกรถและคนขับให้ครบถ้วน', 'error');
        return;
    }
    loading.value = true;
    try {
        await axios.put(`/trucks/${selectedTruckId.value}`, {
            user_id: selectedDriverId.value
        });
        Swal.fire('สำเร็จ!', 'มอบหมายคนขับรถเรียบร้อยแล้ว', 'success');
        fetchTrucks(); // Reload truck data to show the updated driver
    } catch (err) {
        let errorMessage = 'เกิดข้อผิดพลาดในการมอบหมายคนขับ';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        }
        Swal.fire('ผิดพลาด!', errorMessage, 'error');
        console.error('Assign driver error:', err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchTrucks();
    fetchDrivers();
});
</script>

<style scoped>
.manage-truck-tab {
    padding: 1rem;
}

.manage-form {
    margin-top: 1.5rem;
}

/* Form and button styles similar to AddTruck.vue */
.form-group {
    margin-bottom: 1.2rem;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color-secondary);
}

.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    background-color: var(--bg-color);
    color: var(--text-color-primary);
    transition: border-color 0.3s;
}

.form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.button-group {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.save-btn {
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    background-color: var(--primary-color);
    color: white;
}

.save-btn:hover:not(:disabled) {
    background-color: #2c7a7b;
}

.save-btn:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
}
</style>