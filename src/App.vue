<template>
  <div class="container" v-if="$route.name !== 'login'">
    <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
    <main class="main-content">
      <Header @toggleSidebar="isSidebarOpen = !isSidebarOpen" />
      <router-view></router-view>
    </main>
  </div>

  <router-view v-else></router-view>
</template>

<script setup>
import { ref, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isSidebarOpen = ref(false);

// Auto-close drawer on route change on mobile
watch(() => route.path, () => {
  isSidebarOpen.value = false;
});
</script>
