import { useCartStore } from "../store/cart";

const products = [
  { id: "1", name: "Laptop", price: 999 },
  { id: "2", name: "Mouse", price: 29 },
  { id: "3", name: "Keyboard", price: 79 },
];

export default function Home() {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div>
      <h1>Products</h1>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {products.map((product) => (
          <div key={product.id} style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button onClick={() => addItem(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
