# CLI 参考

## Browser

```bash
vite-browser open <url> [--cookies-json <file>]
vite-browser close
vite-browser goto <url>
vite-browser back
vite-browser reload
```

## Framework

```bash
vite-browser detect
vite-browser vue tree [id]
vite-browser vue pinia [store]
vite-browser vue router
vite-browser react tree [id]
vite-browser svelte tree [id]
```

## Vite Runtime

```bash
vite-browser vite restart
vite-browser vite runtime
vite-browser vite hmr
vite-browser vite hmr trace [--limit <n>]
vite-browser vite hmr clear
vite-browser vite module-graph [--filter <txt>] [--limit <n>]
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>]
vite-browser vite module-graph clear
vite-browser errors
vite-browser errors --mapped
vite-browser errors --mapped --inline-source
vite-browser correlate errors [--window <ms>]
vite-browser correlate renders [--window <ms>]
vite-browser diagnose hmr [--window <ms>] [--limit <n>]
vite-browser diagnose propagation [--window <ms>]
```

## Utilities

```bash
vite-browser logs
vite-browser network [idx]
vite-browser screenshot
vite-browser eval <script>
```

## 常见命令组合

### 快速运行时排查

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### 传播路径排查

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### 网络或状态排查

```bash
vite-browser logs
vite-browser network
vite-browser eval '<state probe>'
```

## 输出理解

- `errors --mapped --inline-source` 适合先拿到源码位置和上下文
- `correlate errors` 用来比较当前错误和最近更新时间窗是否匹配
- `diagnose propagation` 会刻意保持保守，只有证据足够强时才输出更完整的 `store -> render -> error` 线索
