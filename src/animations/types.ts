import type { Participant, Prize } from '@/types'

/** 动画组件 Props */
export interface AnimationProps {
  pool: Participant[]
  winners: Participant[]
  prize: Prize
  phase: string // 'rolling' | 'revealing' | 'done'
  clickTrigger?: number // 每次点击屏幕时递增，用于交互式动画（如砸金蛋）
  onComplete?: () => void // 动画完成揭晓后回调
}

/** 动画元数据 */
export interface AnimationMeta {
  id: string
  name: string
  icon: string
  description: string
}

// ═══ 4 套动画注册表 ═══
export const ANIMATIONS: AnimationMeta[] = [
  { id: 'red-packet-rain', name: '红包雨',   icon: '🧧', description: '全屏红包降落，中奖红包飞出放大揭晓' },
  { id: 'particle-vortex', name: '粒子漩涡', icon: '🌀', description: '名字粒子螺旋汇聚，中心弹出揭晓' },
  { id: 'deal-cards',      name: '发牌',     icon: '🃏', description: '全屏飞牌乱发，中奖牌翻面放大揭晓' },
  { id: 'golden-egg',      name: '砸金蛋',   icon: '🥚', description: '逐个砸蛋，名字从蛋中冒出揭晓' },
]

export const DEFAULT_ANIMATION = 'red-packet-rain'
