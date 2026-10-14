# AGENTS.md

> 本文件遵循 [agents.md](https://agents.md/) 规范，为 AI Agent 提供项目上下文。

## 项目概览

**现场抽奖工具** —— 面向公司内部活动场景（年会、团建、发布会、培训福利发放）的网页抽奖系统。
覆盖「活动前准备 → 活动中开奖 → 活动后查看」全闭环，支持奖项配置、名单管理、滚动揭晓、中奖记录持久化。

- **前端**：Vite 7 + React 18 + TypeScript 5
- **UI**：shadcn/ui + TailwindCSS v4
- **路由**：React Router v7
- **状态管理**：Zustand v5（persist 中间件 → localStorage 持久化）
- **动效**：Framer Motion v12
- **数据持久化**：localStorage（离线可用、刷新不丢、零后端依赖）
- **部署**：frontend-cloud

## 视觉设计

- 场景：tool-app（工具型应用）
- 主题：B-dark-pro（深色专业，大屏投影仪友好）
- 深色背景 #0F172A + 亮蓝主色 #3B82F6 + 高对比度文字
- 大屏开奖区允许适度发光效果（glow）营造仪式感

## 目录结构

```
src/
├── pages/
│   ├── SetupPage.tsx      # 配置后台：奖项配置 + 名单管理 + 就绪检查
│   ├── LotteryPage.tsx    # 开奖大屏：滚动动效 + 揭晓 + 全屏 + 快捷键
│   └── RecordsPage.tsx    # 中奖记录：查询 + 筛选 + 导出 CSV
├── components/
│   ├── ui/                # shadcn/ui 组件（button, card）
│   └── Layout.tsx         # 全局布局（NavBar + PageShell）
├── store/
│   └── useLotteryStore.ts # Zustand store + persist（localStorage 持久化）
├── lib/
│   ├── lottery.ts         # 抽奖核心逻辑（Fisher-Yates 洗牌、CSV 解析/导出）
│   └── utils.ts           # cn() 工具函数
├── types.ts               # 类型定义（Prize, Participant, WinnerRecord）
├── App.tsx                # 路由配置
├── main.tsx               # 应用入口
└── index.css              # B-dark-pro 深色主题 Token
tests/
└── browser/
    ├── INDEX.md           # 浏览器测试索引
    └── scripts/           # 自动化测试脚本
```

## 路由开发规范

路由统一在 `src/App.tsx` 的 `<Routes>` 中配置，页面组件放在 `src/pages/` 目录。

### 新增页面步骤

1. 在 `src/pages/` 下创建页面组件文件（如 `ProfilePage.tsx`）
2. 在 `src/App.tsx` 中添加对应的 `<Route>`

### App.tsx 示例

```tsx
import { Routes, Route } from 'react-router'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
    </Routes>
  )
}
```

### 页面内跳转

```tsx
import { Link, useNavigate, useParams } from 'react-router'

// 声明式跳转
<Link to="/about">关于</Link>

// 编程式跳转
const navigate = useNavigate()
navigate('/about')
navigate(-1) // 返回上一页

// 动态路由参数
const { id } = useParams<{ id: string }>()
```

## 构建与启动命令

```bash
# 安装依赖（必须使用快手内部 npm 源）
npm install

# 启动开发服务器
npm run dev

# 构建产物
npm run build

# 预览构建产物
npm run preview

# 部署到 frontend-cloud
npx -y --registry https://npm.corp.kuaishou.com @codeflicker/frontend-cloud-cli@latest deploy --dir dist
```

## 已安装的 shadcn/ui 组件

`button` `card`

添加更多组件：
```bash
npx shadcn@latest add <component-name>
```

## 安全约束（禁止违反）

| 规则 | ✅ 允许 | ❌ 禁止 |
|------|---------|---------|
| UI 组件库 | shadcn/ui + TailwindCSS | MUI / AntD / Chakra UI |
| CSS | TailwindCSS | CSS Modules / Styled Components |
| npm 源 | `https://npm.corp.kuaishou.com/` | npmjs.org 直连（网络受限）|
| Endpoint | 禁止手动修改 | 硬编码其他 URL 字符串 |
| project_id 格式 | 纯字母数字下划线 | 含连字符 `-` |
| `.static-site-deploy.json` | 只读，由部署工具自动管理 | 手动修改文件内容 |
| 数据持久化 | localStorage（zustand persist） | 后端数据库 |

## 注意事项

- **localStorage 数据隔离**：数据按域名+浏览器存储，不跨设备同步。导出/导入 CSV 可跨设备传递名单
- **framer-motion 版本**：内网源不支持 v13（motion-dom 依赖缺失），固定使用 v12.x
- **深色主题**：全局使用 B-dark-pro 主题 Token，在 index.css :root 中定义，无需 .dark 类切换
- **开奖快捷键**：空格键开始/停止、→ 下一轮、Esc 退出全屏
- **刷新不丢**：所有状态（奖项、名单、中奖记录、当前轮次）通过 zustand persist 自动持久化到 localStorage

> 部署详细说明请读取并使用 `pde-agent` skill。

## 测试指令

- **开发中**：`pnpm dev` 启动后，使用浏览器自动化工具验证无白屏、无 JS 报错
- **构建验证**：`pnpm build`（无报错即通过）
- **代码检查**：`pnpm lint`
