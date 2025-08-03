<template>
  <div class="container">
    <Sidebar />
    <main class="main-content">
      <Header />
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
</script>

<style>
/* คัดลอกโค้ด CSS ทั่วไปเช่น .container, .main-content จากไฟล์ style.css มาวางที่นี่ */
</style>