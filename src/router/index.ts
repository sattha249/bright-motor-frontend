import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Products from '../views/Products.vue';
import Settings from '../views/Settings.vue';
import AddProduct from '@/views/AddProduct.vue';
import Qrcode from '@/views/settings/Qrcode.vue';
import Login from '@/views/Login.vue';
import Warehouse from '@/views/Warehouse.vue';
import AddtoTruck from '@/views/AddtoTruck.vue';
import Customer from '@/views/Customer.vue';
import PurchaseOrders from '@/views/PurchaseOrders.vue';
import PurchaseOrderForm from '@/views/PurchaseOrderForm.vue';
import { isAuthenticated } from '@/services/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/products', name: 'products', component: Products, meta: { requiresAuth: true } },
    {
      path: '/purchase-orders',
      name: 'PurchaseOrders',
      component: PurchaseOrders,
      meta: { requiresAuth: true },
    },
    {
      path: '/purchase-orders/create',
      name: 'CreatePO',
      component: PurchaseOrderForm,
      meta: { requiresAuth: true },
    },
    {
      path: '/purchase-orders/edit/:id',
      name: 'EditPO',
      component: PurchaseOrderForm,
      meta: { requiresAuth: true },
    },
    { path: '/settings', name: 'settings', component: Settings, meta: { requiresAuth: true } },
    { path: '/products/add', name: 'add-product', component: AddProduct, meta: { requiresAuth: true } },
    { path: '/qrcode', name: 'qrcode', component: Qrcode, meta: { requiresAuth: true } },
    { path: '/warehouse', name: 'warehouse', component: Warehouse, meta: { requiresAuth: true } },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/add-to-truck',
      name: 'AddToTruck',
      component: AddtoTruck,
      meta: { requiresAuth: true }
    },
    {
      path: '/customer',
      name: 'Customer',
      component: Customer,
      meta: { requiresAuth: true }
    },
    {
      path: '/manage-users',
      name: 'ManageUsers',
      component: () => import('@/views/ManageUsers.vue'),
      meta: { requiresAdmin: true }
    },
    {
      path: '/sale',
      name: 'sale',
      component: () => import('../views/Sale.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/Report.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else if (to.name === 'login' && isAuthenticated()) {
    next('/');
  } else {
    next();
  }
});

export default router;