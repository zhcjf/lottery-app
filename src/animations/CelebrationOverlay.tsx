import { motion } from 'framer-motion'
import type { Participant, Prize } from '@/types'
import { Confetti, ArtName } from './RevealView'

// ═══ 庆祝覆盖层：叠加在动画上方，展示中奖结果 ═══
// 每个动画在自己的上下文中完成揭晓后，此组件在顶部叠加祝贺信息
export function CelebrationOverlay({ winners, prize }: { winners: Participant[]; prize: Prize }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-start">
      <Confetti color={prize.color} />
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="mt-[3vh] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 250, damping: 12 }}
          style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', filter: `drop-shadow(0 0 20px ${prize.color})`, color: prize.color }}
        >
          ★
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 700 }}
          className="text-foreground"
        >
          恭喜中奖
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-1 text-muted-foreground"
          style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}
        >
          {prize.name} · 共 {winners.length} 位
        </motion.div>
      </motion.div>
    </div>
  )
}
