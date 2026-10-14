import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import { useLotteryStore, getEligiblePool, MODE_OPTIONS } from '@/store/useLotteryStore'
import type { LotteryMode } from '@/store/useLotteryStore'
import { drawWinners, createWinnerRecords } from '@/lib/lottery'
import type { Participant, WinnerRecord } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Play, Square, ArrowRight, Undo2, Maximize, Minimize,
  AlertTriangle, Sparkles, Trophy, History, X,
  Settings, ListChecks, Eye, RotateCcw, Zap, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANIMATIONS, ANIMATION_COMPONENTS, DEFAULT_ANIMATION } from '@/animations'

export default function LotteryPage() {
  return <LotteryScreen />
}

const CEREMONY_TEXTS: Record<string, { prompt: string; sub: string }> = {
  idle:    { prompt: '准备就绪', sub: '点击屏幕中央开始开奖' },
  preview: { prompt: '预览模式', sub: '点击屏幕停止预览' },
  countdown: { prompt: '即将开奖', sub: '请全场安静，目光聚焦大屏' },
  rolling: { prompt: '正在抽取', sub: '点击屏幕任意位置停止' },
  revealing: { prompt: '揭晓时刻', sub: '结果即将呈现' },
  done:    { prompt: '恭喜中奖', sub: '点击屏幕继续' },
  allDone: { prompt: '抽奖结束', sub: '所有奖项已揭晓' },
}

