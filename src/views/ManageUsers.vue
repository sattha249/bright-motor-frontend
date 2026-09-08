<template>
    <div class="page-container manage-users-page">
        <!-- Page Header -->
        <div class="page-header-card">
            <div class="header-content-wrap">
                <div class="header-left-group">
                    <div class="page-icon-badge">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <div>
                        <h1 class="page-title">จัดการข้อมูลผู้ใช้งานและรถ</h1>
                        <p class="page-subtitle">จัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง และข้อมูลรถขนส่งสินค้า</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Card with Segmented Tabs -->
        <div class="card tabs-card">
            <div class="tabs-nav-bar">
                <button
                    :class="['tab-nav-btn', { active: activeTab === 'add' }]"
                    @click="activeTab = 'add'"
                >
                    <i class="fas fa-user-plus"></i>
                    <span>เพิ่มผู้ใช้งาน</span>
                </button>
                <button
                    :class="['tab-nav-btn', { active: activeTab === 'manage' }]"
                    @click="activeTab = 'manage'"
                >
                    <i class="fas fa-user-shield"></i>
                    <span>รายชื่อผู้ใช้งาน</span>
                </button>
                <button
                    :class="['tab-nav-btn', { active: activeTab === 'addTruck' }]"
                    @click="activeTab = 'addTruck'"
                >
                    <i class="fas fa-truck-moving"></i>
                    <span>เพิ่มรถขนส่ง</span>
                </button>
                <button
                    :class="['tab-nav-btn', { active: activeTab === 'manageTruck' }]"
                    @click="activeTab = 'manageTruck'"
                >
                    <i class="fas fa-truck-ramp-box"></i>
                    <span>จัดการข้อมูลรถ</span>
                </button>
            </div>

            <div class="tab-pane-content">
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
.manage-users-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
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
    flex-wrap: wrap;
    gap: 1rem;
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

.tabs-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.tabs-nav-bar {
    display: flex;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 4px;
    gap: 6px;
    overflow-x: auto;
    margin-bottom: 1.5rem;
}

.tab-nav-btn {
    flex: 1;
    min-width: 140px;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.tab-nav-btn.active {
    background: var(--surface);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.tab-nav-btn:hover:not(.active) {
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.03);
}

.tab-pane-content {
    min-height: 400px;
}

@media (max-width: 640px) {
    .tabs-nav-bar {
        flex-direction: column;
    }
    
    .tab-nav-btn {
        width: 100%;
        justify-content: flex-start;
        padding: 0.75rem 1rem;
    }
}
</style>