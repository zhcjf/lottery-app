# CHANGELOG

<!-- 每次部署后在此顶部追加一条记录，最新在上，只追加不覆盖 -->

## 2026-09-04 09:30 — 689a01f7

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-689a01f7.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **红包雨名字严格在红包内**：
    - 字号计算保守化：左右边距从 40px 增加到 80px，宽度系数从 0.9 降到 0.65
    - 高度系数从 0.5 降到 0.35，行高分母从 1.3 增加到 1.6
    - 过滤换行符后再计算长度，避免不可见字符干扰
    - 红包背面添加 `overflow: hidden` + `padding: 10px` 作为保险
    - 去掉 `wordBreak: 'keep-all'`，允许长名字自然换行
  - **红包雨动画时间大幅缩短**：
    - 红包飞出分散：1.2s → 0.4s
    - 红包正反面翻转：0.5s → 0.2s
    - 恭喜标题出现延迟：0.5s → 0.2s
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-04 09:00 — 571e93bf

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-571e93bf.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **红包雨修复**：
    - rolling 阶段红包雨持续不断（onAnimationComplete 自动替换落出屏幕的红包）
    - revealing 阶段不再补充新红包（点击停止后红包雨逐渐消散）
    - done 阶段立即隐藏所有普通红包（`!isDone` 条件渲染）
    - 中奖红包名字字号根据名字长度自适应：`fontSize = min(红包宽度*0.8/名字长度, 42px)`
    - 名字用普通 span + color + textShadow，不用 ArtName（避免不可见）
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-04 08:50 — b8e3ce57

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-b8e3ce57.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **红包雨彻底重写**：
    - rolling + revealing 阶段红包雨持续不断（不提前清空），直到 done 才停
    - 中奖红包用 CSS transition 替代 framer-motion（修复 opacity 始终为 0 的 bug）
    - 中奖名字用普通文字替代 ArtName（避免 background-clip:text 不可见）
    - done 阶段红包正面淡出 + 背面淡入，名字永久停留居中显示
  - **名单管理**：不再识别第一行表头 + 新上传自动覆盖旧名单
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-04 08:40 — 48def248

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-48def248.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **名单管理 Bug 修复**：不再识别第一行是否为表头，所有行均作为数据导入；新上传文件自动覆盖旧名单
  - **红包雨 Bug 修复**：翻牌后红包消失 — 改用 opacity/scale 方式翻牌（正面淡出+背面淡入），替代 rotateY + backfaceVisibility 导致的消失问题
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-04 08:20 — 395fb727

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-395fb727.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **奖项配置添加编辑按钮**：每个奖项可内联编辑名称/人数/等级/范围，不需删除重建
  - **名单管理简化列映射**：上传文件后只需选择「保留/不保留」，系统自动按列顺序分配姓名/部门/分组；内容自动去重并提示
  - **每轮可换抽奖方式**：修复 done→idle 后动画选择器面板自动弹出的 bug
  - **红包雨**：修复中奖红包居中定位（移除 -9vw 偏移 + 内层 translate 避免与 framer-motion x/y 冲突）
  - **幸运转盘**：名字字体放大 + 白色描边提高对比度 + 人数>8 时只显示前 8 个名字保清晰
  - **发牌**：改为 winners.length 张牌 2 秒内逐张发完 + 全部背面朝上 + 翻牌用 opacity/scale 避免 rotateY 镜像 + done 阶段卡牌不重叠 + 标题在上方不遮挡
  - **娃娃机**：球放大 3.5rem + 字缩小 + 球紧密排布无缝隙 + 爪子始终显示 + 下落深度增加到球位 + 球被爪子提起跟随上升
  - **砸金蛋**：蛋数=中奖人数 + done 阶段名字卡片 min/max 宽度限制 + ArtName maxWidth 80% 不出框
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-03 23:02 — 982949fd

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-982949fd.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **修复 addWinners 覆盖 phase 的 bug**：addWinners 不再设置 phase='done'，避免覆盖 stopAndReveal 设置的 'revealing'，确保砸金蛋等交互式动画正常工作
  - **修复 LotteryPage 防重复点击**：添加 500ms 防抖，避免一次点击触发多次事件
  - **红包雨重写**：RAF 驱动改为 framer-motion 驱动 + 独立 FallingPacket 组件用 setTimeout 管理生命周期，修复红包数量累积 bug
  - **粒子漩涡重写**：RAF 驱动改为 framer-motion 驱动，修复粒子数量累积 bug
  - **砸金蛋 done 阶段**：添加中奖名字列表（序号 + ArtName），不再只有"恭喜中奖"标题
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-03 22:30 — 126f5c42

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-126f5c42.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **砸金蛋改为交互式点击砸蛋**：蛋数=中奖人数，每次点击屏幕砸开一个蛋，名字从蛋中冒出；全部砸完后自动进入"恭喜中奖"展示
  - **修复 AnimationProps/AnimationMeta 类型定义丢失**：恢复接口定义，新增 `clickTrigger` 和 `onComplete` 可选属性
  - **LotteryPage 支持交互式动画**：砸金蛋时不设 3.5s 超时，改为点击驱动；revealing 阶段点击屏幕递增 `clickTrigger`，动画完成后回调 `onComplete` 切换到 done
  - 底部进度提示「点击屏幕砸开金蛋（已砸/总数）」
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-03 22:18 — 3f7daa7a

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-3f7daa7a.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **动画精简为 6 套**：移除老虎机、水晶碎裂、盲盒，保留红包雨/幸运转盘/粒子漩涡/发牌/抓娃娃机/砸金蛋
  - **6 套动画全部重写为全屏展示**，各有独特的揭晓流程：
    - 红包雨：45 个红包全屏落下 → 中奖红包飞出放大 → 3D 翻转展示名字
    - 幸运转盘：全屏大转盘 → 指针停定 → 中奖分段弹出为圆角框展示
    - 粒子漩涡：名字粒子螺旋汇聚 → 标题与名字上下分层不重叠
    - 发牌：28 张牌全屏乱飞 → 中奖牌飞回中央翻面放大
    - 抓娃娃机：全屏不规则球池 → 多爪逐个抓取 → 球放大呈现名单
    - 砸金蛋：蛋数=中奖数 → 锤子逐个砸开 → 名字从蛋中冒出
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-03 19:30 — 5514520f

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-5514520f.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **移除统一 CelebrationOverlay 覆盖层**：不再用统一覆盖层遮挡动画，每个动画自己展示揭晓结果
  - **延长 reveal 过渡时间 800ms → 3500ms**：给各动画充足时间完成自己的揭晓动效，不再提前切断
  - **9 套动画各自拥有独特的 done 阶段庆祝展示**：
    - 老虎机：全列高亮 + 彩纸飘落 + "恭喜中奖"标题
    - 红包雨：背景遮罩 + 恭喜标题 + 中奖者金色卡片网格 + 彩纸
    - 幸运转盘：高亮中奖分段 + 中心弹出 ArtName 名字 + 彩纸
    - 粒子漩涡：3D 弹出中奖名字 + 闪光爆发 + 恭喜标题
    - 水晶碎裂：脉冲光晕 + 所有中奖者 ArtName 纵向排列 + 恭喜标题
    - 发牌：横向闪光扫过 + 恭喜标题 + 彩纸飘落
    - 抓娃娃机：娃娃 1.8 倍放大展示 + 恭喜标题 + 彩纸
    - 盲盒：中奖者卡片列表 + 彩纸 + 恭喜标题
    - 砸金蛋：金色闪光爆发 + 中奖者卡片 + 金/橙色彩纸 + 恭喜标题
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-02 11:45 — 92345f19

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-92345f19.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **记录页改为按「场次」展示**：同一场内抽出的一等奖/二等奖/三等奖合并在一起展示，不再每个奖项分开一条
    - 引入场次（session）概念：点击「结束本轮抽奖」开启新场次，场次内多次抽取共享同一场
    - 每场一张卡片：场内按奖项等级分组（色标 + 奖项名 + 人数 + 中奖者网格）
    - 每场支持独立导出 / 删除 / 展开收起
    - 旧记录自动兼容（按轮次归场）
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-02 10:15 — b3e28579

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-b3e28579.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **记录页重构：一次抽奖的所有奖项合并展示**
    - 不再按轮次分开显示，所有奖项（一等奖/二等奖/三等奖等）在同一个卡片内统一呈现
    - 按奖项等级分组，每组显示奖项名 + 中奖人数 + 中奖者网格
    - 每个奖项组保留独立删除按钮
    - 卡片头部显示整场抽奖概览（奖项数、总人次、时间）
    - 保留展开/收起、导出全部、复制、清空功能
    - 底部汇总面板显示奖项数/总人次/中奖者统计
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-02 10:00 — c7664d61

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-c7664d61.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **动画连贯性重构**：揭晓在动画内完成，不再跳切到独立 RevealView
    - 9 套动画各自在自己的视觉上下文中展示中奖者（老虎机在转轴上、红包在拆开的红包里、转盘在指针指向的分段上等）
    - 新增 CelebrationOverlay 庆祝覆盖层：揭晓后叠加彩纸 + 「恭喜中奖」文字，不中断动画画面
  - **开始按钮放主屏**：主舞台中央显示大号「开始开奖」按钮 + 「预览动画」按钮
  - **点击屏幕停止**：滚动中点击屏幕任意位置即可停止揭晓
  - **滚动时隐藏奖项名**：抽奖过程中不显示「几等奖」，仅在中奖后或空闲时显示
  - **预览模式分离**：预览按钮独立，带「预览模式」水印，不记录中奖者
  - **表头自定义**：模板下载改为灵活格式，智能检测 30+ 种列名变体（姓名/名字/名称/人员/员工/成员/部门/科室/单位/组织/团队/分组/组别/标签/类别等）
  - **列映射增强**：上传后自动识别表头并推荐映射，用户可调整任意列的用途
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-01 17:20 — 8307cc25

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-8307cc25.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **动画精简为 9 套**：剔除「大逃生」，保留悬念感最高的 9 种
  - **9 套动画全部重写**，按设计方案实现：
    - 老虎机：深紫机身 3D 仰角 + 金粉绿交替灯条 + 逐列 spring 停定 + 停止瞬间 rotateX 翻牌
    - 红包雨：红色光柱背景 + 福字红包 + 拆开金光迸射粒子 + rotateY 翻转
    - 幸运转盘：六色分段 conic-gradient + 指针抖动 + 3.2s 减速 + 揭晓光环爆发
    - 粒子漩涡：三层虚线环不同方向旋转 + 36 个多彩粒子 3D 螺旋 + 中奖名字中心弹出
    - 水晶碎裂：六边形水晶 + 裂纹随滚动进度蔓延 + 26 片碎片 3D 飞散 + 白色闪光爆点
    - 发牌：德州扑克风格牌堆 + spring 飞牌 + 3D rotateY 翻面 + 花色点数 + 渐变牌面
    - 抓娃娃机：3D 玻璃罩机器 + 爪子开合摆动 + 绳索下落 + 抓取提升娃娃
    - 盲盒：3×3 多彩盲盒 + 逐个消除上飘 + 翻盖拆开 + 金光迸射
    - 砸金蛋：椭圆蛋壳质感 + 裂纹抖动 + 锤子落下 + 10 片碎片飞散 + 名字跃出
  - **新增共享艺术字组件 ArtName**：渐变文字（主色→辅色）+ 双层 drop-shadow 光晕 + 倾斜 skew(-2deg) + 800 字重 + 按名字长度自适应字号
  - **3D 效果全覆盖**：perspective + preserve-3d + rotateX/Y + translateZ 跃出感
  - **氛围粒子**：所有动画背景增加多彩粒子漂浮/脉动，消除留白
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-01 12:00 — 11d5826c

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-11d5826c.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - **字体溢出修复（最高优先级）**：所有动画组件改为 clamp+vw 流体字号，根据名字长度自适应，不再超出边框
  - **发牌动画完全重写**：参考德州扑克，牌堆发牌→飞牌定位→依次翻面揭晓，含花色点数
  - **老虎机/满屏滚动字号修复**：转轴高度和名字字号均使用 clamp 自适应
  - **预览模式改为全流程**：倒计时→滚动→揭晓完整流程，不记录中奖者，带「预览模式」水印
  - **中奖记录页重构**：每轮一条记录，点击展开详细名单，每条带导出+删除按钮，收起显示前3位预览
  - **炫彩配色升级**：默认奖项等级改为红/金/紫/绿/粉五色，背景增加多色光晕（粉紫+青绿+金色+蓝色）
  - **彩纸粒子增强**：60片多色彩纸（方形/圆形/三角混合），旋转+翻转+飘落
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-01 11:35 — 5c8f6e62

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-5c8f6e62.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - 重置按钮：可中途结束抽奖，保留已抽记录不丢失
  - 三种抽奖模式：顺序模式（逐个开奖）/ 自由模式（任意切换奖项）/ 连抽模式（自动连续）
  - 预览模式：只播放动画不实际抽取，带「预览模式」水印标识
  - 抽奖界面导航：顶部可直接返回配置页、查看记录页
  - 奖项自由切换：自由模式下点击进度条跳转任意奖项，历史面板可跳转
  - 重构中奖记录页：按奖项分组卡片，展开/收起查看详细名单
  - 单项导出：每个奖项可独立导出 CSV，底部汇总含总人数/奖项数/轮次
  - 收起状态显示前 5 位中奖者预览，展开后按轮次分组详列
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-09-01 11:15 — dfef7b89

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-dfef7b89.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - 开奖大屏整体重构：颁奖典礼之夜设计概念
  - 自动全屏：点击开始→自动进入浏览器全屏，全部抽完→2秒后自动退出
  - 仪式感流程：3-2-1 倒计时→滚动→揭晓→恭喜，每阶段有主持人提示文案
  - 中奖历史侧边栏：右侧滑出面板，按轮次分组展示已抽中奖者，现场核对
  - 增强揭晓动效：彩纸粒子、闪光扫过、序号徽章、奖项层级标注
  - 顶部轮次进度条：奖项色标 + 已完成/当前/未抽取状态
  - 11 套动画选择器：经典滚动/满屏滚动/老虎机/红包雨/幸运转盘/粒子漩涡/水晶碎裂/球形爆裂/大逃生/发牌/抓娃娃机
  - 背景舞台光效：中心光柱脉动 + 双侧旋转光环
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-08-31 23:20 — 2d204347

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-2d204347.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - 新增「下载模板」按钮：一键下载标准 CSV 模板（姓名/部门/分组）
  - 新增列映射功能：上传文件后展示数据预览，可指定每列对应字段（姓名/部门/分组/忽略）
  - 智能识别表头列名自动推荐映射，用户可调整
  - 同一字段不可重复映射到多列，确保数据一致性
  - 预览前 5 行数据，显示总行数
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-08-31 23:10 — 5a772e9d

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-5a772e9d.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - 奖项等级支持自定义：等级名称、颜色可自由增删改，不再限定 5 个固定等级
  - 支持上传 Excel 文件（.xlsx / .xls），使用 SheetJS 解析
  - 支持在线文档链接导入：粘贴公开可访问的 CSV/Excel URL 自动解析
  - 上传按钮统一为「上传文件」，支持 CSV + Excel
  - 导入结果提示优化：不再使用 alert，改为页内消息提示
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）

## 2026-08-31 22:55 — aaa315ff

- 访问地址：https://pdecompetition4.frontend-cloud.corp.kuaishou.com
- 版本地址：https://pdecompetition4-aaa315ff.frontend-cloud.corp.kuaishou.com
- 变更内容：
  - 初始化现场抽奖工具项目
  - 实现配置后台（奖项配置 + 名单管理 + 就绪检查）
  - 实现开奖大屏（滚动动效 + 揭晓仪式感 + 全屏 + 快捷键）
  - 实现中奖记录（按轮次/奖项筛选 + CSV 导出 + 复制）
  - localStorage 持久化（刷新不丢、离线可用）
  - B-dark-pro 深色主题（大屏投影仪友好）
- 白屏回归：通过（覆盖路由：/ , /lottery , /records）
