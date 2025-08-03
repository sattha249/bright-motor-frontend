import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Products from '../views/Products.vue';
import Settings from '../views/Settings.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/products', name: 'products', component: Products },
    { path: '/settings', name: 'settings', component: Settings },
    // เพิ่มเส้นทางสำหรับหน้าอื่นๆ ที่คุณต้องการ
  ],
});

export default router;