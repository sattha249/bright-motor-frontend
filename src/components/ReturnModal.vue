<template>
    <div v-if="show" class="rm-overlay" @click.self="close">
        <div class="rm-card">

            <div class="rm-header">
                <div class="rm-header-title">
                    <div class="rm-icon-box">
                        <i class="fas fa-undo"></i>
                    </div>
                    <h3>รับคืนสินค้า / คืนเงิน</h3>
                </div>
                <button class="rm-close-btn" @click="close">&times;</button>
            </div>

            <div class="rm-body">
                <div class="rm-alert">
                    <div class="rm-alert-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="rm-alert-content">
                        <h4>คำเตือน</h4>
                        <p>ระบบจะดึงสินค้ากลับเข้าสต็อกรถทันที และบันทึกยอดคืนเงิน</p>
                    </div>
                </div>

                <div class="rm-form-group">
                    <label>เหตุผลการรับคืน <span class="text-red">*</span></label>
                    <div class="rm-input-wrapper">
                        <input type="text" v-model="returnReason" class="rm-input"
                            placeholder="ระบุเหตุผล (เช่น สินค้าชำรุด, ลูกค้าเปลี่ยนใจ)" />
                    </div>
                </div>

                <div class="rm-table-wrapper">
                    <table class="rm-table">
                        <thead>
                            <tr>
                                <th width="35%">สินค้า</th>
                                <th class="text-center">ซื้อไป</th>
                                <th class="text-center">คืนแล้ว</th>
                                <th class="text-right">ราคาขาย</th>
                                <th class="text-center" width="90">คืนครั้งนี้</th>
                                <th class="text-right">ยอดคืน</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in itemsToReturn" :key="item.id"
                                :class="{ 'row-active': item.returning_qty > 0 }">
                                <td>
                                    <div class="p-name">{{ item.product?.description }}</div>
                                </td>
                                <td class="text-center">{{ item.quantity }}</td>
                                <td class="text-center text-gray">{{ item.returned_quantity || 0 }}</td>
                                <td class="text-right">฿{{ Number(item.sold_price).toLocaleString() }}</td>
                                <td class="text-center">
                                    <input type="number" v-model.number="item.returning_qty" min="0"
                                        :max="item.quantity - (item.returned_quantity || 0)" class="rm-qty-input" />
                                </td>
                                <td class="text-right text-red font-bold">
                                    ฿{{ (item.returning_qty * item.sold_price).toLocaleString() }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="text-right font-bold">รวมยอดคืนเงินสุทธิ:</td>
                                <td class="text-right font-bold text-red" style="font-size: 1.1rem;">
                                    ฿{{ totalRefundAmount.toLocaleString() }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div class="rm-footer">
                <button class="rm-btn rm-btn-secondary" @click="close">
                    ยกเลิก
                </button>
                <button class="rm-btn rm-btn-primary" @click="confirmReturn"
                    :disabled="totalRefundAmount <= 0 || loading || !returnReason">
                    {{ loading ? 'กำลังบันทึก...' : 'ยืนยันการคืนของ' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from '@/lib/axios'
import Swal from 'sweetalert2'

const props = defineProps({
    show: Boolean,
    sellLog: Object
})

const emit = defineEmits(['close', 'refresh'])

const loading = ref(false)
const returnReason = ref('')
const itemsToReturn = ref([])

const initData = () => {
    if (!props.sellLog) return
    itemsToReturn.value = props.sellLog.items.map(item => ({
        ...item,
        returning_qty: 0,
        returned_quantity: item.returned_quantity || 0
    }))
}

watch(() => props.show, (newVal) => {
    if (newVal) {
        initData()
        returnReason.value = ''
    }
})

const totalRefundAmount = computed(() => {
    return itemsToReturn.value.reduce((sum, item) => {
        return sum + (item.returning_qty * item.sold_price)
    }, 0)
})

const close = () => {
    emit('close')
}

const confirmReturn = async () => {
    if (!returnReason.value) {
        return Swal.fire('แจ้งเตือน', 'กรุณาระบุเหตุผลการคืน', 'warning')
    }

    const payload = {
        reason: returnReason.value,
        items: itemsToReturn.value
            .filter(i => i.returning_qty > 0)
            .map(i => ({
                sell_log_item_id: i.id,
                product_id: i.product_id,
                quantity: i.returning_qty,
                refund_price: i.sold_price
            }))
    }

    try {
        loading.value = true
        await axios.post(`/sell-logs/${props.sellLog.id}/return`, payload)

        Swal.fire({
            icon: 'success',
            title: 'ดำเนินการสำเร็จ',
            text: 'บันทึกการรับคืนและปรับสต็อกเรียบร้อยแล้ว',
            confirmButtonColor: '#e53e3e'
        })
        emit('refresh')
        close()
    } catch (e) {
        Swal.fire('Error', e.response?.data?.message || 'เกิดข้อผิดพลาดในการคืนสินค้า', 'error')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* --- 1. Overlay & Card Layout --- */
.rm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    /* พื้นหลังดำโปร่งแสง */
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
    /* อยู่บนสุดเสมอ */
}

.rm-card {
    width: 95%;
    max-width: 800px;
    background-color: #ffffff !important;
    /* บังคับสีขาว */
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
    /* ตัดขอบให้มน */
    position: relative;
}

/* --- 2. Header --- */
.rm-header {
    padding: 15px 20px;
    background-color: #ffffff;
    border-bottom: 1px solid #eeeeee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.rm-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.rm-icon-box {
    width: 32px;
    height: 32px;
    background: #fff5f5;
    color: #e53e3e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.rm-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #e53e3e;
    font-weight: 700;
}

.rm-close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
}

/* --- 3. Body --- */
.rm-body {
    padding: 20px;
    overflow-y: auto;
    background-color: #ffffff;
    /* บังคับขาวอีกที */
    flex: 1;
    /* ยืดเต็มพื้นที่ */
}

/* Alert */
.rm-alert {
    background-color: #2d3748;
    /* สีเข้มเพื่อให้ตัวหนังสือขาวเด่น */
    color: white;
    padding: 12px 15px;
    border-radius: 6px;
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
}

.rm-alert-icon {
    font-size: 1.2rem;
    color: #fc8181;
}

.rm-alert-content h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: bold;
}

.rm-alert-content p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.9;
}

/* Form */
.rm-form-group {
    margin-bottom: 20px;
}

.rm-form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
}

.rm-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    background: #fff;
    color: #333;
}

