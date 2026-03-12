<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cart'

const cart = useCartStore()
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/cart">Cart ({{ cart.totalItems }})</RouterLink>
  </nav>
</template>
