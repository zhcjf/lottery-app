import { motion } from 'framer-motion'
import type { Participant, Prize } from '@/types'

// ═══ 流体字号工具：根据名字长度自适应，防溢出 ═══
export function fluidName(maxVw: number, minRem: number, maxRem: number, nameLen: number) {
  const vw = Math.min(maxVw, (maxVw * 4) / Math.max(nameLen, 2))
  return `clamp(${minRem}rem, ${vw}vw, ${maxRem}rem)`
}

// ═══ 艺术字组件：渐变字 + 多层光晕 + 艺术倾斜 + 自适应大小 ═══
export function ArtName({
  name,
  color,
  accentColor = '#F472B6',
  sizeVw = 6,
  minRem = 1.2,
  maxRem = 3.5,
  maxWidth = '28vw',
}: {
  name: string
  color: string
  accentColor?: string
  sizeVw?: number
  minRem?: number
  maxRem?: number
  maxWidth?: string
}) {
  return (
    <span
      className="inline-block text-center font-extrabold italic leading-tight"
      style={{
        fontSize: fluidName(sizeVw, minRem, maxRem, name.length),
        maxWidth,
        wordBreak: 'keep-all',
        overflow: 'hidden',
        letterSpacing: '-0.02em',
        background: `linear-gradient(135deg, ${color} 30%, ${accentColor} 70%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: `drop-shadow(0 0 12px ${color}70) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
        transform: 'skew(-2deg)',
      }}
    >
      {name}
    </span>
  )
}

// ═══ 多彩调色板 ═══
export const VIBRANT = ['#FBBF24', '#F472B6', '#34D399', '#60A5FA', '#F87171', '#A78BFA', '#22D3EE', '#FB923C']

// ═══ 彩纸粒子效果（增强版） ═══
export function Confetti({ color }: { color: string }) {
  const pieces = Array.from({ length: 60 })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const x = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 2.5 + Math.random() * 2.5
        const rotate = Math.random() * 720
        const size = 4 + Math.random() * 6
        const c = i % 8 === 0 ? color : VIBRANT[i % VIBRANT.length]
        const shape = i % 3
        return (
          <motion.div
            key={i}
            initial={{ x: `${x}%`, y: -30, opacity: 1 }}
            animate={{ x: `${x + (Math.random() - 0.5) * 30}%`, y: '115%', opacity: [1, 1, 0.8, 0], rotate }}
            transition={{ duration, delay, ease: 'easeOut' }}
            className="absolute"
          >
            {shape === 0 && <div style={{ width: size, height: size * 1.5, background: c, borderRadius: 2 }} />}
            {shape === 1 && <div style={{ width: size, height: size, background: c, borderRadius: '50%' }} />}
            {shape === 2 && (
              <div
                style={{
                  width: 0, height: 0,
                  borderLeft: `${size / 2}px solid transparent`,
                  borderRight: `${size / 2}px solid transparent`,
                  borderBottom: `${size}px solid ${c}`,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ═══ 揭晓视图（所有动画共用）— 炫彩颁奖级 ═══
export function RevealView({ winners, prize }: { winners: Participant[]; prize: Prize }) {
  const cols = winners.length === 1 ? '1fr' : winners.length <= 4 ? 'repeat(2,1fr)' : 'repeat(3,1fr)'

  return (
    <div className="relative w-full space-y-4 px-2 sm:space-y-6 sm:px-4">
      <Confetti color={prize.color} />

      {/* 标题 */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="mx-auto mb-2"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', filter: `drop-shadow(0 0 25px ${prize.color})`, color: prize.color }}
        >
          ★
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 700 }}
          className="text-foreground"
        >
          恭喜中奖
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-muted-foreground"
          style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
        >
          {prize.name} · 共 {winners.length} 位
        </motion.div>
      </div>

      {/* 中奖者卡片 */}
      <div className="relative grid gap-3 sm:gap-4" style={{ gridTemplateColumns: cols }}>
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${prize.color}40, transparent 70%)` }}
        />
        {winners.map((winner, i) => (
          <motion.div
            key={winner.id}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
            style={{
              padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)',
              background: `linear-gradient(135deg, ${prize.color}20, ${prize.color}08, ${prize.color}12)`,
              border: `2px solid ${prize.color}`,
              boxShadow: `0 0 50px ${prize.color}30, inset 0 0 30px ${prize.color}08`,
            }}
          >
            {/* 闪光扫过 */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '200%', opacity: [0, 0.6, 0] }}
              transition={{ delay: i * 0.2 + 0.5, duration: 1 }}
              className="absolute inset-0"
              style={{ background: `linear-gradient(105deg, transparent 40%, ${prize.color}25 50%, transparent 60%)` }}
            />
            {/* 序号 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2 + 0.3, type: 'spring' }}
              className="mb-2 flex items-center justify-center rounded-full font-bold"
              style={{
                width: 'clamp(1.5rem, 3vw, 2rem)',
                height: 'clamp(1.5rem, 3vw, 2rem)',
                background: `${prize.color}30`,
                color: prize.color,
                border: `1px solid ${prize.color}60`,
                fontSize: 'clamp(0.7rem, 1.2vw, 0.875rem)',
              }}
            >
              {i + 1}
            </motion.div>
            {/* 姓名 —— 艺术字 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, z: -50 }}
              animate={{ scale: [0.8, 1.15, 1], opacity: 1, z: 20 }}
              transition={{ delay: i * 0.2 + 0.4, type: 'spring', stiffness: 200 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <ArtName name={winner.name} color={prize.color} />
            </motion.div>
            {/* 部门 */}
            {winner.department && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.2 + 0.6 }}
                className="mt-2 rounded-full text-muted-foreground"
                style={{ padding: '0.25rem 0.75rem', background: `${prize.color}10`, fontSize: 'clamp(0.65rem, 1.2vw, 0.875rem)' }}
              >
                {winner.department}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
