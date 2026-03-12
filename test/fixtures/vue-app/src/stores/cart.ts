import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([
    { id: 1, name: 'Widget', price: 29.99, quantity: 2 },
    { id: 2, name: 'Gadget', price: 49.99, quantity: 1 },
  ])

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  function addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...item, quantity: 1 })
    }
  }

  function removeItem(id: number) {
    const index = items.value.findIndex((i) => i.id === id)
    if (index >= 0) items.value.splice(index, 1)
  }

  function clear() {
    items.value = []
  }

  return { items, totalItems, totalPrice, addItem, removeItem, clear }
})
