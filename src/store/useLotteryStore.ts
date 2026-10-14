import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Prize, Participant, WinnerRecord, LotteryPhase, PrizeLevel } from '@/types'
import { DEFAULT_PRIZE_LEVELS } from '@/types'

// ═══ 工具函数 ═══
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ═══ 抽奖模式 ═══
export type LotteryMode = 'sequential' | 'free' | 'rapid'

export const MODE_OPTIONS = [
  { id: 'sequential' as const, name: '顺序模式', desc: '按配置顺序逐个开奖，适合标准流程' },
  { id: 'free' as const, name: '自由模式', desc: '可任意切换奖项开奖，适合灵活现场' },
  { id: 'rapid' as const, name: '连抽模式', desc: '自动连续抽完所有奖项，适合快速开奖' },
]

// ═══ Store 类型 ═══
interface LotteryStore {
  // 配置数据
  prizeLevels: PrizeLevel[]
  prizes: Prize[]
  participants: Participant[]

  // 开奖状态
  currentPrizeIndex: number
  winners: WinnerRecord[]
  phase: LotteryPhase
  roundCounter: number
  sessionCounter: number // 场次计数：结束场次后递增，同一场内所有抽取共享同一 session
  mode: LotteryMode
  previewMode: boolean

  // ── 奖项等级操作 ──
  addPrizeLevel: (level: Omit<PrizeLevel, 'id'>) => void
  updatePrizeLevel: (id: string, patch: Partial<PrizeLevel>) => void
  removePrizeLevel: (id: string) => void

  // ── 奖项操作 ──
  addPrize: (prize: Omit<Prize, 'id'>) => void
  updatePrize: (id: string, patch: Partial<Prize>) => void
  removePrize: (id: string) => void
  reorderPrizes: (newOrder: Prize[]) => void

  // ── 名单操作 ──
  addParticipant: (p: Omit<Participant, 'id'>) => void
  addParticipants: (list: Omit<Participant, 'id'>[]) => number
  removeParticipant: (id: string) => void
  clearParticipants: () => void

  // ── 开奖操作 ──
  setCurrentPrizeIndex: (index: number) => void
  setPhase: (phase: LotteryPhase) => void
  setMode: (mode: LotteryMode) => void
  setPreviewMode: (on: boolean) => void
  addWinners: (records: WinnerRecord[]) => void
  undoLastRound: () => void
  deleteRound: (round: number) => void
  deleteSession: (session: number) => void
  clearWinners: () => void
  endSession: () => void // 重置：保留已抽记录，回到 idle 状态，并开启新场次

  // ── 全局 ──
  resetAll: () => void
}

// ═══ 持久化存储 ═══
export const useLotteryStore = create<LotteryStore>()(
  persist(
    (set, get) => ({
      prizeLevels: DEFAULT_PRIZE_LEVELS,
      prizes: [],
      participants: [],
      currentPrizeIndex: 0,
      winners: [],
      phase: 'idle',
      roundCounter: 0,
      sessionCounter: 1,
      mode: 'sequential',
      previewMode: false,

      // ── 奖项等级操作 ──
      addPrizeLevel: (level) =>
        set((s) => ({
          prizeLevels: [...s.prizeLevels, { ...level, id: genId() }],
        })),

      updatePrizeLevel: (id, patch) =>
        set((s) => ({
          prizeLevels: s.prizeLevels.map((l) =>
            l.id === id ? { ...l, ...patch } : l
          ),
        })),

      removePrizeLevel: (id) =>
        set((s) => ({
          prizeLevels: s.prizeLevels.filter((l) => l.id !== id),
        })),

      // ── 奖项操作 ──
      addPrize: (prize) =>
        set((s) => ({
          prizes: [...s.prizes, { ...prize, id: genId() }],
        })),

      updatePrize: (id, patch) =>
        set((s) => ({
          prizes: s.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePrize: (id) =>
        set((s) => ({
          prizes: s.prizes.filter((p) => p.id !== id),
        })),

      reorderPrizes: (newOrder) => set({ prizes: newOrder }),

      // ── 名单操作 ──
      addParticipant: (p) =>
        set((s) => ({
          participants: [...s.participants, { ...p, id: genId() }],
        })),

      addParticipants: (list) => {
        const existingNames = new Set(
          get().participants.map((p) => p.name + (p.group || ''))
        )
        const newOnes = list.filter(
          (p) => !existingNames.has(p.name + (p.group || ''))
        )
        set((s) => ({
          participants: [
            ...s.participants,
            ...newOnes.map((p) => ({ ...p, id: genId() })),
          ],
        }))
        return newOnes.length
      },

      removeParticipant: (id) =>
        set((s) => ({
          participants: s.participants.filter((p) => p.id !== id),
        })),

      clearParticipants: () => set({ participants: [] }),

      // ── 开奖操作 ──
      setCurrentPrizeIndex: (index) => set({ currentPrizeIndex: index }),

      setPhase: (phase) => set({ phase }),

      setMode: (mode) => set({ mode }),
      setPreviewMode: (on) => set({ previewMode: on }),

      addWinners: (records) =>
        set((s) => ({
          // 同一场次内的所有抽取共享同一 session
          winners: [...s.winners, ...records.map((r) => ({ ...r, session: r.session ?? s.sessionCounter }))],
          roundCounter: s.roundCounter + 1,
        })),

      undoLastRound: () => {
        const state = get()
        if (state.winners.length === 0) return
        // 找到最后一轮的记录
        const lastRound = Math.max(...state.winners.map((w) => w.round))
        set((s) => ({
          winners: s.winners.filter((w) => w.round !== lastRound),
          phase: 'idle',
          roundCounter: s.roundCounter > 0 ? s.roundCounter - 1 : 0,
        }))
      },

      clearWinners: () => set({ winners: [], phase: 'idle', roundCounter: 0, sessionCounter: 1 }),

      deleteRound: (round) =>
        set((s) => ({
          winners: s.winners.filter((w) => w.round !== round),
        })),

      deleteSession: (session) =>
        set((s) => ({
          winners: s.winners.filter((w) => (w.session ?? w.round) !== session),
        })),

      endSession: () => set((s) => ({ phase: 'idle', currentPrizeIndex: 0, previewMode: false, sessionCounter: s.sessionCounter + 1 })),

      // ── 全局 ──
      resetAll: () =>
        set({
          prizes: [],
          participants: [],
          currentPrizeIndex: 0,
          winners: [],
          phase: 'idle',
          roundCounter: 0,
          sessionCounter: 1,
          mode: 'sequential',
          previewMode: false,
        }),
    }),
    {
      name: 'lottery-tool-storage', // localStorage key
    }
  )
)

// ═══ 派生数据：获取可参与当前奖项的人员池 ═══
export function getEligiblePool(
  prize: Prize,
  participants: Participant[],
  winners: WinnerRecord[]
): Participant[] {
  // 1. 按范围筛选
  let pool = participants
  if (prize.scope === 'group' && prize.scopeGroup) {
    pool = participants.filter((p) => p.group === prize.scopeGroup)
  }

  // 2. 排除已中奖者（如果该奖项不允许重复）
  if (!prize.allowRepeat) {
    const wonIds = new Set(winners.map((w) => w.participantId))
    pool = pool.filter((p) => !wonIds.has(p.id))
  }

  return pool
}
