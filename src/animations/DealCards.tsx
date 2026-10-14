import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnimationProps } from './types'
import { VIBRANT } from './RevealView'

const SUITS = ['♠', '♥', '♦', '♣']
const SUIT_COLORS: Record<string, string> = { '♠': '#CBD5E1', '♥': '#F87171', '♦': '#FB923C', '♣': '#34D399' }

// 放大后的卡牌基础尺寸
const CARD_W = 'clamp(5.5rem, 14vw, 8.5rem)'
const CARD_H = 'clamp(7.7rem, 19.6vw, 11.9rem)'
const CARD_WVW = 14   // vw 基准宽
const CARD_HVW = 19.6 // vw 基准高

interface Card {
  id: number
  name: string
  suit: string
  slot: number
  flipped: boolean
}

export default function DealCards({ pool, winners, prize, phase, onComplete }: AnimationProps) {
  const isDone = phase === 'done'
  const isReveal = phase === 'revealing'
  const isRolling = phase === 'rolling'
  const idRef = useRef(0)

  const [cards, setCards] = useState<Card[]>([])
  const cardCount = winners.length || prize.count || 1

  // rolling 阶段：2 秒内逐张发牌
  useEffect(() => {
    if (isRolling) {
      setCards([])
      const count = prize.count || 1
      const perCard = Math.max(80, Math.min(500, 2000 / count))
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          setCards(prev => [...prev, {
            id: idRef.current++,
            name: '',
            suit: SUITS[i % 4],
            slot: i,
            flipped: false,
          }])
        }, i * perCard)
      }
    }
  }, [isRolling, prize.count])

  // revealing：替换真实名字 + 逐张翻开，最后一张翻完立即回调 done
  useEffect(() => {
    if (isReveal && winners.length > 0) {
      setCards(prev => prev.map((c, i) => ({ ...c, name: winners[i]?.name || c.name })))
      winners.forEach((_, i) => {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.slot === i ? { ...c, flipped: true } : c))
        }, i * 150)
      })
      // 最后一张翻完后短暂等待（让翻牌动画可见），然后立即进入 done
      const flipDuration = winners.length * 150 + 350
      setTimeout(() => {
        onComplete?.()
      }, flipDuration)
    }
  }, [isReveal, winners, onComplete])

  // done：全部翻开
  useEffect(() => {
    if (isDone) {
      setCards(prev => prev.map(c => ({ ...c, flipped: true })))
    }
  }, [isDone])

  // 横向排列步长
  const stepVw = cardCount <= 1 ? 0 : Math.min(CARD_WVW + 4, 88 / cardCount)
  // done 阶段适度放大，间距同步
  const doneScale = 1.5
  const doneStepVw = cardCount <= 1 ? 0 : Math.min(CARD_WVW * doneScale + 5, 92 / cardCount)

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ perspective: 1400 }}>
      {/* 牌桌背景 */}
      <div className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${prize.color}12, #0F0A1E 70%)` }} />

      {/* 牌堆（左上角）—— rolling 阶段显示 */}
      {isRolling && (
        <div className="absolute left-6 top-6 z-10">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
            {[3, 2, 1, 0].map(o => (
              <div key={o}
                className="absolute flex items-center justify-center rounded-lg"
                style={{
                  width: 'clamp(4rem, 9vw, 5.5rem)',
                  height: 'clamp(5.6rem, 12.6vw, 7.7rem)',
                  background: 'linear-gradient(135deg, #2D1B4E, #1A0F2E)',
                  border: `1.5px solid ${prize.color}50`,
                  boxShadow: `${o * 1.5}px ${o * 1.5}px 8px rgba(0,0,0,0.4)`,
                  top: -o * 2, left: -o * 2, zIndex: 4 - o,
                }}>
                <span style={{ color: `${prize.color}60`, fontSize: '1.5rem' }}>✦</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ═══ 牌：rolling 发出 → revealing 翻开 → done 放大，始终居中 ═══ */}
      <AnimatePresence>
        {cards.map(card => {
          const isFlipped = card.flipped
          const curStep = isDone ? doneStepVw : stepVw
          const xVw = (card.slot - (cardCount - 1) / 2) * curStep
          const scale = isDone ? doneScale : 1

          return (
            <motion.div
              key={card.id}
              initial={{ x: '-60vw', y: '-40vh', opacity: 0, scale: 0.3, rotate: -20 }}
              animate={{
                x: `${xVw}vw`,
                y: isDone ? '-12vh' : '0vh',
                opacity: 1,
                scale,
                rotate: 0,
              }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={isDone
                ? { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }
                : { duration: 0.5, type: 'spring', stiffness: 140, damping: 18 }}
              className="absolute"
              style={{
                width: CARD_W,
                height: CARD_H,
                left: '50%', top: '50%',
                marginLeft: '-clamp(2.75rem, 7vw, 4.25rem)',
                marginTop: '-clamp(3.85rem, 9.8vw, 5.95rem)',
                zIndex: isFlipped ? 15 : 5,
              }}
            >
              {/* 牌背 */}
              <motion.div
                animate={{ opacity: isFlipped ? 0 : 1, scale: isFlipped ? 0.7 : 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #2D1B4E, #1A0F2E)',
                  border: `1.5px solid ${prize.color}50`,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
                }}
              >
                <span style={{ color: `${prize.color}70`, fontSize: '1.5rem' }}>✦</span>
              </motion.div>

              {/* 牌面 */}
              <motion.div
                animate={{ opacity: isFlipped ? 1 : 0, scale: isFlipped ? 1 : 0.7 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #1A0F2E, #2D1B4E)',
                  border: `2px solid ${prize.color}`,
                  boxShadow: `0 0 30px ${prize.color}60`,
                  overflow: 'hidden',
                  padding: '4px',
                  containerType: 'inline-size',
                }}
              >
                <span style={{ color: SUIT_COLORS[card.suit], fontSize: 'clamp(0.8rem, 1.6vw, 1.2rem)' }}>{card.suit}</span>
                <CardName name={card.name} prizeColor={prize.color} />
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ═══ done 阶段：恭喜标题（底部）+ 彩纸 ═══ */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-start pointer-events-none"
            style={{ paddingTop: '10vh' }}
          >
            {/* 恭喜标题 —— 顶部，不与卡牌重叠 */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: prize.color, filter: `drop-shadow(0 0 20px ${prize.color})` }}>
                🃏 恭喜中奖 🃏
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{prize.name} · 共 {winners.length} 位</div>
            </motion.div>

            {/* 彩纸 */}
            {Array.from({ length: 25 }).map((_, i) => {
              const x = Math.random() * 100
              return (
                <motion.div key={i}
                  initial={{ x: `${x}%`, y: -20, opacity: 1 }}
                  animate={{ y: '110vh', opacity: [1, 1, 0], rotate: Math.random() * 360 }}
                  transition={{ duration: 2 + Math.random() * 2, delay: i * 0.06, ease: 'easeOut' }}
                  className="absolute"
                  style={{ width: 5, height: 7, background: VIBRANT[i % VIBRANT.length], borderRadius: 2 }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══ 卡牌名字：用 container query 单位，字号始终相对于实际卡牌宽度 ═══
function CardName({ name, prizeColor }: { name: string; prizeColor: string }) {
  if (!name) return null
  const nameLen = name.length

  // 用 cqi 单位（100cqi = 卡牌实际宽度）
  // 卡牌高/宽比 = 19.6/14 ≈ 1.4，所以高度 ≈ 140cqi
  // 可用文字区：宽 78cqi，高 70cqi（去掉花色和边距，保守值）
  const availW = 78   // cqi
  const availH = 70   // cqi
  const lineH = 1.15

  // 最优行数：使字号最大化
  const nOpt = Math.max(1, Math.round(Math.sqrt(nameLen * availH / (availW * lineH))))
  const fontSizeCqi = Math.min(availW / (nameLen / nOpt), availH / (nOpt * lineH))

  return (
    <span style={{
      color: '#F1F5F9',
      fontSize: `${fontSizeCqi}cqi`,
      fontWeight: 800,
      lineHeight: `${lineH}`,
      textAlign: 'center',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
      width: '78%',
      textShadow: `0 0 6px ${prizeColor}, 0 0 3px rgba(255,255,255,0.4)`,
    }}>
      {name}
    </span>
  )
}
