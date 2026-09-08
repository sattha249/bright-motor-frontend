<template>
    <div class="preorder-container">
        <!-- Page Title & Tabs -->
        <div class="preorder-header-row no-print">
            <div class="header-title-box">
                <div class="header-icon-badge">
                    <i class="fas fa-truck-ramp-box"></i>
                </div>
                <div>
                    <h2 class="section-title">พรีออเดอร์ & โอนสินค้าขึ้นรถ</h2>
                    <p class="section-subtitle">สร้างใบส่งของล่วงหน้า โอนสินค้าจากคลังขึ้นรถ และติดตามสถานะบิล</p>
                </div>
            </div>

            <div class="tabs-nav">
                <button :class="['tab-pill', { active: currentTab === 'list' }]" @click="currentTab = 'list'">
                    <i class="fas fa-list-check"></i>
                    <span>รายการใบงาน</span>
                </button>
                <button :class="['tab-pill', { active: currentTab === 'form' }]" @click="currentTab = 'form'">
                    <i class="fas fa-file-circle-plus"></i>
                    <span>{{ isEditing ? 'แก้ไขใบงาน' : 'เปิดบิลส่งของขึ้นรถ' }}</span>
                </button>
            </div>
        </div>

        <!-- TAB 1: List View -->
        <div v-if="currentTab === 'list'" class="tab-content no-print">
            <div class="table-card">
                <div class="table-card-header">
                    <div>
                        <h3 class="card-title">สถานะการโอนของและบิลส่งของ</h3>
                        <p class="card-subtitle">ตรวจสอบสถานะใบงานที่รอดำเนินการ ปิดงาน หรือยกเลิก</p>
                    </div>

                    <div class="filter-controls-row">
                        <select v-model="filterTruckId" @change="fetchPreOrders(1)" class="filter-select">
                            <option value="">รถขนส่งทั้งหมด</option>
                            <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                                {{ truck.plate_number }} - {{ truck?.user?.fullname || 'ไม่ระบุคนขับ' }}
                            </option>
                        </select>

                        <div class="search-wrapper">
                            <i class="fas fa-search search-icon-main"></i>
                            <input
                                type="text"
                                v-model="preOrderSearchTerm"
                                @input="debouncedFetchPreOrders"
                                placeholder="ค้นหาเลขบิล / ลูกค้า..."
                                class="main-search-input"
                            />
                        </div>

                        <select v-model="filterStatus" @change="fetchPreOrders(1)" class="filter-select">
                            <option value="">สถานะทั้งหมด</option>
                            <option value="Pending">Pending (รอรถ)</option>
                            <option value="Completed">Completed (ปิดงาน)</option>
                            <option value="Cancelled">Cancelled (ยกเลิก)</option>
                        </select>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>เลขที่บิล</th>
                                <th>รถขนส่ง</th>
                                <th>ลูกค้าปลายทาง</th>
                                <th class="text-right">ยอดรวมสุทธิ</th>
                                <th class="text-center">สถานะ</th>
                                <th class="text-center" style="width: 140px;">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="po in preOrders" :key="po.id">
                                <td>
                                    <span class="bill-chip">{{ po.bill_no }}</span>
                                </td>
                                <td>
                                    <span class="truck-pill">
                                        <i class="fas fa-truck"></i>
                                        {{ po.truck?.plate_number || 'ไม่ระบุ' }}
                                    </span>
                                </td>
                                <td class="font-medium">{{ po.customer?.name || 'ไม่ระบุ' }}</td>
                                <td class="text-right tabular-nums font-bold text-success">
                                    ฿{{ Number(po.total_sold_price).toLocaleString() }}
                                </td>
                                <td class="text-center">
                                    <span :class="['stock-pill', po.status.toLowerCase() === 'pending' ? 'pill-low' : po.status.toLowerCase() === 'completed' ? 'pill-high' : 'pill-empty']">
                                        {{ po.status }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <div class="row-actions">
                                        <button class="action-btn view-btn" @click="viewDetail(po)" title="ดูรายละเอียด">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button v-if="po.status === 'Pending'" class="action-btn edit-btn" @click="editPreOrder(po)" title="แก้ไขใบงาน">
                                            <i class="fas fa-pen"></i>
                                        </button>
                                        <button v-if="po.status === 'Pending'" class="action-btn delete-btn" @click="cancelPreOrder(po)" title="ยกเลิกและคืนของ">
                                            <i class="fas fa-undo"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="preOrders.length === 0">
                                <td colspan="6" class="empty-state">
                                    <i class="fas fa-clipboard-list"></i>
                                    <p>ไม่พบรายการใบงานตามเงื่อนไขที่เลือก</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="preOrdersTotalPages > 1">
                    <button @click="changePreOrderPage(preOrderCurrentPage - 1)" :disabled="preOrderCurrentPage === 1" class="page-btn">
                        <i class="fas fa-chevron-left"></i>
                        <span>ก่อนหน้า</span>
                    </button>
                    <span>หน้า {{ preOrderCurrentPage }} / {{ preOrdersTotalPages }}</span>
                    <button @click="changePreOrderPage(preOrderCurrentPage + 1)" :disabled="preOrderCurrentPage === preOrdersTotalPages" class="page-btn">
                        <span>ถัดไป</span>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- TAB 2: Form View -->
        <div v-if="currentTab === 'form'" class="tab-content no-print">
            <div class="form-grid">
                <!-- Left: Info Card -->
                <div class="card info-card">
                    <div class="card-title-group">
                        <i class="fas fa-truck-front"></i>
                        <h3 class="card-title">{{ isEditing ? 'แก้ไขข้อมูลใบงาน' : 'ข้อมูลรถและลูกค้า' }}</h3>
                    </div>

                    <div class="form-group">
                        <label>เลือกรถขนส่ง <span class="required">*</span></label>
                        <select v-model="truckId" class="form-control" :disabled="isEditing">
                            <option :value="null">-- เลือกรถที่จะนำของขึ้น --</option>
                            <option v-for="truck in trucks" :key="truck.id" :value="truck.id">
                                {{ truck.plate_number }} ({{ truck?.user?.fullname || 'ไม่มีชื่อคนขับ' }})
                            </option>
                        </select>
                    </div>

                    <div class="form-group customer-search-group">
                        <label>ลูกค้าปลายทาง <span class="required">*</span></label>
                        <div class="search-wrapper" style="width: 100%;">
                            <i class="fas fa-search search-icon-main"></i>
                            <input
                                :disabled="isEditing"
                                type="text"
                                v-model="customerSearchTerm"
                                placeholder="ค้นหาชื่อ หรือรหัสลูกค้า..."
                                @input="debouncedSearchCustomers"
                                @focus="showCustomerDropdown = true"
                                @blur="hideCustomerDropdown"
                                class="main-search-input"
                            />
                        </div>
                        <div class="dropdown-list" v-if="showCustomerDropdown">
                            <div
                                v-for="c in filteredCustomers"
                                :key="c.id"
                                class="dropdown-item"
                                @mousedown.prevent="selectCustomer(c)"
                            >
                                <div class="item-main">{{ c.name }}</div>
                                <div class="item-sub">รหัสลูกค้า: {{ c.customer_no }}</div>
                            </div>
                            <div v-if="filteredCustomers.length === 0" class="dropdown-item disabled">
                                ไม่พบข้อมูลลูกค้า
                            </div>
                        </div>
                    </div>

                    <div class="credit-toggle-box">
                        <label class="toggle-checkbox-label">
                            <input type="checkbox" id="preIsCredit" v-model="isCredit" />
                            <span>ตั้งยอดเครดิต (ค้างชำระ)</span>
                        </label>
                    </div>

                    <div v-if="isCredit" class="credit-type-selector">
                        <label class="radio-label">
                            <input type="radio" v-model="creditType" value="week" />
                            <span>รายสัปดาห์</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" v-model="creditType" value="month" />
                            <span>รายเดือน</span>
                        </label>
                    </div>
                </div>

                <!-- Right: Items Card -->
                <div class="card items-card">
                    <div class="card-header-actions">
                        <div class="card-title-group">
                            <i class="fas fa-boxes-stacked"></i>
                            <h3 class="card-title">รายการสินค้าที่จะโอนจากโกดัง</h3>
                        </div>
                        <button class="btn btn-primary btn-sm" @click="openStockModal" :disabled="!truckId">
                            <i class="fas fa-plus"></i>
                            <span>เลือกสินค้าจากคลัง</span>
                        </button>
                    </div>

                    <div class="table-responsive">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th>ชื่อสินค้า</th>
                                    <th width="120" class="text-center">จำนวน</th>
                                    <th class="text-right">ราคา/หน่วย</th>
                                    <th width="140" class="text-right">ส่วนลด/หน่วย</th>
                                    <th class="text-right">ราคารวม</th>
                                    <th class="text-center" style="width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in items" :key="item.productId">
                                    <td class="font-medium">{{ item.description }}</td>
                                    <td class="text-center">
                                        <input
                                            type="number"
                                            v-model.number="item.quantity"
                                            min="1"
                                            :max="item.maxAllowed"
                                            @change="validateItemQuantity(item)"
                                            class="form-control text-center tabular-nums"
                                            style="width: 75px; display: inline-block; padding: 6px;"
                                        />
                                        <div v-if="item.maxAllowed !== undefined" class="max-limit-text">
                                            สูงสุด: {{ item.maxAllowed }}
                                        </div>
                                    </td>
                                    <td class="text-right tabular-nums">฿{{ item.price.toLocaleString() }}</td>
                                    <td class="text-right">
                                        <input
                                            type="number"
                                            v-model.number="item.discount"
                                            min="0"
                                            :max="item.price"
                                            class="form-control text-right tabular-nums text-danger"
                                            style="width: 85px; display: inline-block; padding: 6px;"
                                            @input="validateItemDiscount(item)"
                                        />
                                    </td>
                                    <td class="text-right tabular-nums font-bold text-success">
                                        ฿{{ (item.quantity * item.price - (item.discount || 0) * item.quantity).toLocaleString() }}
                                    </td>
                                    <td class="text-center">
                                        <button class="btn-icon-del" @click="removeItem(index)" title="ลบรายการ">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="items.length === 0">
                                    <td colspan="6" class="empty-state">
                                        <i class="fas fa-cart-arrow-down"></i>
                                        <p>ยังไม่มีรายการสินค้า กรุณากดปุ่ม <strong>เลือกสินค้าจากคลัง</strong></p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Discount Controls & Summary -->
                    <div class="discount-summary-wrapper" v-if="items.length > 0">
                        <div class="discount-controls-box">
                            <label class="discount-label">ส่วนลดรวมทั้งบิล:</label>
                            <div class="discount-pct-group">
                                <button
                                    v-for="pct in [5, 10, 15]"
                                    :key="pct"
                                    type="button"
                                    @click="applyDiscountPercentage(pct)"
                                    class="pct-btn"
                                    :class="{ active: selectedDiscount === pct }"
                                >
                                    {{ pct }}%
                                </button>
                            </div>
                            <div class="manual-discount-row">
                                <input
                                    type="number"
                                    v-model.number="manualDiscountAmount"
                                    placeholder="ระบุจำนวนเงิน (บาท)"
                                    class="form-control tabular-nums text-right"
                                    style="width: 160px;"
                                />
                                <button type="button" @click="applyManualDiscount" class="btn btn-secondary btn-sm">
                                    เฉลี่ยลด
                                </button>
                            </div>
                        </div>

                        <div class="sale-summary-card">
                            <div class="summary-line">
                                <span>ราคาก่อนลด:</span>
                                <span class="tabular-nums">฿{{ totalOriginalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                            </div>
                            <div class="summary-line text-danger">
                                <span>ส่วนลดรวม:</span>
                                <span class="tabular-nums">-฿{{ totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                            </div>
                            <div class="summary-line grand-total-line">
                                <span>ยอดสุทธิทั้งสิ้น:</span>
                                <span class="grand-total-price tabular-nums">฿{{ totalSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                            </div>

                            <div class="summary-action-btns">
                                <button v-if="isEditing" type="button" class="btn btn-secondary" @click="cancelEditMode">
                                    ยกเลิกการแก้ไข
                                </button>
                                <button type="button" class="btn btn-primary submit-preorder-btn" @click="submitPreOrder" :disabled="loading">
                                    <i class="fas fa-check"></i>
                                    <span>{{ loading ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันเปิดบิลส่งของ' }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail Modal -->
        <div v-if="showDetailModal" class="modal-overlay no-print" @click.self="showDetailModal = false">
            <div class="modal modal-lg">
                <div class="modal-header no-print">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div>
                            <h3>รายละเอียดใบงาน {{ selectedPreOrder?.bill_no }}</h3>
                            <span class="modal-subtitle">บันทึกเมื่อ {{ new Date(selectedPreOrder?.created_at).toLocaleDateString('th-TH') }}</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-secondary btn-sm" @click="printDetail">
                            <i class="fas fa-print"></i>
                            <span>พิมพ์ใบเสร็จ</span>
                        </button>
                        <button class="modal-close-x" @click="showDetailModal = false">&times;</button>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="info-grid-detail">
                        <div class="info-box">
                            <label>วันที่:</label>
                            <span>{{ new Date(selectedPreOrder?.created_at).toLocaleDateString('th-TH') }}</span>
                        </div>
                        <div class="info-box">
                            <label>รถขนส่ง:</label>
                            <span>{{ selectedPreOrder?.truck?.plate_number || '-' }}</span>
                        </div>
                        <div class="info-box">
                            <label>ลูกค้า:</label>
                            <span>{{ selectedPreOrder?.customer?.name || '-' }}</span>
                        </div>
                        <div class="info-box">
                            <label>สถานะ:</label>
                            <span :class="['stock-pill', selectedPreOrder?.status.toLowerCase() === 'pending' ? 'pill-low' : selectedPreOrder?.status.toLowerCase() === 'completed' ? 'pill-high' : 'pill-empty']">
                                {{ selectedPreOrder?.status }}
                            </span>
                        </div>
                        <div class="info-box">
                            <label>เงื่อนไขการชำระ:</label>
                            <span>{{ selectedPreOrder?.is_credit ? 'เครดิต (' + selectedPreOrder?.is_credit + ')' : 'เงินสด' }}</span>
                        </div>
                    </div>

                    <div class="modal-table-wrap" style="margin-top: 20px;">
                        <table class="product-table modal-inner-table">
                            <thead>
                                <tr>
                                    <th>ชื่อสินค้า</th>
                                    <th class="text-right">จำนวน</th>
                                    <th class="text-right">ราคา/หน่วย</th>
                                    <th class="text-right">ส่วนลด</th>
                                    <th class="text-right">รวมสุทธิ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedPreOrder?.items" :key="item.id">
                                    <td class="font-medium">{{ item.product?.description }}</td>
                                    <td class="text-right tabular-nums font-bold">{{ item.quantity }}</td>
                                    <td class="text-right tabular-nums">฿{{ Number(item.price).toLocaleString() }}</td>
                                    <td class="text-right tabular-nums text-danger">
                                        {{ Number(item.discount) > 0 ? '-฿' + Number(item.discount).toLocaleString() : '฿0' }}
                                    </td>
                                    <td class="text-right tabular-nums font-bold text-success">
                                        ฿{{ (item.quantity * item.price - item.discount * item.quantity).toLocaleString() }}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" class="text-right font-bold">รวมยอดสุทธิทั้งสิ้น:</td>
                                    <td class="text-right tabular-nums font-bold text-success" style="font-size: 1.15rem;">
                                        ฿{{ Number(selectedPreOrder?.total_sold_price).toLocaleString() }}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div class="modal-footer no-print">
                    <button class="btn btn-secondary" @click="showDetailModal = false">ปิดหน้าต่าง</button>
                </div>
            </div>
        </div>

        <!-- Printable receipt at root level (Teleported to body to eliminate blank pages 2-3) -->
        <Teleport to="body">
            <div v-if="showDetailModal && selectedPreOrder" class="printable-area print-only receipt-layout">
                <div class="receipt-header">
                    <h2>BRIGHT MOTOR STORE</h2>
                    <p>ใบส่งของ / ใบแจ้งหนี้</p>
                    <div class="dashed-line"></div>
                    <div class="receipt-info-row">
                        <span>Date: {{ new Date(selectedPreOrder?.created_at).toLocaleDateString('th-TH') }}</span>
                        <span>Time: {{ new Date(selectedPreOrder?.created_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit', minute: '2-digit'
                        }) }}</span>
                    </div>
                    <div class="receipt-info-row">
                        <span>No: {{ selectedPreOrder?.bill_no }}</span>
                    </div>
                    <div class="receipt-info-row">
                        <span>Customer: {{ selectedPreOrder?.customer?.name }}</span>
                    </div>
                    <div class="receipt-info-row" v-if="selectedPreOrder?.truck">
                        <span>Truck: {{ selectedPreOrder?.truck?.plate_number }}</span>
                    </div>
                    <div class="dashed-line"></div>
                </div>

                <div class="receipt-items">
                    <div v-for="item in selectedPreOrder?.items" :key="item.id" class="receipt-item-group">
                        <div class="receipt-item-row">
                            <div class="item-name">{{ item.product?.description }}</div>
                        </div>

                        <div class="receipt-item-row">
                            <div class="item-calc"
                                style="padding-left: 10px; width: 100%; display: flex; justify-content: space-between;">
                                <span>{{ item.quantity }} x {{ Number(item.price).toLocaleString() }}</span>
                                <span>{{ (item.quantity * item.price).toLocaleString() }}</span>
                            </div>
                        </div>

                        <div class="receipt-item-row" v-if="Number(item.discount) > 0">
                            <div class="item-calc"
                                style="padding-left: 10px; width: 100%; display: flex; justify-content: space-between; font-style: italic; font-size: 12px;">
                                <span>(ส่วนลด{{ item.quantity > 1 ? ` @${Number(item.discount).toLocaleString()}` : '' }})</span>
                                <span>-{{ (Number(item.discount) * item.quantity).toLocaleString() }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashed-line"></div>

                <div class="receipt-footer">
                    <div class="receipt-total-row" v-if="Number(selectedPreOrder?.total_discount) > 0"
                        style="font-size: 14px; font-weight: normal; margin-bottom: 4px;">
                        <span>รวมเป็นเงิน:</span>
                        <span>{{ Number(selectedPreOrder?.total_price).toLocaleString() }}</span>
                    </div>

                    <div class="receipt-total-row" v-if="Number(selectedPreOrder?.total_discount) > 0"
                        style="font-size: 14px; font-weight: normal; margin-bottom: 4px;">
                        <span>หักส่วนลด:</span>
                        <span>-{{ Number(selectedPreOrder?.total_discount).toLocaleString() }}</span>
                    </div>

                    <div class="receipt-total-row"
                        style="margin-top: 5px; border-top: 1px solid #000; padding-top: 5px;">
                        <span style="font-weight: bold; font-size: 18px;">ยอดสุทธิ:</span>
                        <span class="grand-total" style="font-weight: bold; font-size: 18px;">{{
                            Number(selectedPreOrder?.total_sold_price).toLocaleString() }}</span>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Warehouse Stock Selection Modal -->
        <div v-if="showModal" class="modal-overlay no-print" @click.self="closeStockModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-title-box">
                        <div class="modal-icon-badge">
                            <i class="fas fa-boxes"></i>
                        </div>
                        <div>
                            <h3>เลือกสินค้าจากโกดังหลัก</h3>
                            <span class="modal-subtitle">เลือกสินค้าและระบุจำนวนเพื่อเพิ่มลงในใบงาน</span>
                        </div>
                    </div>
                    <button class="modal-close-x" @click="closeStockModal">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="modal-search-box" style="margin-bottom: 16px;">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon-inside"></i>
                            <input
                                type="text"
                                v-model="searchKeyword"
                                @input="debouncedSearch"
                                placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
                                class="form-control"
                            />
                        </div>
                    </div>

                    <div class="modal-table-wrap">
                        <table class="product-table modal-inner-table">
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th class="text-right">คงเหลือ</th>
                                    <th class="text-right">ราคาขาย</th>
                                    <th class="text-center" width="160">จำนวนที่จะโอน</th>
                                    <th class="text-center" width="100">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody v-if="!loading">
                                <tr v-for="stock in warehouseStocks" :key="stock.id">
                                    <td class="font-medium">{{ stock.product.description }}</td>
                                    <td class="text-right tabular-nums">
                                        <span class="stock-pill pill-medium">{{ stock.quantity }} {{ stock.product.unit || 'ชิ้น' }}</span>
                                    </td>
                                    <td class="text-right tabular-nums font-bold">฿{{ Number(stock.product.sell_price).toLocaleString() }}</td>
                                    <td class="text-center">
                                        <div class="table-qty-control" style="justify-content: center;">
                                            <input
                                                type="number"
                                                v-model.number="addQuantities[stock.id]"
                                                min="1"
                                                :max="stock.quantity"
                                                class="form-control table-qty-input tabular-nums"
                                                style="width: 80px; text-align: center;"
                                            />
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <button
                                            class="btn btn-primary btn-sm"
                                            @click="addItem(stock)"
                                            :disabled="
                                                !addQuantities[stock.id] ||
                                                addQuantities[stock.id] > stock.quantity ||
                                                addQuantities[stock.id] < 1
                                            "
                                        >
                                            <i class="fas fa-plus"></i> เพิ่ม
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="warehouseStocks.length === 0">
                                    <td colspan="5" class="text-center py-4 text-muted">ไม่พบสินค้าในคลัง</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="pagination-container" v-if="totalPages > 1" style="margin-top: 16px;">
                        <button class="pagination-btn" @click="changeModalPage(currentPage - 1)" :disabled="currentPage === 1">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="page-indicator">หน้า {{ currentPage }} / {{ totalPages }}</span>
                        <button class="pagination-btn" @click="changeModalPage(currentPage + 1)" :disabled="currentPage === totalPages">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeStockModal">เสร็จสิ้น / ปิด</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/lib/axios'
import Swal from 'sweetalert2'

// --- State Management ---
const currentTab = ref('list')
const loading = ref(false)
const preOrders = ref([])
const trucks = ref([])
const allCustomers = ref([])
const warehouseStocks = ref([])
const filterStatus = ref('')

const selectedDiscount = ref(0)
const manualDiscountAmount = ref(0)

// State สำหรับ Pagination หน้า PreOrder
const preOrderCurrentPage = ref(1)
const preOrdersTotalPages = ref(1)

// [เพิ่ม] State สำหรับ Search PreOrder
const preOrderSearchTerm = ref('')
const filterTruckId = ref('')

// Form State
const truckId = ref(null)
const customerId = ref(null)
const customerSearchTerm = ref('')
const showCustomerDropdown = ref(false)
const isCredit = ref(false)
const creditType = ref('week')
const items = ref([])

// Edit Mode State
const isEditing = ref(false)
const editingId = ref(null)

// Modal & Pagination State
const showModal = ref(false)
const showDetailModal = ref(false)
const selectedPreOrder = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const addQuantities = ref({})

// --- Utility ---
let searchTimeout = null
const debounce = (func, delay) => {
    let timeout = null
    return (...args) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), delay)
    }
}

// --- Computed ---
const filteredCustomers = computed(() => {
    if (!customerSearchTerm.value) return allCustomers.value.slice(0, 10)
    const query = customerSearchTerm.value.toLowerCase()
    return allCustomers.value
        .filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.customer_no && String(c.customer_no).includes(query)),
        )
        .slice(0, 10)
})

const totalOriginalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + (item.quantity * item.price), 0)
)

const totalDiscountAmount = computed(() =>
    items.value.reduce((sum, item) => sum + (item.quantity * (item.discount || 0)), 0)
)

const totalSalePrice = computed(() => {
    const total = totalOriginalPrice.value - totalDiscountAmount.value
    return total > 0 ? total : 0
})

const totalSoldPrice = computed(() => items.value.reduce((sum, i) => sum + i.quantity * i.price, 0))

// --- Functions ---

const validateItemDiscount = (item) => {
    if (item.discount === '' || item.discount === null || isNaN(item.discount)) {
        item.discount = 0
        return
    }
    if (item.discount < 0) {
        item.discount = 0
    }
    if (item.discount > item.price) {
        item.discount = item.price
    }
    item.discount = Math.round(item.discount * 100) / 100
    selectedDiscount.value = 0 // ล้างไฮไลท์ปุ่มส่วนลดรวม
}

// [เพิ่ม] ฟังก์ชันคำนวณส่วนลดเป็น %
const applyDiscountPercentage = (percent) => {
    selectedDiscount.value = percent
    const discountFactor = percent / 100

    // คำนวณส่วนลดต่อหน่วย = ราคาขาย * % (ปัดเศษ 2 ตำแหน่ง)
    items.value.forEach(item => {
        item.discount = Math.round((item.price * discountFactor) * 100) / 100
    })

    // Reset ช่องกรอกมือ
    manualDiscountAmount.value = 0
}

const distributeDiscount = (itemsList, discountTotal) => {
    if (itemsList.length === 0) return
    const totalOriginal = itemsList.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    if (totalOriginal === 0) return

    let allocatedTotal = 0
    const itemsWithAllocation = itemsList.map(item => {
        const itemLineTotal = item.quantity * item.price
        const ratio = itemLineTotal / totalOriginal
        const itemTotalDiscount = discountTotal * ratio
        const rawUnitDiscount = itemTotalDiscount / item.quantity
        const roundedUnitDiscount = Math.round(rawUnitDiscount * 100) / 100
        const finalUnitDiscount = Math.min(item.price, Math.max(0, roundedUnitDiscount))
        allocatedTotal += finalUnitDiscount * item.quantity
        return {
            item,
            unitDiscount: finalUnitDiscount,
            quantity: item.quantity,
            price: item.price
        }
    })

    let diff = discountTotal - allocatedTotal
    const sortedAllocations = [...itemsWithAllocation].sort((a, b) => a.quantity - b.quantity)
    diff = Math.round(diff * 100) / 100

    if (diff > 0) {
        for (const alloc of sortedAllocations) {
            while (diff >= (alloc.quantity * 0.01) && alloc.unitDiscount + 0.01 <= alloc.price) {
                alloc.unitDiscount = Math.round((alloc.unitDiscount + 0.01) * 100) / 100
                diff = Math.round((diff - (alloc.quantity * 0.01)) * 100) / 100
            }
        }
        if (diff > 0) {
            for (const alloc of sortedAllocations) {
                const step = alloc.quantity * 0.01
                if (Math.abs(diff - step) < Math.abs(diff) && alloc.unitDiscount + 0.01 <= alloc.price) {
                    alloc.unitDiscount = Math.round((alloc.unitDiscount + 0.01) * 100) / 100
                    diff = Math.round((diff - step) * 100) / 100
                    break
                }
            }
        }
    } else if (diff < 0) {
        for (const alloc of sortedAllocations) {
            while (diff <= -(alloc.quantity * 0.01) && alloc.unitDiscount - 0.01 >= 0) {
                alloc.unitDiscount = Math.round((alloc.unitDiscount - 0.01) * 100) / 100
                diff = Math.round((diff + (alloc.quantity * 0.01)) * 100) / 100
            }
        }
        if (diff < 0) {
            for (const alloc of sortedAllocations) {
                const step = alloc.quantity * 0.01
                if (Math.abs(diff + step) < Math.abs(diff) && alloc.unitDiscount - 0.01 >= 0) {
                    alloc.unitDiscount = Math.round((alloc.unitDiscount - 0.01) * 100) / 100
                    diff = Math.round((diff + step) * 100) / 100
                    break
                }
            }
        }
    }

    itemsWithAllocation.forEach(alloc => {
        alloc.item.discount = alloc.unitDiscount
    })
}

// [เพิ่ม] ฟังก์ชันเฉลี่ยส่วนลดตามจำนวนเงิน (Manual Amount)
const applyManualDiscount = () => {
    selectedDiscount.value = 0
    const discountTotal = parseFloat(manualDiscountAmount.value)

    if (discountTotal < 0 || discountTotal > totalOriginalPrice.value) {
        return Swal.fire('แจ้งเตือน', 'ส่วนลดต้องไม่เกินราคารวมทั้งหมด', 'warning')
    }

    if (items.value.length === 0) return

    distributeDiscount(items.value, discountTotal)
    manualDiscountAmount.value = parseFloat(totalDiscountAmount.value.toFixed(2))
}

// [แก้ไข] รองรับ Pagination และ Search
const fetchPreOrders = async (page = 1) => {
    try {
        preOrderCurrentPage.value = page

        const res = await axios.get('/pre-orders', {
            params: {
                status: filterStatus.value,
                page: page,
                limit: 10,
                search: preOrderSearchTerm.value,
                truckId: filterTruckId.value, // [เพิ่ม] ส่ง truck_id ไปที่ API
            },
        })

        preOrders.value = res.data.data
        preOrdersTotalPages.value = res.data.meta?.last_page || 1
    } catch (e) {
        console.error('Fetch PreOrders Error:', e)
    }
}

// [เพิ่ม] Debounce สำหรับ search pre-orders เพื่อไม่ให้ยิง API รัวๆ
const debouncedFetchPreOrders = debounce(() => {
    fetchPreOrders(1) // ค้นหาใหม่ ให้กลับไปหน้า 1
}, 500)

const changePreOrderPage = (page) => {
    if (page >= 1 && page <= preOrdersTotalPages.value) {
        fetchPreOrders(page)
    }
}

const fetchInitialData = async () => {
    try {
        const [tRes, cRes] = await Promise.all([axios.get('/trucks', { params: { perPage: 100 } }), axios.get('/customers')])
        trucks.value = tRes.data.data
        allCustomers.value = cRes.data.data
    } catch (e) {
        console.error('Initial Load Error:', e)
    }
}

const searchCustomers = async () => {
    try {
        const res = await axios.get('/customers', {
            params: {
                search: customerSearchTerm.value,
                per_page: 20,
            },
        })
        allCustomers.value = res.data.data
    } catch (error) {
        console.error('Search error', error)
    }
}
const debouncedSearchCustomers = debounce(searchCustomers, 300)

const fetchWarehouseStocks = async () => {
    if (!truckId.value) return
    loading.value = true
    try {
        const res = await axios.get('/warehouse-stocks', {
            params: {
                page: currentPage.value,
                search: searchKeyword.value,
                limit: 1000,
            },
        })
        warehouseStocks.value = res.data.data
        warehouseStocks.value.forEach((item) => {
            if (!addQuantities.value[item.id]) {
                addQuantities.value[item.id] = 1
            }
        })
        totalPages.value = res.data.meta.last_page
    } catch (err) {
        console.error('โหลดสินค้าในคลังไม่สำเร็จ', err)
    } finally {
        loading.value = false
    }
}

const debouncedSearch = debounce(() => {
    currentPage.value = 1
    fetchWarehouseStocks()
}, 500)

const changeModalPage = (page) => {
    currentPage.value = page
    fetchWarehouseStocks()
}

const openStockModal = () => {
    if (!truckId.value) {
        return Swal.fire('แจ้งเตือน', 'กรุณาเลือกรถที่จะรับของก่อน', 'warning')
    }
    searchKeyword.value = ''
    currentPage.value = 1
    fetchWarehouseStocks()
    showModal.value = true
}

const closeStockModal = () => {
    showModal.value = false
}

const selectCustomer = (c) => {
    customerId.value = c.id
    customerSearchTerm.value = `${c.name} (${c.customer_no})`
    showCustomerDropdown.value = false
}

const hideCustomerDropdown = () => {
    setTimeout(() => {
        showCustomerDropdown.value = false
        if (customerId.value === null) {
            if (!customerSearchTerm.value) customerSearchTerm.value = ''
        }
    }, 150)
}

const addItem = (stock) => {
    const qty = addQuantities.value[stock.id]
    const existing = items.value.find((i) => i.productId === stock.product_id)

    if (existing) {
        const totalRequested = existing.quantity + qty
        if (existing.maxAllowed !== undefined && totalRequested > existing.maxAllowed) {
            Swal.fire('แจ้งเตือน', `สินค้าในโกดังมีไม่พอ (เพิ่มได้สูงสุด ${existing.maxAllowed} ชิ้น)`, 'warning')
            return
        }
        existing.quantity += qty
    } else {
        items.value.push({
            productId: stock.product_id,
            category: stock.product.category,
            description: stock.product.description,
            quantity: qty,
            originalQuantity: 0,
            maxAllowed: stock.quantity,
            price: parseFloat(stock.product.sell_price),
            discount: 0,
            soldPrice: parseFloat(stock.product.sell_price),
            isPaid: true,
        })
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `เพิ่ม ${stock.product.description} แล้ว`,
        showConfirmButton: false,
        timer: 1000,
    })
}

const validateItemQuantity = (item) => {
    // ป้องกันการใส่ค่าว่างหรือติดลบ
    if (item.quantity < 1 || !item.quantity) {
        item.quantity = 1
    }

    // ป้องกันใส่เกินสต็อก
    if (item.maxAllowed !== undefined && item.quantity > item.maxAllowed) {
        Swal.fire('แจ้งเตือน', `มีสินค้าในโกดังไม่พอ (สามารถระบุได้สูงสุด ${item.maxAllowed} ชิ้น)`, 'warning')
        item.quantity = item.maxAllowed
    }

    // รีเซ็ตส่วนลดท้ายบิลเมื่อมีการเปลี่ยนจำนวน เพื่อให้ผู้ใช้คำนวณใหม่
    manualDiscountAmount.value = 0
    selectedDiscount.value = 0
}

const removeItem = (index) => {
    items.value.splice(index, 1)
    manualDiscountAmount.value = 0 // Reset manual discount เพื่อให้กรอกใหม่
}

const editPreOrder = async (po) => {
    try {
        loading.value = true
        const res = await axios.get(`/pre-orders/${po.id}`)
        const data = res.data

        truckId.value = data.truck_id
        customerId.value = data.customer_id

        let customer = allCustomers.value.find((c) => c.id === data.customer_id)
        if (!customer && data.customer) {
            customer = data.customer
        }

        if (customer) {
            customerSearchTerm.value = `${customer.name} (${customer.customer_no})`
        } else if (data.customer) {
            customerSearchTerm.value = `${data.customer.name} (${data.customer.customer_no})`
        }

        isCredit.value = !!data.is_credit
        if (data.is_credit) creditType.value = data.is_credit

        items.value = data.items.map((i) => ({
            productId: i.product_id,
            description: i.product?.description || 'สินค้า',
            quantity: i.quantity,
            originalQuantity: i.quantity,
            maxAllowed: i.quantity,
            price: Number(i.price),
            soldPrice: Number(i.sold_price),
            discount: Number(i.discount || 0),
            is_paid: true,
        }))
        for (let item of items.value) {
            try {
                const stockRes = await axios.get(`/warehouse-stocks/${item.productId}`)
                const stockData = stockRes.data.find(s => s.product_id === item.productId)
                const currentStock = stockData ? stockData.quantity : 0
                item.maxAllowed = item.originalQuantity + currentStock
            } catch (error) {
                console.log(error)
                console.error('ไม่สามารถดึงสต็อกโกดังสำหรับ:', item.description)
            }
        }
        const currentTotalDiscount = items.value.reduce((sum, i) => sum + (i.quantity * i.discount), 0)
        manualDiscountAmount.value = parseFloat(currentTotalDiscount.toFixed(2))

        isEditing.value = true
        editingId.value = po.id
        currentTab.value = 'form'
    } catch (e) {
        console.error(e)
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลเพื่อแก้ไขได้', 'error')
    } finally {
        loading.value = false
    }
}

const cancelEditMode = () => {
    isEditing.value = false
    editingId.value = null
    items.value = []
    truckId.value = null
    customerId.value = null
    customerSearchTerm.value = ''
    currentTab.value = 'list'
    manualDiscountAmount.value = 0
    selectedDiscount.value = 0
}

const submitPreOrder = async () => {
    if (!truckId.value || !customerId.value || items.value.length === 0) {
        return Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning')
    }

    loading.value = true

    const payload = {
        truckId: truckId.value,
        customerId: customerId.value,
        isCredit: isCredit.value ? creditType.value : null,
        totalPrice: totalOriginalPrice.value, // ราคาก่อนลด
        totalDiscount: totalDiscountAmount.value, // ส่วนลดรวม
        totalSoldPrice: totalSalePrice.value, // ยอดสุทธิ
        items: items.value.map((i) => {
            // คำนวณราคาขายจริง (Net Price) = ราคา - ส่วนลด
            const netPrice = i.price - (i.discount || 0);

            return {
                productId: i.productId,
                quantity: i.quantity,
                price: i.price,
                soldPrice: netPrice > 0 ? netPrice : 0,
                discount: i.discount || 0,
            }
        }),
    }

    try {
        if (isEditing.value) {
            await axios.put(`/pre-orders/${editingId.value}`, payload)
            Swal.fire('สำเร็จ', 'แก้ไขข้อมูลเรียบร้อยแล้ว', 'success')
        } else {
            await axios.post('/pre-orders', payload)
            Swal.fire('สำเร็จ', 'เปิดบิลและโอนสินค้าขึ้นรถแล้ว', 'success')
        }

        cancelEditMode()
        fetchPreOrders()
    } catch (e) {
        Swal.fire('ผิดพลาด', e.response?.data?.message || 'บันทึกไม่สำเร็จ', 'error')
    } finally {
        loading.value = false
    }
}

const cancelPreOrder = (po) => {
    Swal.fire({
        title: 'ดึงของกลับโกดัง?',
        text: `ยกเลิกบิล ${po.bill_no} และดึงสินค้าจากรถกลับเข้าโกดังหลัก`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        confirmButtonText: 'ยืนยันยกเลิกและคืนของ',
    }).then(async (res) => {
        if (res.isConfirmed) {
            try {
                await axios.post(`/pre-orders/${po.id}/cancel`)
                Swal.fire('เรียบร้อย', 'คืนของเข้าโกดังแล้ว', 'success')
                fetchPreOrders()
            } catch (e) {
                Swal.fire('Error', 'ไม่สามารถยกเลิกได้', 'error')
            }
        }
    })
}

const viewDetail = async (po) => {
    try {
        const res = await axios.get(`/pre-orders/${po.id}`)
        selectedPreOrder.value = res.data
        showDetailModal.value = true
    } catch (e) {
        Swal.fire('Error', 'ไม่สามารถดึงข้อมูลรายละเอียดได้', 'error')
    }
}

const printDetail = () => {
    window.print()
}

onMounted(() => {
    fetchPreOrders()
    fetchInitialData()
})
</script>

<style scoped>
.preorder-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.preorder-header-row {
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

/* Tabs */
.tabs-nav {
    display: flex;
    background: #e2e8f0;
    padding: 4px;
    border-radius: 12px;
    gap: 4px;
}

.tab-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-pill:hover {
    color: var(--text-main);
}

.tab-pill.active {
    background: #ffffff;
    color: var(--primary-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Filter controls */
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
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-size: 0.875rem;
    color: var(--text-main);
    outline: none;
    transition: all 0.2s ease;
}

.filter-select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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

/* Action buttons in table */
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

.view-btn {
    background: #eff6ff;
    color: #2563eb;
}
.view-btn:hover {
    background: #dbeafe;
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

/* Form View */
.form-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 1.5rem;
    align-items: start;
}

.card-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.25rem;
    color: var(--text-main);
    font-size: 1.15rem;
}

.card-title-group i {
    color: var(--primary-color);
}

.form-group {
    margin-bottom: 1.1rem;
    position: relative;
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

.dropdown-menu-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 40;
    max-height: 220px;
    overflow-y: auto;
    margin-top: 4px;
}

.dropdown-item-option {
    padding: 10px 14px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-main);
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s ease;
}

.dropdown-item-option:hover {
    background: #f8fafc;
    color: var(--primary-color);
}

/* Payment toggle */
.payment-toggle-group {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
}

.payment-pill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--border-color);
    background: #ffffff;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    transition: all 0.2s ease;
}

