<script setup lang="ts">
import { useCartStore } from '../stores/cart'

const cart = useCartStore()
</script>

<template>
  <div class="cart-summary">
    <p>Total: ${{ cart.totalPrice.toFixed(2) }}</p>
    <p>Items: {{ cart.totalItems }}</p>
  </div>
</template>
