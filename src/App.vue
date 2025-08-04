<template>
  <div class="container" v-if="$route.name !== 'login'">
    <Sidebar />
    <main class="main-content">
      <Header />
      <router-view></router-view>
    </main>
  </div>

  <router-view v-else></router-view>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import { useRoute } from 'vue-router';
const route = useRoute();
</script>
