# Vue DevTools Integration Test

## 测试步骤

### 1. 创建测试 Vue 应用

```bash
# 创建 Vue 3 应用
pnpm create vite test-vue-app --template vue
cd test-vue-app
pnpm install

# 添加 Pinia 和 Vue Router（可选）
pnpm add pinia vue-router

# 启动开发服务器
pnpm dev
```

### 2. 修改测试应用以包含 Pinia

编辑 `test-vue-app/src/main.js`:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')

// 暴露 Pinia 到 window 以便 DevTools 访问
window.__PINIA__ = pinia
```

创建 `test-vue-app/src/stores/counter.js`:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

### 3. 测试 vite-browser

```bash
cd ../vite-browser

# 打开浏览器
node dist/cli.js open http://localhost:5173

# 检测框架
node dist/cli.js detect
# 应该输出: vue@3.x.x

# 查看组件树
node dist/cli.js vue tree
# 应该显示 Vue 组件层级结构

# 查看特定组件详情（使用组件 UID）
node dist/cli.js vue tree 1

# 查看 Pinia stores
node dist/cli.js vue pinia
# 应该列出所有 stores

# 查看特定 store
node dist/cli.js vue pinia counter
# 应该显示 counter store 的 state 和 getters

# 查看 Vue Router（如果安装了）
node dist/cli.js vue router

# 关闭浏览器
node dist/cli.js close
```

## 预期输出示例

### vue tree
```
# Vue Component Tree
# 1 app(s) detected

## App: App
  [0] App
    [1] HelloWorld
```

### vue tree 1
```
# Component: HelloWorld
# UID: 1

## Props
  msg: "Hello Vue 3"

## Setup State
  count: 0
  increment: [Function]

## Source
  /src/components/HelloWorld.vue
```

### vue pinia
```
# Pinia Stores

- counter

Use 'vite-browser vue pinia <store-name>' to inspect a specific store
```

### vue pinia counter
```
# Pinia Store: counter

## State
  count: 0

## Getters
  doubleCount: 0
```

## 故障排除

### 问题：Vue DevTools not found
**原因**：Vue 应用没有正确初始化 DevTools hook
**解决**：确保使用开发模式运行 Vite（`pnpm dev`）

### 问题：Pinia not found
**原因**：Pinia 没有暴露到 window
**解决**：在 main.js 中添加 `window.__PINIA__ = pinia`

### 问题：Component not found
**原因**：组件 UID 不正确
**解决**：先运行 `vue tree` 查看所有组件的 UID

## 下一步

- [ ] 测试 Vue 2 应用
- [ ] 测试 Vue Router 集成
- [ ] 添加 source map 支持
- [ ] 优化输出格式
- [ ] 添加颜色高亮
