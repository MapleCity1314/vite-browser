<script setup lang="ts">
import { useCartStore } from '../stores/cart'

const cart = useCartStore()

function addSampleItem() {
  cart.addItem({ id: Date.now(), name: 'New Item', price: 19.99 })
}
</script>

<template>
  <div>
    <h1>Home</h1>
    <p>Total items in cart: {{ cart.totalItems }}</p>
    <button @click="addSampleItem">Add Item</button>
  </div>
</template>
