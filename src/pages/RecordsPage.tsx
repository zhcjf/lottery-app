import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { useLotteryStore } from '@/store/useLotteryStore'
import { winnersToCSV, downloadText } from '@/lib/lottery'
import type { WinnerRecord } from '@/types'
import { PageShell } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Download, Copy, Trash2, Inbox, ChevronDown, ChevronUp,
  Clock, Users, Trophy, ArrowLeft, Award,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PrizeGroup {
  prizeId: string
  prizeName: string
  prizeColor: string
  winners: WinnerRecord[]
}

interface SessionGroup {
  session: number
  winners: WinnerRecord[]
  prizeGroups: PrizeGroup[]
}

export default function RecordsPage() {
  const { winners, prizes, clearWinners, deleteSession } = useLotteryStore()
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const sessionKey = (w: WinnerRecord) => w.session ?? w.round

  // ═══ 按场次分组；场内再按奖项分组 ═══
  const sessions = useMemo<SessionGroup[]>(() => {
    const bySession: Record<number, WinnerRecord[]> = {}
    winners.forEach((w) => {
      const key = sessionKey(w)
      if (!bySession[key]) bySession[key] = []
      bySession[key].push(w)
    })

    return Object.entries(bySession)
      .map(([session, records]) => {
        // 场内按奖项分组
        const groups: Record<string, PrizeGroup> = {}
        records.forEach((w) => {
          if (!groups[w.prizeId]) {
            groups[w.prizeId] = { prizeId: w.prizeId, prizeName: w.prizeName, prizeColor: w.prizeColor, winners: [] }
          }
          groups[w.prizeId].winners.push(w)
        })
        // 按奖项配置顺序排序
        const prizeGroups = Object.values(groups).sort((a, b) => {
          const aIdx = prizes.findIndex((p) => p.id === a.prizeId)
          const bIdx = prizes.findIndex((p) => p.id === b.prizeId)
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
        })
        return { session: Number(session), winners: records, prizeGroups }
      })
      .sort((a, b) => b.session - a.session) // 最新场次在上
  }, [winners, prizes])

  const totalPeople = new Set(winners.map((w) => w.participantName)).size

  const handleExport = (records: WinnerRecord[], name: string) => {
    const csv = winnersToCSV(records)
    downloadText(csv, `${name}_${new Date().toLocaleDateString('zh-CN')}.csv`)
  }

  const handleCopy = () => {
    const text = winners.map((w) => `${w.prizeName}：${w.participantName}${w.department ? `（${w.department}）` : ''}`).join('\n')
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${formatTime(ts)}`
  }

  return (
    <PageShell>
      <div className="space-y-4 pt-4">
        {/* 顶部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">中奖记录</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              共 {sessions.length} 场 · {winners.length} 人次 · {totalPeople} 位中奖者
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /> 返回</Button></Link>
            {winners.length > 0 && (
              <>
                <Button size="sm" variant="ghost" onClick={handleCopy}><Copy className="h-4 w-4" /> 复制</Button>
                <Button size="sm" variant="ghost" onClick={() => handleExport(winners, '中奖名单')}><Download className="h-4 w-4" /> 导出全部</Button>
                <Button size="sm" variant="ghost"
                  onClick={() => { if (confirm('确定清空全部中奖记录？此操作不可撤销。')) clearWinners() }}>
                  <Trash2 className="h-4 w-4" /> 清空
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 空状态 */}
        {winners.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-dashed border-border py-16 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">还没有中奖记录</p>
                <Link to="/lottery" className="mt-4 inline-block"><Button size="sm">前往开奖</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ═══ 按场次展示：每场内的一二三等奖合并在一起 ═══ */
          sessions.map((s) => {
            const isCollapsed = collapsed[s.session]
            const firstTime = Math.min(...s.winners.map((w) => w.timestamp))
            const headColor = s.prizeGroups[0]?.prizeColor || '#FBBF24'
            return (
              <Card key={s.session} className="overflow-hidden">
                {/* 场次头部 */}
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [s.session]: !isCollapsed }))}
                  className="flex w-full items-center justify-between border-b border-border/30 px-5 py-4 text-left transition-colors hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${headColor}30, ${headColor}10)`, border: `1.5px solid ${headColor}50` }}
                    >
                      <Trophy className="h-5 w-5" style={{ color: headColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">第 {s.session} 场</span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${headColor}15`, color: headColor }}>
                          {s.prizeGroups.length} 个奖项
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.winners.length} 人次</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(firstTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={(e) => { e.stopPropagation(); handleExport(s.winners, `第${s.session}场中奖名单`) }}
                      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Download className="h-3.5 w-3.5" /> 导出
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`删除第 ${s.session} 场的全部中奖记录（${s.winners.length} 人次）？`)) deleteSession(s.session)
                      }}
                      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 删除
                    </span>
                    <div className="text-muted-foreground">
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                {/* 场内所有奖项合并展示 */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-5 px-5 py-5">
                        {s.prizeGroups.map((group) => (
                          <div key={group.prizeId}>
                            {/* 奖项标题 */}
                            <div className="mb-2.5 flex items-center gap-2">
                              <div className="h-4 w-1 rounded-full" style={{ background: group.prizeColor }} />
                              <span className="text-sm font-medium text-foreground">{group.prizeName}</span>
                              <span className="text-xs text-muted-foreground">{group.winners.length} 人</span>
                            </div>

                            {/* 中奖者网格 */}
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {group.winners.map((w, i) => (
                                <motion.div
                                  key={w.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="flex items-center gap-3 rounded-lg border border-border/30 p-3"
                                  style={{ background: `${group.prizeColor}08` }}
                                >
                                  <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                                    style={{ background: `${group.prizeColor}20`, color: group.prizeColor, border: `1px solid ${group.prizeColor}40` }}
                                  >
                                    {i + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium text-foreground">{w.participantName}</div>
                                    <div className="truncate text-xs text-muted-foreground">{w.department || '未标注部门'}</div>
                                  </div>
                                  <div className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">{formatTime(w.timestamp)}</div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })
        )}

        {/* 底部汇总 */}
        {winners.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-warning" />
                    <span className="text-sm text-muted-foreground">汇总</span>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground">场次</div>
                      <div className="text-lg font-bold text-foreground tabular-nums">{sessions.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">总人次</div>
                      <div className="text-lg font-bold text-foreground tabular-nums">{winners.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">中奖者</div>
                      <div className="text-lg font-bold text-foreground tabular-nums">{totalPeople}</div>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleExport(winners, '中奖名单')}><Download className="h-4 w-4" /> 导出全部</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
