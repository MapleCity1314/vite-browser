# vite-browser 开发路线图：v0.3.4 - v0.3.5+

## v0.3.4：跨平台性能提升

**目标**：提升 Windows 和 Linux 平台的稳定性和性能，确保与 macOS 平台一致的用户体验。

### 核心改进

#### 1. 平台特定路径处理优化
**当前问题**：
- `src/paths.ts` 已有基础 Windows 命名管道支持，但缺少完整的跨平台测试覆盖
- Socket 目录创建和清理逻辑可能在不同平台表现不一致

**改进方案**：
- 增强 `socketDir` 创建逻辑，处理 Windows 权限和路径长度限制
- 添加平台特定的临时目录回退机制（Windows `%TEMP%`，Linux `/tmp`）
- 改进 PID 文件锁定机制，避免跨平台竞态条件
- 添加 Windows 命名管道连接超时和重试逻辑

**文件涉及**：
- `src/paths.ts` - 路径解析和平台检测
- `src/daemon.ts` - Socket 服务器创建和清理
- `src/client.ts` - 客户端连接逻辑

#### 2. Playwright 浏览器启动优化
**当前问题**：
- `browser-session.ts` 中的 Chromium 启动参数主要针对 macOS 优化
- Windows/Linux 下可能遇到沙箱、GPU 加速相关问题
- React DevTools 扩展路径硬编码为相对路径，跨平台兼容性差

**改进方案**：
- 添加平台特定的 Chromium 启动参数：
  - Windows: `--no-sandbox`, `--disable-gpu` (可选)
  - Linux: `--disable-dev-shm-usage`, `--no-sandbox` (Docker 环境)
- 改进 React DevTools 扩展路径解析：
  - 支持 `REACT_DEVTOOLS_EXTENSION` 环境变量的绝对路径和相对路径
  - 添加常见安装位置的自动检测（npm global, pnpm global, yarn global）
  - 扩展缺失时提供清晰的安装指引
- 优化浏览器上下文启动超时和错误恢复

**文件涉及**：
- `src/browser-session.ts` - 浏览器启动和扩展加载
- `src/browser.ts` - 浏览器 API 封装

#### 3. 文件系统操作增强
**改进方案**：
- 统一使用 `node:fs/promises` 替代同步 API，提升性能
- 添加文件锁定机制，防止多实例冲突
- 改进错误处理，提供平台特定的错误消息

**文件涉及**：
- `src/daemon.ts` - PID 文件和 socket 清理
- `src/paths.ts` - 目录创建

#### 4. 测试覆盖扩展
**新增测试**：
- 添加 Windows 和 Linux CI 工作流（GitHub Actions）
- 平台特定的路径解析测试
- Socket 连接和重连测试（模拟网络延迟）
- 浏览器启动失败恢复测试
- 多实例并发测试

**文件涉及**：
- `.github/workflows/test-windows.yml` (新建)
- `.github/workflows/test-linux.yml` (新建)
- `test/platform-paths.test.ts` (新建)
- `test/daemon-multiinstance.test.ts` (新建)

### 性能优化

#### 1. 事件队列性能
- 优化 `EventQueue` 的时间窗口查询（当前 O(n)，可改为二分查找 O(log n)）
- 添加事件类型索引，加速 `ofType` 查询

**文件涉及**：
- `src/event-queue.ts`

#### 2. Source Map 缓存
- 添加 source map 解析结果的 LRU 缓存
- 减少重复的网络请求和文件读取

**文件涉及**：
- `src/sourcemap.ts`

### 文档更新
- 添加 Windows 和 Linux 安装指南
- 更新平台特定的故障排除文档
- 添加 Docker 环境使用指南

**文件涉及**：
- `docs/guide/getting-started.md`
- `docs/guide/troubleshooting.md` (新建)

---

## v0.3.5+：React 环境支持增强

**目标**：提升 React 应用的诊断能力，达到与 Vue/Pinia 相当的深度支持。

### 核心功能

#### 1. React DevTools 集成改进
**当前问题**：
- React DevTools 扩展依赖外部路径，安装复杂
- 扩展模式失败时回退到基础模式，但功能受限
- `snapshot` 和 `inspect` 依赖扩展的 bridge 消息，不够稳定

**改进方案**：
- **内置 React DevTools Hook**：
  - 将 `installHook.js` 打包到项目中（MIT 许可证兼容）
  - 移除对外部扩展路径的依赖
  - 简化安装流程，实现零配置
- **增强 Hook 注入**：
  - 在页面加载前注入 hook，确保 React 初始化时可用
  - 添加 hook 健康检查和自动重注入
- **改进 Bridge 通信**：
  - 添加消息超时和重试机制
  - 实现更稳定的 `operations` 事件监听
  - 支持 React 18+ 的并发特性

**文件涉及**：
- `src/react/devtools.ts` - DevTools 集成逻辑
- `src/react/hook.js` (新建) - 内置 hook 脚本
- `src/browser-session.ts` - Hook 注入逻辑

#### 2. React 状态管理支持
**新增功能**：
- **Zustand 支持**：
  - 检测 Zustand store 实例
  - 追踪 store 更新和订阅者
  - 格式化 store 状态输出
