# 现场抽奖助手

面向公司内部活动场景（年会、团建、发布会、培训福利发放）的网页抽奖工具。
覆盖「活动前准备 → 活动中开奖 → 活动后查看」全闭环，支持深色大屏展示、滚动揭晓动效、中奖记录持久化。

## 功能

- **奖项配置**：多奖项层级（特等奖→幸运奖）、抽取人数、参与范围（全部/指定分组）、是否允许重复中奖
- **名单管理**：粘贴 Excel 表格导入 / CSV 上传 / 手动添加，自动去重、分组统计、重名检测
- **开奖大屏**：名字滚动动效 → 缓动减速 → 揭晓仪式感，全屏沉浸模式，快捷键操作
- **中奖记录**：按轮次/奖项筛选、CSV 导出、一键复制，localStorage 持久化（刷新不丢）
- **边界处理**：空名单提示、人数不足提示、撤销误操作、刷新恢复

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vite 7 + React 18 + TypeScript 5 |
| UI | shadcn/ui + TailwindCSS v4 |
| 路由 | React Router v7 |
| 状态管理 | Zustand v5（persist → localStorage 持久化） |
| 动效 | Framer Motion v12 |
| 图标 | lucide-react |
| 数据持久化 | localStorage（离线可用、刷新不丢、零后端依赖） |
| 部署 | frontend-cloud |

## 快速开始

```bash
# 1. 安装依赖（使用快手内部 npm 源）
npm install

# 2. 启动开发服务器
npm run dev

# 3. 构建
npm run build

# 4. 部署到 frontend-cloud
npx -y --registry https://npm.corp.kuaishou.com @codeflicker/frontend-cloud-cli@latest deploy --dir dist
```

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 配置后台 | 奖项配置 + 名单管理 + 就绪检查 |
| `/lottery` | 开奖大屏 | 滚动动效 + 揭晓 + 全屏 + 快捷键 |
| `/records` | 中奖记录 | 查询 + 筛选 + 导出 CSV |

## 开奖快捷键

| 按键 | 功能 |
|------|------|
| 空格键 | 开始滚动 / 停止揭晓 |
| → | 下一轮 |
| Esc | 退出全屏 |

## 视觉设计

- 场景：tool-app（工具型应用）
- 主题：B-dark-pro（深色专业，大屏投影仪友好）
- 深色背景 #0F172A + 亮蓝主色 #3B82F6 + 高对比度文字

## 约束说明

- **npm 源**：必须使用 `https://npm.corp.kuaishou.com/`
- **UI 组件**：shadcn/ui + TailwindCSS（禁止 MUI / AntD / Chakra UI）
- **framer-motion**：内网源不支持 v13，固定使用 v12.x
- **数据**：localStorage 持久化，不跨设备同步，导出 CSV 可跨设备传递
