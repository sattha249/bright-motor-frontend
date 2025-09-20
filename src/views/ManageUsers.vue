<template>
    <div class="manage-users-container">
        <h2><i class="fas fa-users-cog"></i> จัดการข้อมูลผู้ใช้งานและรถ</h2>

        <div class="tabs-container">
            <div class="tab-header">
                <button :class="['tab-btn', { 'active': activeTab === 'add' }]" @click="activeTab = 'add'">
                    <i class="fas fa-user-plus"></i> เพิ่มผู้ใช้งาน
                </button>
                <button :class="['tab-btn', { 'active': activeTab === 'manage' }]" @click="activeTab = 'manage'">
                    <i class="fas fa-edit"></i> จัดการผู้ใช้งาน
                </button>
                <button :class="['tab-btn', { 'active': activeTab === 'addTruck' }]" @click="activeTab = 'addTruck'">
                    <i class="fas fa-truck-moving"></i> เพิ่มรถ
                </button>
                <button :class="['tab-btn', { 'active': activeTab === 'manageTruck' }]"
                    @click="activeTab = 'manageTruck'">
                    <i class="fas fa-truck-ramp-box"></i> จัดการรถ
                </button>
            </div>

            <div class="tab-content">
                <div v-if="activeTab === 'add'">
                    <AddUser />
                </div>

                <div v-if="activeTab === 'manage'">
                    <ManageUser />
                </div>

                <div v-if="activeTab === 'addTruck'">
                    <AddTruck />
                </div>

                <div v-if="activeTab === 'manageTruck'">
                    <ManageTruck />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import AddUser from '@/components/manage-users/AddUser.vue';
import ManageUser from '@/components/manage-users/ManageUser.vue';
import AddTruck from '@/components/manage-users/AddTruck.vue';
import ManageTruck from '@/components/manage-users/ManageTruck.vue';

const activeTab = ref('add');
</script>


<style scoped>
.manage-users-container {
    max-width: 900px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--shadow);
}

h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--text-color-primary);
}

.tabs-container {
    background-color: var(--bg-color);
    border-radius: 10px;
    padding: 1rem;
}

.tab-header {
    display: flex;
    justify-content: space-around;
    gap: 10px;
    margin-bottom: 1.5rem;
}

.tab-btn {
    flex: 1;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    background-color: #e2e8f0;
    color: #4a5568;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.tab-btn.active {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover:not(.active) {
    background-color: #cbd5e0;
}

.tab-content {
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    min-height: 400px;
    /* เพิ่มความสูงขั้นต่ำเพื่อป้องกันหน้าจอกระโดด */
}

/* Modal styles (shared) */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
}

.modal h3 {
    margin-bottom: 1rem;
    color: #333;
}

.modal p {
    margin-bottom: 1.5rem;
    color: #555;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.modal-confirm-btn,
.modal-cancel-btn {
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background-color 0.3s;
}

.modal-confirm-btn {
    background-color: #48bb78;
    color: white;
}

.modal-confirm-btn:hover {
    background-color: #38a169;
}

.modal-cancel-btn {
    background-color: #e53e3e;
    color: white;
}

.modal-cancel-btn:hover {
    background-color: #c53030;
}
</style>