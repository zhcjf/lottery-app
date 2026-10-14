import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnimationProps } from './types'
import { ArtName, fluidName, VIBRANT } from './RevealView'

export default function ParticleVortex({ pool, winners, prize, phase }: AnimationProps) {
  const isDone = phase === 'done'
  const isReveal = phase === 'revealing'

  // 生成粒子数据
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      name: pool[i % pool.length]?.name || '',
      color: VIBRANT[i % VIBRANT.length],
      angle: Math.random() * 360,
      radius: 80 + Math.random() * 300,
      speed: 2 + Math.random() * 4, // seconds per rotation
      delay: Math.random() * 2,
      size: 0.7 + Math.random() * 1.2,
    }))
  }, [pool])

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* 中心光晕 - 持续存在 */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute rounded-full"
        style={{
          width: 'clamp(12rem, 35vh, 18rem)',
          height: 'clamp(12rem, 35vh, 18rem)',
          background: `radial-gradient(circle, ${prize.color}30, transparent 65%)`,
        }}
      />

      {/* 漩涡粒子层 - rolling/revealing 时显示，done 时淡出 */}
      <AnimatePresence>
        {!isDone && particles.map(p => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0 }}
            animate={isReveal
              ? { opacity: 0, scale: 0.3, x: 0, y: 0 }
              : {
                  opacity: [0, 0.8, 0.8, 0.3],
                  x: Math.cos(p.angle * Math.PI / 180) * p.radius,
                  y: Math.sin(p.angle * Math.PI / 180) * p.radius * 0.5,
                  rotate: 360,
                }
            }
            exit={{ opacity: 0, scale: 0 }}
            transition={isReveal
              ? { duration: 1.5, delay: p.delay * 0.3 }
              : {
                  duration: p.speed,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: p.delay,
                }
            }
            className="absolute font-semibold"
            style={{
              color: p.color,
              fontSize: `${p.size}rem`,
              textShadow: `0 0 10px ${p.color}60`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {p.name}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* ═══ done 阶段：恭喜标题 + 中奖名字逐个弹出 ═══ */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-[18vh]"
          >
            {/* 恭喜标题 - 顶部，不与名字重叠 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              className="text-center"
            >
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.8rem)',
                fontWeight: 800,
                color: prize.color,
                filter: `drop-shadow(0 0 20px ${prize.color})`,
              }}>
                🌀 恭喜中奖 🌀
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{prize.name} · 共 {winners.length} 位</div>
            </motion.div>

            {/* 中奖名字 - 居中逐个弹出 */}
            <div className="mt-8 flex flex-col items-center gap-4">
              {winners.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ scale: 0, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.25, type: 'spring', stiffness: 200, damping: 12 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: `${prize.color}25`, color: prize.color, border: `1.5px solid ${prize.color}50` }}>
                    {i + 1}
                  </div>
                  <ArtName name={w.name} color={prize.color} accentColor={VIBRANT[i % VIBRANT.length]} sizeVw={4} minRem={1.2} maxRem={2.5} maxWidth="50vw" />
                </motion.div>
              ))}
            </div>

            {/* 底部光效脉冲 */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-[20%] rounded-full"
              style={{
                width: 'clamp(10rem, 30vw, 16rem)',
                height: 'clamp(10rem, 30vw, 16rem)',
                background: `radial-gradient(circle, ${prize.color}25, transparent 65%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
