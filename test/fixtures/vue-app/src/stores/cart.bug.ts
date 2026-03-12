/**
 * Buggy variant of the cart store for testing error correlation.
 * Setting `items` to `undefined` triggers a downstream render error
 * in CartSummary.vue when it calls `items.reduce(...)`.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // BUG: items is undefined, causing downstream errors
  const items = ref<CartItem[] | undefined>(undefined)

  const totalItems = computed(() =>
    // This will throw: Cannot read properties of undefined (reading 'reduce')
    items.value!.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
  )

  const totalPrice = computed(() =>
    items.value!.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0,
    ),
  )

  function addItem(_item: Omit<CartItem, 'quantity'>) {
    // no-op in buggy variant
  }

  function removeItem(_id: number) {
    // no-op in buggy variant
  }

  function clear() {
    // no-op in buggy variant
  }

  return { items, totalItems, totalPrice, addItem, removeItem, clear }
})
