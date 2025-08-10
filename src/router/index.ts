import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Products from '../views/Products.vue';
import Settings from '../views/Settings.vue';
import AddProduct from '@/views/AddProduct.vue';
import Qrcode from '@/views/settings/Qrcode.vue';
import Login from '@/views/Login.vue';
import Warehouse from '@/views/Warehouse.vue';
import AddtoTruck from '@/views/AddtoTruck.vue';
import { isAuthenticated } from '@/services/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/products', name: 'products', component: Products, meta: { requiresAuth: true } },
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
    }
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