.payment-pill.active {
    border-color: var(--primary-color);
    background: #eff6ff;
    color: var(--primary-color);
}

.credit-terms-box {
    background: #f8fafc;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
}

.credit-terms-box label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 8px;
    display: block;
}

.credit-radio-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 14px;
    font-size: 0.85rem;
    cursor: pointer;
    color: var(--text-main);
}

/* Items Card & Table */
.card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.selected-items-table {
    margin-top: 0.5rem;
}

.table-qty-control,
.table-discount-control {
    display: inline-flex;
    align-items: center;
}

.table-qty-input,
.table-discount-input {
    padding: 6px 10px;
    font-size: 0.875rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.btn-icon-danger {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #fef2f2;
    color: #dc2626;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
}

.btn-icon-danger:hover {
    background: #fee2e2;
}

/* Bottom summary pane */
.bottom-summary-pane {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    align-items: start;
}

.discount-control-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.discount-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
}

.discount-pct-group {
    display: flex;
    gap: 8px;
}

.pct-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--text-main);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pct-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.pct-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #ffffff;
}

.manual-discount-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.sale-summary-card {
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-muted);
}

.grand-total-line {
    border-top: 1px dashed var(--border-color);
    padding-top: 10px;
    margin-top: 4px;
    font-weight: 700;
    color: var(--text-main);
    font-size: 1rem;
}

.grand-total-price {
    font-size: 1.5rem;
    color: var(--primary-color);
    font-weight: 800;
}

.summary-action-btns {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.submit-preorder-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
}

/* Modal details */
.info-grid-detail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.info-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-box label {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
}

.info-box span {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
}

@media (max-width: 1024px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    .bottom-summary-pane {
        grid-template-columns: 1fr;
    }
}
</style>
