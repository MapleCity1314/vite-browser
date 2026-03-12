<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div id="vue-test-app">
    <NavBar />
    <main>
      <RouterView />
    </main>
  </div>
</template>