- **Redux/Redux Toolkit 支持**：
  - 检测 Redux DevTools Extension
  - 读取 store 状态和 action 历史
  - 关联 action dispatch 与组件渲染
- **Jotai/Recoil 支持**（可选）：
  - 检测 atom/selector 更新
  - 追踪依赖关系

**新增命令**：
```bash
vite-browser react store list              # 列出所有检测到的 store
vite-browser react store inspect <name>    # 查看 store 状态
vite-browser react store trace <name>      # 追踪 store 更新历史
```

**文件涉及**：
- `src/react/stores.ts` (新建) - 状态管理集成
- `src/react/zustand.ts` (新建)
- `src/react/redux.ts` (新建)

#### 3. React 渲染追踪增强
**当前问题**：
- `browser-collector.ts` 中的 React 渲染追踪较为基础
- 缺少渲染原因分析（props 变化、state 变化、context 变化）
- 无法追踪 React 18 并发渲染

**改进方案**：
- **渲染原因分析**：
  - 集成 React DevTools Profiler API
  - 记录每次渲染的触发原因（props/state/hooks/parent）
  - 识别不必要的重渲染
- **性能分析**：
  - 记录组件渲染时长
  - 检测慢渲染和渲染瓶颈
  - 生成火焰图数据
- **并发特性支持**：
  - 追踪 Suspense 边界
  - 记录 Transition 和 useDeferredValue 使用
  - 检测并发渲染冲突

**文件涉及**：
- `src/browser-collector.ts` - 渲染事件收集
- `src/react/profiler.ts` (新建) - 性能分析
- `src/event-queue.ts` - 添加新的事件类型

#### 4. React 错误边界集成
**新增功能**：
- 检测 Error Boundary 组件
- 记录错误捕获和恢复
- 关联错误与组件树位置

**文件涉及**：
- `src/react/error-boundary.ts` (新建)
- `src/browser-collector.ts` - 错误事件增强

#### 5. React 传播路径诊断
**目标**：实现类似 Vue/Pinia 的 `store → render → error` 传播分析

**改进方案**：
- **Store → Component 追踪**：
  - 识别组件订阅的 store（Zustand/Redux）
  - 记录 store 更新触发的组件渲染
  - 提取变化的 state 键
- **Props 传播追踪**：
  - 追踪 props 在组件树中的传递路径
  - 识别 props drilling 和 context 传递
- **Hooks 依赖分析**：
  - 追踪 useEffect/useMemo/useCallback 依赖变化
  - 识别依赖缺失导致的问题

**新增命令**：
```bash
vite-browser diagnose react-propagation --window 5000
```

**文件涉及**：
- `src/diagnose-react-propagation.ts` (新建)
- `src/correlate.ts` - 扩展关联逻辑
- `src/trace.ts` - 扩展追踪逻辑

### 测试覆盖

#### 新增测试
- React DevTools hook 注入测试
- Zustand/Redux store 检测和追踪测试
- React 渲染原因分析测试
- React 传播路径诊断测试
- 真实 React 应用的 E2E 测试（Create React App, Next.js, Remix）

**文件涉及**：
- `test/react-stores.test.ts` (新建)
- `test/react-profiler.test.ts` (新建)
- `test/diagnose-react-propagation.test.ts` (新建)
- `test/evals-e2e/react-app.e2e.test.ts` (新建)

### 文档更新
- React 应用调试完整指南
- React 状态管理集成文档
- React 性能分析工作流
- React 最佳实践和常见问题

**文件涉及**：
- `docs/guide/react-debugging.md` (新建)
- `docs/reference/react-commands.md` (新建)
- `docs/capabilities/react-diagnostics.md` (新建)

---

## 发布计划

### v0.3.4 时间线
- **Week 1-2**：跨平台路径和浏览器启动优化
- **Week 3**：性能优化和测试覆盖
- **Week 4**：CI 集成和文档更新
- **Week 5**：Beta 测试和 bug 修复
- **Week 6**：正式发布

### v0.3.5 时间线
- **Week 1-2**：React DevTools 集成改进和内置 hook
- **Week 3-4**：Zustand 和 Redux 支持
- **Week 5-6**：渲染追踪和性能分析
- **Week 7-8**：传播路径诊断
- **Week 9**：测试覆盖和文档
- **Week 10**：Beta 测试
- **Week 11**：正式发布

### v0.3.6+ 后续规划
- Jotai/Recoil 支持
- React Server Components 支持
- Next.js App Router 特定诊断
- React Native 支持（可选）

---

## 兼容性承诺

- 保持 CLI 命令向后兼容
- 新功能通过特性标志逐步启用
- 维护 Vue/Svelte 现有功能的稳定性
- 保持零配置的核心理念

---

## 贡献指南

欢迎社区贡献！优先级领域：
1. Windows/Linux 平台测试和 bug 报告
2. React 状态管理库集成（Zustand, Redux, Jotai）
3. 真实应用场景的 E2E 测试用例
4. 文档翻译和改进

详见 `CONTRIBUTING.md`（待创建）。