function LotteryScreen() {
  const store = useLotteryStore()
  const {
    prizes, participants, winners, currentPrizeIndex, phase, roundCounter,
    mode, previewMode,
    setCurrentPrizeIndex, setPhase, setMode, setPreviewMode,
    addWinners, undoLastRound, endSession,
  } = store

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([])
  const [showWinners, setShowWinners] = useState(false)
  const [animationId, setAnimationId] = useState(DEFAULT_ANIMATION)
  const [showAnimSelector, setShowAnimSelector] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [clickTrigger, setClickTrigger] = useState(0) // 砸金蛋用：每次点击递增
  const lastClickRef = useRef(0) // 防重复点击
  const containerRef = useRef<HTMLDivElement>(null)

  const currentPrize = prizes[currentPrizeIndex]
  const eligiblePool = currentPrize
    ? getEligiblePool(currentPrize, participants, winners)
    : []
  const AnimationComponent = ANIMATION_COMPONENTS[animationId] || ANIMATION_COMPONENTS[DEFAULT_ANIMATION]

  const hasWinners = winners.length > 0
  const drawnPrizeIds = new Set(winners.map((w) => w.prizeId))

  // ── 自动全屏 ──
  const enterFullscreen = async () => {
    try { if (containerRef.current?.requestFullscreen) { await containerRef.current.requestFullscreen(); setIsFullscreen(true) } } catch {}
  }
  const exitFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen() } catch {}
    setIsFullscreen(false)
  }

  // ── 正式开始：倒计时后滚动 ──
  const startWithCountdown = () => {
    if (eligiblePool.length === 0) return
    setShowAnimSelector(false)
    setShowModeSelector(false)
    setPreviewMode(false)
    setPhase('idle')
    setCountdown(3)
  }

  // ── 预览：全流程但不记录 ──
  const startPreview = () => {
    if (eligiblePool.length === 0) return
    setShowAnimSelector(false)
    setShowModeSelector(false)
    setPreviewMode(true)
    setShowWinners(false)
    setCountdown(3)
  }

  // ── 倒计时 ──
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
        if (countdown === 1) { enterFullscreen(); setPhase('rolling'); setShowWinners(false) }
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // ── 停止揭晓 ──
  const stopAndReveal = () => {
    if (previewMode) {
      // 预览模式：抽取假中奖者展示但不记录
      setPhase('revealing')
      const fakeDrawn = drawWinners(eligiblePool, currentPrize.count)
      setCurrentWinners(fakeDrawn)
      // 砸金蛋预览也用自动模式（不交互）
      setTimeout(() => { setShowWinners(true); setPhase('done') }, 3500)
      return
    }
    setPhase('revealing')
    const drawn = drawWinners(eligiblePool, currentPrize.count)
    setCurrentWinners(drawn)
    const records = createWinnerRecords(currentPrize, drawn, roundCounter + 1)
    addWinners(records)
    // 砸金蛋/发牌：不设超时，由动画自行回调 done
    if (animationId !== 'golden-egg' && animationId !== 'deal-cards') {
      setTimeout(() => { setShowWinners(true); setPhase('done') }, 3500)
    }
  }

  // ── 砸金蛋完成回调 ──
  const handleAnimComplete = () => {
    setShowWinners(true)
    setPhase('done')
  }

  // ── 点击屏幕主区域 ──
  const handleStageClick = () => {
    // 防重复点击：500ms 内只响应一次
    const now = Date.now()
    if (now - lastClickRef.current < 500) return
    lastClickRef.current = now

    if (phase === 'idle' && countdown === 0 && !previewMode) {
      startWithCountdown()
    } else if (phase === 'rolling') {
      stopAndReveal()
    } else if (phase === 'revealing' && animationId === 'golden-egg') {
      // 砸金蛋：每次点击砸一个蛋
      setClickTrigger((c) => c + 1)
    } else if (phase === 'done' && previewMode) {
      // 预览结束
      setPhase('idle'); setShowWinners(false); setCurrentWinners([])
      setPreviewMode(false)
      if (isFullscreen) exitFullscreen()
    } else if (phase === 'done' && !previewMode) {
      goNext()
    }
  }

  // ── 下一轮 ──
  const goNext = () => {
    if (previewMode) {
      setPhase('idle'); setShowWinners(false); setCurrentWinners([])
      setPreviewMode(false)
      if (isFullscreen) exitFullscreen()
      return
    }
    if (currentPrizeIndex < prizes.length - 1) {
      setCurrentPrizeIndex(currentPrizeIndex + 1)
      setPhase('idle'); setShowWinners(false); setCurrentWinners([])
    }
  }

  // ── 跳转到指定奖项（自由模式）──
  const jumpToPrize = (index: number) => {
    setCurrentPrizeIndex(index)
    setPhase('idle'); setShowWinners(false); setCurrentWinners([])
    setShowHistory(false)
  }

  // ── 撤销 ──
  const handleUndo = () => {
    undoLastRound(); setPhase('idle'); setShowWinners(false); setCurrentWinners([])
  }

  // ── 重置（保留已抽记录）──
  const handleEndSession = () => {
    if (!confirm('结束本轮抽奖？已抽出的中奖记录将保留，可前往记录页查看。')) return
    endSession()
    setShowWinners(false); setCurrentWinners([])
    if (isFullscreen) exitFullscreen()
  }

  const allDone = !previewMode && currentPrizeIndex >= prizes.length - 1 && phase === 'done'
  useEffect(() => {
    if (allDone && isFullscreen) {
      const timer = setTimeout(() => exitFullscreen(), 2000)
      return () => clearTimeout(timer)
    }
  }, [allDone])

  // ── 键盘 ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (countdown === 0 && phase === 'idle') startWithCountdown()
        else if (phase === 'rolling') stopAndReveal()
      } else if (e.code === 'ArrowRight' && phase === 'done') goNext()
      else if (e.code === 'Escape' && isFullscreen) exitFullscreen()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isFullscreen, countdown])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // ── 空状态 ──
  if (prizes.length === 0 || participants.length === 0) {
    return (
      <div ref={containerRef} className="flex min-h-screen flex-col items-center justify-center bg-background">
        <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">请先完成配置</h2>
        <p className="mt-1 text-sm text-muted-foreground">需要至少一个奖项和一份名单才能开始开奖</p>
        <Link to="/" className="mt-4 inline-block"><Button>前往配置</Button></Link>
      </div>
    )
  }

  const insufficient = eligiblePool.length < currentPrize.count
  const currentAnim = ANIMATIONS.find((a) => a.id === animationId)
  const ceremonyKey = previewMode ? 'preview' : allDone ? 'allDone' : phase
  const ceremony = CEREMONY_TEXTS[ceremonyKey] || CEREMONY_TEXTS.idle
  // 滚动/揭晓时不显示奖项名称，只在中奖后显示
  const showPrizeName = phase === 'done' || phase === 'idle'

  return (
    <div ref={containerRef} className={cn('relative flex min-h-screen flex-col bg-background overflow-hidden')}>
      {/* ═══ 炫彩背景光效 ═══ */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ opacity: phase === 'rolling' ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2], scale: phase === 'revealing' ? [1, 1.4, 1] : [1, 1.15, 1] }}
          transition={{ duration: phase === 'rolling' ? 0.8 : 5, repeat: Infinity }}
          className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
          style={{ background: `radial-gradient(circle, ${currentPrize.color}40, transparent 60%)` }}
        />
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute -left-40 top-1/4 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #F472B6, transparent 70%)' }}
        />
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute -right-40 bottom-1/4 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #34D399, transparent 70%)' }}
        />
      </div>

      {/* ═══ 预览模式水印 ═══ */}
      {previewMode && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <div className="rounded-full border-2 border-warning/40 bg-warning/10 px-8 py-2 text-lg font-bold text-warning" style={{ transform: 'rotate(-15deg)' }}>
            预览模式 · 不会实际抽取
          </div>
        </div>
      )}

      {/* ═══ 顶部栏 ═══ */}
      <div className="relative z-30 flex items-center justify-between border-b border-border/20 px-4 py-2.5 backdrop-blur-md sm:px-6">
        {/* 左侧：导航 + 轮次 */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">配置</span>
          </Link>
          <Link to="/records" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">记录</span>
          </Link>
          <div className="h-4 w-px bg-border/30" />
          {/* 奖项进度链 */}
          <div className="flex items-center gap-1">
            {prizes.map((p, i) => (
              <button key={p.id} onClick={() => mode === 'free' && phase === 'idle' && jumpToPrize(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-all',
                  i === currentPrizeIndex ? 'text-primary' : drawnPrizeIds.has(p.id) ? 'text-success' : 'text-muted-foreground/50',
                  mode === 'free' && phase === 'idle' ? 'cursor-pointer hover:bg-secondary/30' : ''
                )}
                style={{ background: i === currentPrizeIndex ? `${currentPrize.color}20` : 'transparent' }}
              >
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: drawnPrizeIds.has(p.id) ? p.color : i === currentPrizeIndex ? p.color : '#475569' }} />
                <span className="hidden md:inline">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center gap-1.5">
          {hasWinners && (
            <button onClick={() => setShowHistory(!showHistory)}
              className={cn('flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                showHistory ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{winners.length} 人</span>
            </button>
          )}
          <button onClick={() => setShowModeSelector(!showModeSelector)}
            className={cn('flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors',
              showModeSelector ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {mode === 'sequential' ? <Layers className="h-4 w-4" /> : mode === 'rapid' ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            <span className="hidden sm:inline">{MODE_OPTIONS.find(m => m.id === mode)?.name}</span>
          </button>
          <button onClick={() => {
            // 仅在 idle 阶段允许切换动画选择器，避免 rolling/revealing/done 阶段误触
            // 导致进入 idle 后面板自动弹出
            if (phase === 'idle' && countdown === 0) setShowAnimSelector(!showAnimSelector)
            else setShowAnimSelector(false)
          }}
            className={cn('flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors',
              showAnimSelector && phase === 'idle' && countdown === 0 ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{currentAnim?.name}</span>
          </button>
          {phase === 'done' && !allDone && !previewMode && (
            <Button size="sm" variant="ghost" onClick={handleUndo}><Undo2 className="h-4 w-4" /> 撤销</Button>
          )}
          {hasWinners && (
            <button onClick={handleEndSession}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-destructive/70 transition-colors hover:text-destructive hover:bg-destructive/10">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">结束</span>
            </button>
          )}
          <button onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ═══ 模式选择面板 ═══ */}
      <AnimatePresence>
        {showModeSelector && phase === 'idle' && countdown === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="relative z-30 overflow-hidden border-b border-border/20 bg-card/60 backdrop-blur-md">
            <div className="px-6 py-4">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">抽奖模式</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {MODE_OPTIONS.map((m) => (
                  <button key={m.id} onClick={() => { setMode(m.id as LotteryMode); setShowModeSelector(false) }}
                    className={cn('flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all',
                      mode === m.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-secondary/20 hover:border-primary/40')}>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {m.id === 'sequential' ? <Layers className="h-4 w-4" /> : m.id === 'rapid' ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 动画选择面板 ═══ */}
      <AnimatePresence>
        {showAnimSelector && phase === 'idle' && countdown === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="relative z-30 overflow-hidden border-b border-border/20 bg-card/60 backdrop-blur-md">
            <div className="px-6 py-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">选择开奖动画</span>
                <span className="text-xs text-muted-foreground">{ANIMATIONS.length} 种风格</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {ANIMATIONS.map((anim) => (
                  <button key={anim.id} onClick={() => { setAnimationId(anim.id); setShowAnimSelector(false) }}
                    className={cn('flex flex-col items-center gap-1 rounded-lg border p-3 transition-all',
                      animationId === anim.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-secondary/20 hover:border-primary/40')}>
                    <span className="text-2xl">{anim.icon}</span>
                    <span className={cn('text-xs font-medium', animationId === anim.id ? 'text-primary' : 'text-foreground')}>{anim.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 历史侧边栏 ═══ */}
      <AnimatePresence>
        {showHistory && hasWinners && (
          <HistoryPanel winners={winners} prizes={prizes} onClose={() => setShowHistory(false)} onJump={jumpToPrize} />
        )}
      </AnimatePresence>

      {/* ═══ 主舞台（点击区域） ═══ */}
      <div
        className="relative z-10 flex flex-1 cursor-pointer flex-col"
        onClick={handleStageClick}
      >
        {/* 仪式文案区 —— 滚动时隐藏奖项名 */}
        <div className="px-6 pt-5 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={ceremonyKey} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4 }}>
              {/* 奖项标题：仅在中奖后或空闲时显示 */}
              {showPrizeName && (
                <motion.div className="text-5xl font-bold sm:text-6xl"
                  style={{ color: currentPrize.color, textShadow: `0 0 40px ${currentPrize.color}50, 0 0 80px ${currentPrize.color}20` }}>
                  {currentPrize.name}
                </motion.div>
              )}
              <div className="mt-2 text-xl font-medium text-foreground">{ceremony.prompt}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{ceremony.sub}</div>
              {showPrizeName && (
                <div className="mt-1 text-sm text-muted-foreground/70">
                  可参与 {eligiblePool.length} 人 · 抽取 {currentPrize.count} 人
                  {drawnPrizeIds.has(currentPrize.id) && <span className="ml-2 text-success">· 已抽过</span>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 倒计时 */}
        <AnimatePresence>
          {countdown > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-[180px] font-bold leading-none" style={{ color: currentPrize.color, textShadow: `0 0 60px ${currentPrize.color}60` }}>
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 动画渲染区 */}
        <div className="flex flex-1 items-center justify-center px-6 py-4">
          {phase === 'idle' && countdown === 0 && !insufficient && !previewMode && (
            <div className="flex flex-col items-center gap-6 py-10">
              {/* 主屏开始按钮 */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); startWithCountdown() }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 rounded-2xl px-10 py-5 text-xl font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${currentPrize.color}, ${currentPrize.color}90)`,
                  boxShadow: `0 0 40px ${currentPrize.color}50, 0 8px 24px rgba(0,0,0,0.4)`,
                }}
              >
                <Play className="h-6 w-6" />
                开始开奖
              </motion.button>
              {/* 预览按钮 */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); startPreview() }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-6 py-3 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
                预览动画（不记录）
              </motion.button>
              <div className="text-sm text-muted-foreground/60">
                自动全屏 · 空格键 开始/停止 · → 下一轮 · Esc 退出全屏
              </div>
              {mode === 'free' && <div className="text-xs text-primary">自由模式：可点击上方奖项进度条切换</div>}
            </div>
          )}

          {phase === 'idle' && countdown === 0 && insufficient && (
            <div className="py-16 text-center text-2xl text-warning">
              可参与人数（{eligiblePool.length}）不足抽取人数（{currentPrize.count}）
            </div>
          )}

          {(phase === 'rolling' || phase === 'revealing' || phase === 'done') && (
            <Suspense fallback={<div className="py-20 text-center text-muted-foreground">加载动画中...</div>}>
              <div className="relative w-full">
                <AnimationComponent pool={eligiblePool} winners={currentWinners} prize={currentPrize}
                  phase={phase} clickTrigger={clickTrigger} onComplete={handleAnimComplete} />
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══ 历史面板组件 ═══
function HistoryPanel({
  winners, prizes, onClose, onJump,
}: {
  winners: WinnerRecord[]
  prizes: import('@/types').Prize[]
  onClose: () => void
  onJump: (index: number) => void
}) {
  const grouped = winners.reduce<Record<number, WinnerRecord[]>>((acc, w) => {
    if (!acc[w.round]) acc[w.round] = []
    acc[w.round].push(w)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-12 z-40 h-[calc(100%-3rem)] w-80 border-l border-border/30 bg-card/80 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-foreground">已抽中奖</span>
          <span className="text-xs text-muted-foreground">{winners.length} 人</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="h-[calc(100%-3rem)] overflow-y-auto p-4">
        {Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([round, records]) => {
          const prizeIdx = prizes.findIndex(p => p.id === records[0]?.prizeId)
          return (
            <div key={round} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full" style={{ background: records[0]?.prizeColor }} />
                <span className="text-xs font-medium text-muted-foreground">第 {round} 轮 · {records[0]?.prizeName}</span>
                {prizeIdx >= 0 && (
                  <button onClick={() => onJump(prizeIdx)} className="ml-auto text-xs text-primary hover:underline">跳转</button>
                )}
              </div>
              <div className="space-y-1.5">
                {records.map(w => (
                  <div key={w.id} className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/20 px-3 py-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: `${w.prizeColor}20`, color: w.prizeColor }}>{w.participantName.charAt(0)}</div>
                    <span className="text-sm text-foreground">{w.participantName}</span>
                    {w.department && <span className="text-xs text-muted-foreground">{w.department}</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
