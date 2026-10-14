import { useState, useRef } from 'react'
import { useLotteryStore, getEligiblePool } from '@/store/useLotteryStore'
import {
  parsePastedTable,
  parseFromURL,
  parseFileRaw,
  applyColumnMapping,
  guessColumnMapping,
  downloadTemplate,
  type RawTableData,
  type FieldType,
} from '@/lib/lottery'
import type { Prize, PrizeLevel } from '@/types'
import { PageShell } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  Upload,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ClipboardPaste,
  Link2,
  Loader2,
  Palette,
  Pencil,
  X,
  Download,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SetupPage() {
  return (
    <PageShell>
      <div className="space-y-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">活动配置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            配置奖项等级与名单，准备好后前往「开奖」页面
          </p>
        </div>
        <PrizeLevelManager />
        <PrizeConfig />
        <NameListManager />
        <ReadinessCheck />
      </div>
    </PageShell>
  )
}

// ═══ 奖项等级管理模块（可自定义） ═══
function PrizeLevelManager() {
  const { prizeLevels, addPrizeLevel, updatePrizeLevel, removePrizeLevel } =
    useLotteryStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            奖项等级
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            自定义等级
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {prizeLevels.map((level) => (
            <div
              key={level.id}
              className="group flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2"
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: level.color }}
              />
              {editId === level.id ? (
                <LevelEditForm
                  level={level}
                  onSave={(patch) => {
                    updatePrizeLevel(level.id, patch)
                    setEditId(null)
                  }}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">
                    {level.name}
                  </span>
                  <button
                    onClick={() => setEditId(level.id)}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    编辑
                  </button>
                  {prizeLevels.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`删除等级「${level.name}」？已使用该等级的奖项需重新设置。`)) {
                          removePrizeLevel(level.id)
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {showForm && (
          <LevelAddForm
            onAdd={(level) => {
              addPrizeLevel(level)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          共 {prizeLevels.length} 个等级，添加奖项时从中选择。可自定义任意等级名称和颜色。
        </p>
      </CardContent>
    </Card>
  )
}

// 等级添加表单
function LevelAddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (level: Omit<PrizeLevel, 'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')

  return (
    <div className="mt-3 flex items-end gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          等级名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：六等奖"
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          颜色
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-16 rounded-md border border-input bg-background"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button
          size="sm"
          onClick={() => name.trim() && onAdd({ name: name.trim(), color })}
          disabled={!name.trim()}
        >
          添加
        </Button>
      </div>
    </div>
  )
}

// 等级内联编辑
function LevelEditForm({
  level,
  onSave,
  onCancel,
}: {
  level: PrizeLevel
  onSave: (patch: Partial<PrizeLevel>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(level.name)
  const [color, setColor] = useState(level.color)

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-6 w-10 rounded border border-input"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-24 rounded border border-input bg-background px-2 py-0.5 text-sm text-foreground"
        autoFocus
      />
      <button
        onClick={() => onSave({ name: name.trim(), color })}
        className="text-xs text-primary hover:underline"
      >
        保存
      </button>
      <button onClick={onCancel} className="text-xs text-muted-foreground">
        取消
      </button>
    </div>
  )
}

// ═══ 奖项配置模块 ═══
function PrizeConfig() {
  const { prizes, addPrize, removePrize, updatePrize, reorderPrizes } =
    useLotteryStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const movePrize = (index: number, dir: -1 | 1) => {
    const newOrder = [...prizes]
    const target = index + dir
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    reorderPrizes(newOrder)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            奖项配置
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
            添加奖项
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <PrizeForm
            onAdd={(prize) => {
              addPrize(prize)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {prizes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Award className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              还没有奖项，点击「添加奖项」开始配置
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prizes.map((prize, index) =>
              editingId === prize.id ? (
                <PrizeEditForm
                  key={prize.id}
                  prize={prize}
                  onSave={(patch) => {
                    updatePrize(prize.id, patch)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => movePrize(index, -1)}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <button
                      onClick={() => movePrize(index, 1)}
                      disabled={index === prizes.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 奖项色标 */}
                  <div
                    className="h-10 w-1.5 rounded-full"
                    style={{ background: prize.color }}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {prize.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: `${prize.color}20`,
                          color: prize.color,
                        }}
                      >
                        {prize.count} 人
                      </span>
                      {prize.allowRepeat && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                          允许重复
                        </span>
                      )}
                      {prize.scope === 'group' && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                          仅 {prize.scopeGroup}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      参与范围：
                      {prize.scope === 'all' ? '全部人员' : `仅「${prize.scopeGroup}」分组`}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingId(prize.id)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removePrize(prize.id)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 奖项添加表单
function PrizeForm({
  onAdd,
  onCancel,
}: {
  onAdd: (prize: Omit<Prize, 'id'>) => void
  onCancel: () => void
}) {
  const { participants, prizeLevels } = useLotteryStore()
  const groups = [...new Set(participants.map((p) => p.group).filter(Boolean))]

  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [levelId, setLevelId] = useState(prizeLevels[0]?.id || '')
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [scope, setScope] = useState<'all' | 'group'>('all')
  const [scopeGroup, setScopeGroup] = useState('')

  const selectedLevel = prizeLevels.find((l) => l.id === levelId)

  const handleSubmit = () => {
    if (!name.trim() || !selectedLevel) return
    onAdd({
      name: name.trim(),
      count,
      allowRepeat,
      scope,
      scopeGroup: scope === 'group' ? scopeGroup : undefined,
      levelId,
      color: selectedLevel.color,
    })
  }

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            奖项名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：一等奖"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            抽取人数
          </label>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            奖项等级
          </label>
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {prizeLevels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            参与范围
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'all' | 'group')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">全部人员</option>
            {groups.map((g) => (
              <option key={g} value="group">
                仅「{g}」
              </option>
            ))}
          </select>
        </div>
        {scope === 'group' && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              指定分组
            </label>
            <select
              value={scopeGroup}
              onChange={(e) => setScopeGroup(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">选择分组</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allowRepeat}
              onChange={(e) => setAllowRepeat(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            允许重复中奖
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          确认添加
        </Button>
      </div>
    </div>
  )
}

// 奖项内联编辑表单
function PrizeEditForm({
  prize,
  onSave,
  onCancel,
}: {
  prize: Prize
  onSave: (patch: Partial<Prize>) => void
  onCancel: () => void
}) {
  const { participants, prizeLevels } = useLotteryStore()
  const groups = [...new Set(participants.map((p) => p.group).filter(Boolean))]

  const [name, setName] = useState(prize.name)
  const [count, setCount] = useState(prize.count)
  const [levelId, setLevelId] = useState(prize.levelId)
  const [allowRepeat, setAllowRepeat] = useState(prize.allowRepeat)
  const [scope, setScope] = useState<'all' | 'group'>(prize.scope)
  const [scopeGroup, setScopeGroup] = useState(prize.scopeGroup || '')

  const selectedLevel = prizeLevels.find((l) => l.id === levelId)

  const handleSubmit = () => {
    if (!name.trim() || !selectedLevel) return
    onSave({
      name: name.trim(),
      count,
      allowRepeat,
      scope,
      scopeGroup: scope === 'group' ? scopeGroup : undefined,
      levelId,
      color: selectedLevel.color,
    })
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            奖项名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            抽取人数
          </label>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            奖项等级
          </label>
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {prizeLevels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            参与范围
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'all' | 'group')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">全部人员</option>
            {groups.map((g) => (
              <option key={g} value="group">
                仅「{g}」
              </option>
            ))}
          </select>
        </div>
        {scope === 'group' && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              指定分组
            </label>
            <select
              value={scopeGroup}
              onChange={(e) => setScopeGroup(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">选择分组</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allowRepeat}
              onChange={(e) => setAllowRepeat(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            允许重复中奖
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          保存
        </Button>
      </div>
    </div>
  )
}

// ═══ 名单管理模块 ═══
function NameListManager() {
  const {
    participants,
    addParticipant,
    addParticipants,
    removeParticipant,
    clearParticipants,
  } = useLotteryStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [rawData, setRawData] = useState<RawTableData | null>(null)
  const [colMapping, setColMapping] = useState<Record<number, FieldType>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  // 统计
  const groups = participants.reduce<Record<string, number>>((acc, p) => {
    const g = p.group || '未分组'
    acc[g] = (acc[g] || 0) + 1
    return acc
  }, {})

  // 检测重名
  const nameCounts = participants.reduce<Record<string, number>>((acc, p) => {
    acc[p.name] = (acc[p.name] || 0) + 1
    return acc
  }, {})
  const duplicateNames = Object.entries(nameCounts)
    .filter(([, count]) => count > 1)
    .map(([name]) => name)

  // 过滤显示
  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const reportImport = (added: number, total: number) => {
    const skipped = total - added
    const dedupMsg = skipped > 0 ? `（${skipped} 人因重名自动去重跳过）` : '（已自动去重）'
    setImportMsg(`成功导入 ${added} 人${dedupMsg}`)
    setTimeout(() => setImportMsg(''), 4000)
  }

  const handlePasteImport = () => {
    const parsed = parsePastedTable(pasteText)
    if (parsed.length === 0) return
    const added = addParticipants(parsed)
    setPasteText('')
    setShowPasteArea(false)
    reportImport(added, parsed.length)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const raw = await parseFileRaw(file)
      if (raw.totalRows === 0) {
        setImportMsg('文件中未检测到有效数据')
        setTimeout(() => setImportMsg(''), 4000)
      } else {
        const guessed = guessColumnMapping(raw.headers, raw.hasHeader)
        setRawData(raw)
        setColMapping(guessed)
      }
    } catch (err) {
      setImportMsg(`导入失败：${(err as Error).message}`)
      setTimeout(() => setImportMsg(''), 4000)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleMappedImport = () => {
    if (!rawData) return
    const parsed = applyColumnMapping(rawData, colMapping)
    if (parsed.length === 0) {
      setImportMsg('请至少保留一列作为姓名')
      setTimeout(() => setImportMsg(''), 4000)
      return
    }
    // 新上传自动覆盖旧名单
    clearParticipants()
    const added = addParticipants(parsed)
    reportImport(added, parsed.length)
    setRawData(null)
    setColMapping({})
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return
    setImporting(true)
    try {
      const parsed = await parseFromURL(urlInput.trim())
      if (parsed.length === 0) {
        setImportMsg('未从链接中解析到有效数据，请确认链接为公开可访问的表格文件')
        setTimeout(() => setImportMsg(''), 4000)
      } else {
        const added = addParticipants(parsed)
        reportImport(added, parsed.length)
      }
      setUrlInput('')
      setShowUrlInput(false)
    } catch (err) {
      setImportMsg(
        `导入失败：${(err as Error).message}。注意：仅支持公开可访问的链接，内网文档请复制后粘贴导入`
      )
      setTimeout(() => setImportMsg(''), 6000)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            名单管理
            {participants.length > 0 && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-sm font-medium text-primary">
                {participants.length} 人
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4" />
              下载模板
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <Link2 className="h-4 w-4" />
              在线文档
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPasteArea(!showPasteArea)}
            >
              <ClipboardPaste className="h-4 w-4" />
              粘贴导入
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              上传文件
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4" />
              手动添加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 导入结果提示 */}
        {importMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="text-sm text-primary">{importMsg}</div>
          </div>
        )}

        {/* 列映射预览（上传文件后展示） */}
        {rawData && (
          <ColumnMappingPreview
            raw={rawData}
            mapping={colMapping}
            onMappingChange={setColMapping}
            onConfirm={handleMappedImport}
            onCancel={() => {
              setRawData(null)
              setColMapping({})
            }}
          />
        )}

        {/* 在线文档 URL 导入 */}
        {showUrlInput && (
          <div className="mb-4 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">
              粘贴公开可访问的表格链接（CSV / Excel 文件直链、Google Sheets 发布链接），自动解析导入
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/xxx/export?format=csv"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              />
              <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleUrlImport} disabled={!urlInput.trim() || importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : '导入'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70">
              注意：内网文档（docs.corp.kuaishou.com）需登录认证，请改用「粘贴导入」
            </p>
          </div>
        )}

        {/* 统计面板 */}
        {participants.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(groups).map(([group, count]) => (
              <div
                key={group}
                className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/30 px-3 py-1.5"
              >
                <span className="text-xs text-muted-foreground">{group}</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 重名警告 */}
        {duplicateNames.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
            <div className="text-sm text-warning">
              检测到重名：{duplicateNames.join('、')}。已自动按姓名+分组去重，如需区分请在「分组」字段标注。
            </div>
          </div>
        )}

        {/* 粘贴导入区 */}
        {showPasteArea && (
          <div className="mb-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              从 Excel 或在线表格复制单元格，粘贴到下方（格式：姓名 / 部门 / 分组，用 Tab 分隔）
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'张三\t技术部\t新员工\n李四\t产品部\t管理层\n王五\t设计部\t新员工'}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowPasteArea(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handlePasteImport} disabled={!pasteText.trim()}>
                确认导入
              </Button>
            </div>
          </div>
        )}

        {/* 手动添加表单 */}
        {showAddForm && (
          <InlineAddForm
            onAdd={(p) => {
              addParticipant(p)
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* 名单列表 */}
        {participants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              名单为空，支持上传 Excel/CSV、粘贴表格、在线文档链接导入
            </p>
          </div>
        ) : (
          <>
            {/* 搜索栏 */}
            <div className="mb-3 flex items-center justify-between">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索姓名..."
                className="w-64 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => {
                  if (confirm('确定清空全部名单？此操作不可撤销。')) {
                    clearParticipants()
                  }
                }}
                className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
                清空
              </button>
            </div>

            {/* 名单表格 */}
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      姓名
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      部门
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      分组
                    </th>
                    <th className="w-12 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-accent/30"
                    >
                      <td className="px-4 py-2 text-sm text-foreground">
                        {p.name}
                        {nameCounts[p.name] > 1 && (
                          <span className="ml-1 text-xs text-warning">
                            ×{nameCounts[p.name]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {p.department || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {p.group ? (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {p.group}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => removeParticipant(p.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// 内联添加人员表单
function InlineAddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (p: Omit<import('@/types').Participant, 'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [group, setGroup] = useState('')

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          姓名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="必填"
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          部门
        </label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="选填"
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          分组
        </label>
        <input
          type="text"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="选填"
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={() => name.trim() && onAdd({ name: name.trim(), department: department.trim() || undefined, group: group.trim() || undefined })} disabled={!name.trim()}>
          添加
        </Button>
      </div>
    </div>
  )
}

// ═══ 列映射预览组件 ═══
const FIELD_OPTIONS: { value: FieldType; label: string; color: string }[] = [
  { value: 'keep', label: '保留', color: 'text-success' },
  { value: 'ignore', label: '不保留', color: 'text-muted-foreground' },
]

function ColumnMappingPreview({
  raw,
  mapping,
  onMappingChange,
  onConfirm,
  onCancel,
}: {
  raw: RawTableData
  mapping: Record<number, FieldType>
  onMappingChange: (mapping: Record<number, FieldType>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const previewRows = raw.rows.slice(0, 5)
  const keptCount = Object.values(mapping).filter((v) => v === 'keep').length

  return (
    <div className="mb-4 space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">列映射</span>
          <span className="text-sm text-muted-foreground">
            共 {raw.totalRows} 行数据 · 检测到 {raw.headers.length} 列
          </span>
        </div>
        <button
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 说明 */}
      <p className="text-xs text-muted-foreground">
        选择需要保留的列，系统会自动按顺序将保留的列映射为
        <span className="mx-1 text-primary">姓名</span>→
        <span className="mx-1 text-success">部门</span>→
        <span className="mx-1 text-warning">分组</span>，多余列将被忽略；内容会自动去重。
      </p>

      {/* 列映射下拉选择 */}
      <div className="flex flex-wrap gap-3">
        {raw.headers.map((header, colIdx) => {
          const fieldType = mapping[colIdx] || 'ignore'
          const fieldOption = FIELD_OPTIONS.find((f) => f.value === fieldType)!
          return (
            <div
              key={colIdx}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">
                列 {colIdx + 1}
              </span>
              <span className="text-sm font-medium text-foreground">
                {header || '(空)'}
              </span>
              <select
                value={fieldType}
                onChange={(e) => {
                  const newType = e.target.value as FieldType
                  onMappingChange({ ...mapping, [colIdx]: newType })
                }}
                className={cn(
                  'rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20',
                  fieldOption.color
                )}
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* 数据预览表格 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-card">
            <tr className="border-b border-border">
              {raw.headers.map((header, colIdx) => {
                const fieldType = mapping[colIdx] || 'ignore'
                const fieldOption = FIELD_OPTIONS.find((f) => f.value === fieldType)!
                return (
                  <th
                    key={colIdx}
                    className="border-r border-border/50 px-3 py-2 text-left"
                  >
                    <div className="text-xs text-muted-foreground">
                      {header || `列 ${colIdx + 1}`}
                    </div>
                    <div className={cn('text-xs font-medium', fieldOption.color)}>
                      → {fieldOption.label}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border/30">
                {raw.headers.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn(
                      'border-r border-border/30 px-3 py-2 text-sm',
                      mapping[colIdx] === 'keep'
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {row[colIdx] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {raw.totalRows > 5 && (
        <p className="text-xs text-muted-foreground">
          仅显示前 5 行预览，共 {raw.totalRows} 行将被导入
        </p>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={keptCount === 0}>
          <ArrowRight className="h-4 w-4" />
          确认导入 {raw.totalRows} 行
        </Button>
      </div>
    </div>
  )
}

// ═══ 就绪检查模块 ═══
function ReadinessCheck() {
  const { prizes, participants, winners } = useLotteryStore()

  const checks = [
    {
      label: '至少配置一个奖项',
      pass: prizes.length > 0,
    },
    {
      label: '名单不为空',
      pass: participants.length > 0,
    },
    {
      label: '每个奖项可参与人数 ≥ 抽取人数',
      pass: prizes.every((prize) => {
        const pool = getEligiblePool(prize, participants, winners)
        return pool.length >= prize.count
      }),
    },
  ]

  const allPass = checks.every((c) => c.pass)

  return (
    <Card className={cn(allPass ? 'border-success/30' : 'border-border')}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.pass ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    check.pass ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          <div
            className={cn(
              'rounded-lg px-4 py-3 text-center',
              allPass ? 'bg-success/10' : 'bg-secondary/30'
            )}
          >
            <div
              className={cn(
                'text-lg font-bold',
                allPass ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {allPass ? '准备就绪' : '未就绪'}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {allPass ? '可前往开奖' : '请完成上述检查项'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
