// ═══ 抽奖工具核心类型定义 ═══

/** 参与者（名单中的人员） */
export interface Participant {
  id: string
  name: string
  department?: string
  group?: string // 分组标签：如「管理层」「新员工」
}

/** 奖项等级定义（可自定义） */
export interface PrizeLevel {
  id: string
  name: string // 等级名称：如「一等奖」「特等奖」
  color: string // 等级主色
}

/** 奖项配置 */
export interface Prize {
  id: string
  name: string // 奖项名称：如「一等奖」
  count: number // 抽取人数
  allowRepeat: boolean // 是否允许重复中奖
  scope: 'all' | 'group' // 参与范围：全部 or 指定分组
  scopeGroup?: string // 当 scope=group 时，指定哪个分组
  levelId: string // 关联的奖项等级 ID
  color: string // 奖项主色（从等级继承）
}

/** 中奖记录 */
export interface WinnerRecord {
  id: string
  prizeId: string
  prizeName: string
  prizeColor: string
  participantId: string
  participantName: string
  department?: string
  timestamp: number // 抽取时间
  round: number // 第几轮（每次抽取递增）
  session?: number // 第几场（一场内多次抽取同一 session，结束场次后递增）
}

/** 抽奖状态 */
export type LotteryPhase = 'idle' | 'rolling' | 'revealing' | 'done'

/** 默认奖项等级配置 — 炫彩配色 */
export const DEFAULT_PRIZE_LEVELS: PrizeLevel[] = [
  { id: 'lv1', name: '特等奖', color: '#FF6B6B' }, // 红
  { id: 'lv2', name: '一等奖', color: '#FBBF24' }, // 金
  { id: 'lv3', name: '二等奖', color: '#A78BFA' }, // 紫
  { id: 'lv4', name: '三等奖', color: '#34D399' }, // 绿
  { id: 'lv5', name: '幸运奖', color: '#F472B6' }, // 粉
]
