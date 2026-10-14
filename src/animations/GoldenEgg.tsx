import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnimationProps } from './types'
import { VIBRANT } from './RevealView'

interface Egg {
  id: number
  name: string
  color: string
  cracked: boolean
  smashed: boolean
  revealed: boolean
}

export default function GoldenEgg({ pool, winners, prize, phase, clickTrigger = 0, onComplete }: AnimationProps) {
  const [eggs, setEggs] = useState<Egg[]>([])
  const [hammerAt, setHammerAt] = useState<number | null>(null)
  const [smashCount, setSmashCount] = useState(0)
  const [allSmashed, setAllSmashed] = useState(false)
  const isDone = phase === 'done'
  const isReveal = phase === 'revealing'
  const prevClickRef = useRef(0)
  const smashIndexRef = useRef(0)

  const eggCount = winners.length || prize.count || 1

  // 初始化蛋
  useEffect(() => {
    const init = Array.from({ length: eggCount }, (_, i) => ({
      id: i,
      name: winners[i]?.name || '',
      color: VIBRANT[i % VIBRANT.length],
      cracked: false,
      smashed: false,
      revealed: false,
    }))
    setEggs(init)
    setSmashCount(0)
    smashIndexRef.current = 0
    setAllSmashed(false)
  }, [eggCount])

  // rolling 阶段：蛋轻微晃动 + 随机裂纹
  useEffect(() => {
    if (phase === 'rolling') {
      const timer = setInterval(() => {
        setEggs(prev => prev.map(e => ({
          ...e,
          cracked: Math.random() > 0.7,
        })))
      }, 400)
      return () => clearInterval(timer)
    }
  }, [phase])

  // revealing 阶段：用真实名字替换占位蛋
  useEffect(() => {
    if (isReveal && winners.length > 0) {
      setEggs(prev => prev.map((e, i) => ({ ...e, name: winners[i]?.name || e.name })))
    }
  }, [isReveal, winners])

  // 点击触发砸蛋：立即推进 index，动画异步执行
  useEffect(() => {
    if (!isReveal) return
    if (clickTrigger === prevClickRef.current) return
    prevClickRef.current = clickTrigger

    const curIndex = smashIndexRef.current
    if (curIndex >= eggCount) return

    // 立即推进，不等动画完成
    smashIndexRef.current = curIndex + 1
    setSmashCount(curIndex + 1)

    // 锤子落下
    setHammerAt(curIndex)

    // 350ms 后蛋碎裂
    setTimeout(() => {
      setEggs(prev => prev.map(e => e.id === curIndex ? { ...e, smashed: true, cracked: true } : e))
    }, 350)

    // 750ms 后显示名字 + 移走锤子
    setTimeout(() => {
      setEggs(prev => prev.map(e => e.id === curIndex ? { ...e, revealed: true } : e))
      setHammerAt(null)
      // 全部砸完
      if (curIndex + 1 >= eggCount) {
        setAllSmashed(true)
      }
    }, 750)
  }, [clickTrigger, isReveal, eggCount])

  // 全部砸完后等待 1s，然后回调 done
  useEffect(() => {
    if (allSmashed && onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [allSmashed, onComplete])

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ perspective: 1000 }}>
      {/* 背景暖光 */}
      <div className="absolute left-1/2 top-1/3 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, #FBBF2420, transparent 65%)' }} />

      <div className="flex h-full w-full items-center justify-center gap-6 px-8">
        <AnimatePresence>
          {eggs.map((egg) => (
            <motion.div
              key={egg.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative flex flex-col items-center"
              style={{ width: 'clamp(5rem, 14vw, 8.5rem)' }}
            >
              {/* 锤子 */}
              <AnimatePresence>
                {hammerAt === egg.id && (
                  <motion.div
                    initial={{ y: -100, rotate: -30, opacity: 0 }}
                    animate={{ y: 10, rotate: 8, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeIn' }}
                    className="absolute -top-12 z-30"
                    style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                  >
                    🔨
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 金蛋 */}
              <motion.div
                animate={
                  egg.smashed
                    ? { scale: [1.15, 0.9, 1] }
                    : egg.cracked
                    ? { x: [0, -3, 3, 0] }
                    : { y: [0, -6, 0] }
                }
                transition={
                  egg.smashed
                    ? { duration: 0.4 }
                    : egg.cracked
                    ? { duration: 0.15, repeat: Infinity }
                    : { duration: 2.4, repeat: Infinity, delay: egg.id * 0.2 }
                }
                className="relative flex items-center justify-center"
                style={{
                  width: 'clamp(4.5rem, 13vw, 7.5rem)',
                  height: 'clamp(5.5rem, 16vw, 9.5rem)',
                }}
              >
                {!egg.smashed ? (
                  <div className="relative flex h-full w-full items-center justify-center"
                    style={{
                      borderRadius: '50% / 55%',
                      background: `radial-gradient(ellipse at 32% 28%, ${egg.color}, ${egg.color}85 60%)`,
                      border: `2px solid ${egg.color}`,
                      boxShadow: `0 6px 20px ${egg.color}40, inset -10px -10px 18px rgba(0,0,0,0.25), inset 8px 8px 14px rgba(255,255,255,0.15)`,
                      filter: egg.cracked ? 'brightness(0.88)' : 'none',
                    }}>
                    {egg.cracked && (
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 120">
                        <g stroke="#1A1505" strokeWidth="2" fill="none" opacity="0.55">
                          <path d="M28 18 L50 58 L40 82" />
                          <path d="M72 28 L60 58 L78 88" />
                        </g>
                      </svg>
                    )}
                    <span style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>🥚</span>
                  </div>
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center">
                    {/* 碎片飞散 */}
                    {Array.from({ length: 10 }).map((_, j) => {
                      const angle = (j / 10) * Math.PI * 2
                      return (
                        <motion.div key={j}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{ x: Math.cos(angle) * 80, y: Math.sin(angle) * 80, opacity: 0, scale: 0.3, rotate: Math.random() * 400 }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          className="absolute"
                          style={{
                            width: 'clamp(0.5rem, 2vw, 0.9rem)',
                            height: 'clamp(0.5rem, 2vw, 0.9rem)',
                            background: egg.color,
                            borderRadius: 3,
                          }}
                        />
                      )
                    })}
                    {/* 白光爆点 */}
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute rounded-full"
                      style={{
                        width: 'clamp(3rem, 10vw, 5rem)',
                        height: 'clamp(3rem, 10vw, 5rem)',
                        background: `radial-gradient(circle, #fff, ${egg.color}50 50%, transparent 70%)`,
                      }}
                    />
                    {/* 名字冒出 */}
                    {egg.revealed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: [0, 1.3, 1], opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                        className="absolute flex flex-col items-center justify-center"
                        style={{ width: 'clamp(6rem, 18vw, 10rem)' }}
                      >
                        <span style={{
                          color: '#F1F5F9',
                          fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
                          fontWeight: 800,
                          textShadow: `0 0 8px ${egg.color}, 0 0 4px rgba(255,255,255,0.5)`,
                          textAlign: 'center',
                          wordBreak: 'break-all',
                          lineHeight: 1.2,
                          maxWidth: '100%',
                        }}>
                          {egg.name}
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══ done 阶段：恭喜标题 + 中奖名字列表（固定居中在屏幕中央） ═══ */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          >
            {/* 背景暗化 */}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />

            {/* 恭喜标题 */}
            <div
              className="relative z-10 mb-6 text-center"
              style={{ animation: 'fadeInDown 0.5s ease-out' }}
            >
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#FFD700', filter: 'drop-shadow(0 0 20px #FFD700)' }}>
                🥚 恭喜中奖 🥚
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{prize.name} · 共 {winners.length} 位</div>
            </div>

            {/* 中奖名字列表 */}
            <div className="relative z-10 flex flex-wrap items-start justify-center gap-3 px-4" style={{ maxWidth: '90vw' }}>
              {winners.map((w, i) => (
                <div
                  key={w.id}
                  className="flex flex-col items-center justify-center rounded-xl border border-yellow-500/30"
                  style={{
                    background: 'linear-gradient(135deg, #FFD70015, #FF8C0010)',
                    boxShadow: '0 0 25px #FFD70030',
                    width: 'clamp(8rem, 20vw, 12rem)',
                    padding: '1rem 1.25rem',
                    animation: `popIn 0.4s ease-out ${0.2 + i * 0.1}s both`,
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold mb-2"
                    style={{ background: '#FFD70025', color: '#FFD700', border: '1.5px solid #FFD70050' }}>
                    {i + 1}
                  </div>
                  <span style={{
                    color: '#F1F5F9',
                    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                    fontWeight: 800,
                    textShadow: '0 0 8px #FFD700, 0 0 4px rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                  }}>
                    {w.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* revealing 阶段提示：点击砸蛋 */}
      {isReveal && !allSmashed && (
        <div className="absolute bottom-[8%] left-1/2 z-20 -translate-x-1/2">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="rounded-full px-6 py-2.5 text-sm font-medium"
            style={{
              background: 'rgba(26,15,46,0.85)',
              border: '1px solid #FBBF2440',
              boxShadow: '0 0 20px #FBBF2430',
              color: '#FBBF24',
            }}
          >
            点击屏幕砸开金蛋（{smashCount}/{eggs.length}）
          </motion.div>
        </div>
      )}
    </div>
  )
}