.rm-input:focus {
    border-color: #e53e3e;
    outline: none;
}

/* Table */
.rm-table-wrapper {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
}

.rm-table {
    width: 100%;
    border-collapse: collapse;
}

.rm-table th {
    background: #f7fafc;
    padding: 10px;
    font-size: 0.9rem;
    color: #555;
    border-bottom: 1px solid #eee;
}

.rm-table td {
    padding: 10px;
    border-bottom: 1px solid #f7fafc;
    vertical-align: middle;
    color: #333;
}

.row-active {
    background-color: #fff5f5;
}

/* Inputs in table */
.rm-qty-input {
    width: 60px;
    text-align: center;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-weight: bold;
}

.rm-qty-input:focus {
    border-color: #e53e3e;
    outline: none;
}

/* --- 4. Footer --- */
.rm-footer {
    padding: 15px 20px;
    background-color: #f9f9f9;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.rm-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.rm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.rm-btn-secondary {
    background: #e2e8f0;
    color: #333;
}

.rm-btn-primary {
    background: #e53e3e;
    color: white;
}

.rm-btn-primary:hover:not(:disabled) {
    background: #c53030;
}

/* Utilities */
.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.text-red {
    color: #e53e3e;
}

.text-gray {
    color: #aaa;
}

.font-bold {
    font-weight: bold;
}

.p-name {
    font-weight: 600;
    font-size: 0.95rem;
}
</style>