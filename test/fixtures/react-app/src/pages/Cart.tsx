import { useCartStore } from "../store/cart";

export default function Cart() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clear = useCartStore((state) => state.clear);
  const totalPrice = useCartStore((state) => state.totalPrice());

  if (items.length === 0) {
    return (
      <div>
        <h1>Shopping Cart</h1>
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Shopping Cart</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {items.map((item) => (
          <div key={item.id} style={{ border: "1px solid #ccc", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3>{item.name}</h3>
              <p>${item.price} × {item.quantity}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>Total: ${totalPrice.toFixed(2)}</h2>
        <button onClick={clear}>Clear Cart</button>
      </div>
    </div>
  );
}
