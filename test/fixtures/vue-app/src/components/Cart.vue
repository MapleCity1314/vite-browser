<script setup lang="ts">
import { useCartStore } from '../stores/cart'
import CartSummary from './CartSummary.vue'

const cart = useCartStore()
</script>

<template>
  <div>
    <h1>Shopping Cart</h1>
    <ul>
      <li v-for="item in cart.items" :key="item.id">
        {{ item.name }} × {{ item.quantity }} — ${{ (item.price * item.quantity).toFixed(2) }}
        <button @click="cart.removeItem(item.id)">Remove</button>
      </li>
    </ul>
    <CartSummary />
    <button @click="cart.clear()">Clear Cart</button>
  </div>
</template>
