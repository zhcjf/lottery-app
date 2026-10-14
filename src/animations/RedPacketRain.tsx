import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { AnimationProps } from './types'

interface Packet {
  id: number
  x: number
  size: number
  speed: number
  rotation: number
  startY: number // 起始 y 位置（vh），错开下落
}

const MAX_PACKETS = 50

export default function RedPacketRain({ pool, winners, prize, phase }: AnimationProps) {
  const [packets, setPackets] = useState<Packet[]>([])
  const [hasSplit, setHasSplit] = useState(false)
  const idRef = useRef(0)
  const isDone = phase === 'done'
  const isReveal = phase === 'revealing'
  const isRolling = phase === 'rolling'

  // 创建一个红包
  const makePacket = (): Packet => ({
    id: idRef.current++,
    x: Math.random() * 100,
    size: 1.8 + Math.random() * 2.5,
    speed: 2.5 + Math.random() * 3.5,
    rotation: Math.random() * 30 - 15,
  })

  // 初始化红包 — 每个红包有不同的起始 y 位置，避免同时出现
  useEffect(() => {
    const init = Array.from({ length: MAX_PACKETS }, (_, i) => ({
      ...makePacket(),
      // 起始 y 随机分布在 -120vh 到 0vh 之间，错开下落
      startY: -Math.random() * 120,
    }))
    setPackets(init)
  }, [pool])

  // rolling 阶段：持续补充红包（落出屏幕的用新红包替换）
  useEffect(() => {
    if (!isRolling) return
    const timer = setInterval(() => {
      setPackets(prev => {
        const updated = prev.map(p => p)
        if (updated.length >= MAX_PACKETS) return updated
        return [...updated, makePacket()]
      })
    }, 200)
    return () => clearInterval(timer)
  }, [isRolling])

  // revealing 阶段：立即清空所有普通红包（点击停止后不再有红包雨）
  useEffect(() => {
    if (isReveal || isDone) {
      setPackets([])
    }
  }, [isReveal, isDone])

  // revealing 时：先短暂保持叠在中央（100ms），再触发分裂
  useEffect(() => {
    if (isReveal || isDone) {
      setHasSplit(false)
      const timer = setTimeout(() => setHasSplit(true), 100)
      return () => clearTimeout(timer)
    } else {
      setHasSplit(false)
    }
  }, [isReveal, isDone])

  // 落出屏幕的红包自动移除并补充（rolling 时）
  const handlePacketDone = (id: number) => {
    if (isRolling) {
      setPackets(prev => {
        const filtered = prev.filter(p => p.id !== id)
        return [...filtered, makePacket()]
      })
    } else if (isReveal || isDone) {
      setPackets(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 红色背景氛围 */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, #FF174420, transparent 60%)' }} />

      {/* 普通红包雨 — 仅 rolling 时显示，revealing/done 时立即消失 */}
      {isRolling && packets.map(p => (
        <FallingPacket key={p.id} packet={p} onComplete={() => handlePacketDone(p.id)} />
      ))}

      {/* 中奖红包 — revealing 先叠在中央 → 分裂到各自位置 → 翻面显示名字 */}
      {(isReveal || isDone) && winners.map((w, i) => (
        <WinnerPacket
          key={`winner-${w.id}`}
          winner={w}
          index={i}
          total={winners.length}
          hasSplit={hasSplit}
        />
      ))}

      {/* revealing/done 阶段：恭喜标题 */}
      {(isReveal || isDone) && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="absolute left-1/2 top-[10%] z-30 -translate-x-1/2 text-center"
        >
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#FFD700', filter: 'drop-shadow(0 0 20px #FFD700)' }}>
            🧧 恭喜中奖 🧧
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{prize.name} · 共 {winners.length} 位</div>
        </motion.div>
      )}
    </div>
  )
}

// ═══ 普通红包：下落 ═══
function FallingPacket({ packet, onComplete }: {
  packet: { id: number; x: number; size: number; speed: number; rotation: number; startY: number }
  onComplete: () => void
}) {
  return (
    <motion.div
      initial={{ y: `${packet.startY}vh`, x: `${packet.x}vw`, opacity: 0, rotate: packet.rotation }}
      animate={{ y: '115vh', opacity: [0, 1, 1, 0], rotate: packet.rotation + 15 }}
      transition={{ duration: packet.speed, ease: 'linear' }}
      onAnimationComplete={onComplete}
      className="absolute"
      style={{ width: `${packet.size}rem`, height: `${packet.size * 1.3}rem`, left: 0, top: 0 }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-lg"
        style={{ background: 'linear-gradient(180deg, #FF1744, #C4001D)', border: '1px solid #FFD70050', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        <span className="text-xs font-bold" style={{ color: '#FFD700', fontSize: `${packet.size * 0.35}rem` }}>福</span>
      </div>
    </motion.div>
  )
}

// ═══ 中奖红包：先叠在中央 → 分裂到各自位置 → 翻面显示名字 ═══
function WinnerPacket({ winner, index, total, hasSplit }: {
  winner: { id: string; name: string }
  index: number
  total: number
  hasSplit: boolean
}) {
  const doneX = total === 1 ? 50 : 50 + (index - (total - 1) / 2) * (80 / total)
  const doneY = 45

  // 红包原始尺寸（rem）
  const w = 4.5 // rem
  const h = 6   // rem
  // 放大倍数
  const scale = 3.5
  // 放大后实际尺寸（rem → px，1rem = 16px）
  const scaledWPx = w * scale * 16  // 252px
  const scaledHPx = h * scale * 16  // 336px

  // 名字字号：保守计算，不论多少字都严格在红包内
  // 过滤掉可能存在的换行符后计算长度
  const cleanName = winner.name.replace(/\n/g, '')
  const nameLen = cleanName.length || 1
  const availW = scaledWPx - 80  // 留 80px 左右边距，给字体渲染膨胀留足空间
  const availH = scaledHPx * 0.35  // 名字区占红包高度的 35%
  // 保守系数 0.65：中文字符实际宽度 ≈ fontSize，fontWeight 800 会膨胀，需余量
  const fontSizeByW = availW / nameLen * 0.65
  // 名字高度约等于 fontSize * lineHeight(1.2)，保守留余量
  const fontSizeByH = availH / 1.6
  // 不设上限：字越多字越小，确保全部在红包内
  const fontSizePx = Math.min(fontSizeByW, fontSizeByH)

  return (
    <div
      className="absolute z-20"
      style={{
        width: `${w}rem`,
        height: `${h}rem`,
        left: 0,
        top: 0,
        // 用 marginLeft/marginTop 居中
        marginLeft: `-${w / 2}rem`,
        marginTop: `-${h / 2}rem`,
        // hasSplit=false：所有红包叠在中央；hasSplit=true：分裂到各自位置
        transform: hasSplit
          ? `translate(${doneX}vw, ${doneY}vh) scale(${scale})`
          : 'translate(50vw, 50vh) scale(2.5)',
        opacity: 1,
        transition: 'transform 0.4s ease-out',
      }}
    >
      {/* 红包正面（福字）— 分裂完成后快速翻出 */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #FF1744, #C4001D)',
          border: '2px solid #FFD700',
          boxShadow: '0 0 30px #FFD70060',
          opacity: hasSplit ? 0 : 1,
          transition: 'opacity 0.15s ease-out',
          transitionDelay: hasSplit ? '0.3s' : '0s',
        }}
      >
        <span className="font-bold" style={{ color: '#FFD700', fontSize: '2rem' }}>福</span>
      </div>

      {/* 红包背面（中奖名字）— 分裂完成后快速翻入 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #FFD700, #FF8C00)',
          border: '2px solid #FFD700',
          boxShadow: '0 0 40px #FFD70080',
          opacity: hasSplit ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
          transitionDelay: hasSplit ? '0.3s' : '0s',
          overflow: 'hidden',
          padding: '10px',
        }}
      >
        <span
          className="text-center font-extrabold"
          style={{
            color: '#C4001D',
            fontSize: `${fontSizePx}px`,
            fontWeight: 800,
            textShadow: '0 0 6px #FFD700, 0 1px 2px rgba(0,0,0,0.3)',
            maxWidth: '100%',
            lineHeight: '1.2',
            display: 'block',
            wordBreak: 'break-all',
          }}
        >
          {winner.name}
        </span>
        <span
          className="mt-1 font-bold"
          style={{ color: 'rgba(196, 0, 29, 0.5)', fontSize: `${Math.max(fontSizePx * 0.5, 10)}px` }}
        >
          中奖
        </span>
      </div>
    </div>
  )
}
