import * as XLSX from 'xlsx'
import type { Prize, Participant, WinnerRecord } from '@/types'

// ═══ 抽奖核心逻辑 ═══

/**
 * Fisher-Yates 洗牌算法，返回打乱后的新数组
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 从参与池中随机抽取 n 个不重复的中奖者
 * @param pool 可参与的人员池
 * @param count 抽取人数
 * @returns 被抽中的人员列表
 */
export function drawWinners(
  pool: Participant[],
  count: number
): Participant[] {
  if (pool.length === 0) return []
  if (pool.length <= count) return [...pool]
  const shuffled = shuffle(pool)
  return shuffled.slice(0, count)
}

/**
 * 生成中奖记录
 */
export function createWinnerRecords(
  prize: Prize,
  winners: Participant[],
  round: number
): WinnerRecord[] {
  return winners.map((p) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    prizeId: prize.id,
    prizeName: prize.name,
    prizeColor: prize.color,
    participantId: p.id,
    participantName: p.name,
    department: p.department,
    timestamp: Date.now(),
    round,
  }))
}

/**
 * 导出中奖记录为 CSV
 */
export function winnersToCSV(winners: WinnerRecord[]): string {
  const header = '轮次,奖项,中奖人,部门,时间\n'
  const rows = winners
    .map((w) => {
      const time = new Date(w.timestamp).toLocaleString('zh-CN')
      return `${w.round},${w.prizeName},${w.participantName},${w.department || ''},${time}`
    })
    .join('\n')
  return '﻿' + header + rows // BOM 确保 Excel 正确识别 UTF-8
}

/**
 * 下载文本为文件
 */
export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ═══ 名单解析工具 ═══

/**
 * 解析粘贴的表格文本（从 Excel/在线表格 复制）
 * 智能识别分隔符：Tab、逗号、连续空格
 * 格式：姓名[部门][分组]
 */
export function parsePastedTable(text: string): Omit<Participant, 'id'>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  // 检测是否跳过表头
  const startIdx = lines[0]?.match(/^(姓名|名字|name|Name|序号|编号)/i) ? 1 : 0
  return lines.slice(startIdx).map((line) => {
    const cols = line.split(/\t|,|\s{2,}/).map((c) => c.trim())
    return {
      name: cols[0] || '',
      department: cols[1] || undefined,
      group: cols[2] || undefined,
    }
  })
}

/**
 * 解析 CSV 文本
 */
export function parseCSV(text: string): Omit<Participant, 'id'>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  const startIdx = lines[0]?.match(/^(姓名|名字|name|Name|序号|编号)/i) ? 1 : 0
  return lines.slice(startIdx).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    return {
      name: cols[0] || '',
      department: cols[1] || undefined,
      group: cols[2] || undefined,
    }
  })
}

/**
 * 解析 Excel 文件（.xlsx / .xls）
 * 从 ArrayBuffer 读取，返回参与人员列表
 */
export function parseExcel(buffer: ArrayBuffer): Omit<Participant, 'id'>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  // 取第一个工作表
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]

  // 转为 JSON 数组，header 设为 1（返回二维数组）
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  if (rows.length === 0) return []

  // 检测表头：如果第一行包含"姓名"/"名字"/"name"，跳过
  const firstRow = rows[0] as string[]
  const hasHeader = firstRow?.some((cell) =>
    String(cell || '').match(/^(姓名|名字|name|Name|序号|编号)/i)
  )
  const startIdx = hasHeader ? 1 : 0

  const result: Omit<Participant, 'id'>[] = []
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || row.length === 0) continue
    const name = String(row[0] || '').trim()
    if (!name) continue
    result.push({
      name,
      department: row[1] ? String(row[1]).trim() : undefined,
      group: row[2] ? String(row[2]).trim() : undefined,
    })
  }
  return result
}

/**
 * 智能解析表格数据（统一入口）
 * 根据文件类型自动选择解析方式
 */
export async function parseFile(file: File): Promise<Omit<Participant, 'id'>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const isExcel = ext === 'xlsx' || ext === 'xls'

  if (isExcel) {
    const buffer = await file.arrayBuffer()
    return parseExcel(buffer)
  }

  // CSV 或其他文本文件
  const text = await file.text()
  return parseCSV(text)
}

/**
 * 从在线 URL 导入表格数据
 * 支持：公开的 CSV/Excel 文件链接、Google Sheets 发布的 CSV
 */
export async function parseFromURL(url: string): Promise<Omit<Participant, 'id'>[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`无法获取文档内容（${response.status}）`)
  }

  const contentType = response.headers.get('content-type') || ''
  const blob = await response.blob()
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()

  // Excel 文件
  if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    contentType.includes('spreadsheet') ||
    contentType.includes('excel')
  ) {
    const buffer = await blob.arrayBuffer()
    return parseExcel(buffer)
  }

  // CSV / 文本
  const text = await blob.text()
  return parseCSV(text)
}

// ═══ 原始数据解析（用于列映射） ═══

/** 原始表格数据：保留所有列，供用户映射 */
export interface RawTableData {
  headers: string[] // 表头（可能为空，用「列1, 列2」兜底）
  rows: string[][] // 数据行（每行的每列值）
  totalRows: number
  hasHeader: boolean
}

/** 字段映射配置：保留 / 忽略 */
export type FieldType = 'keep' | 'ignore'

/** 智能猜测列映射：第一列保留，其余列根据是否有表头决定 */
function guessMapping(headers: string[], hasHeader: boolean): Record<number, FieldType> {
  const mapping: Record<number, FieldType> = {}
  headers.forEach((_, i) => {
    if (i === 0) {
      mapping[i] = 'keep'
    } else {
      mapping[i] = hasHeader ? 'keep' : 'ignore'
    }
  })
  return mapping
}

/** 智能猜测并返回推荐映射 */
export function guessColumnMapping(
  headers: string[],
  hasHeader = true
): Record<number, FieldType> {
  return guessMapping(headers, hasHeader)
}

/**
 * 解析文件为原始表格数据（保留所有列）
 * 用于上传后让用户选择列映射
 */
export async function parseFileRaw(file: File): Promise<RawTableData> {
  const ext = file.name.split('.').pop()?.split('?')[0]?.toLowerCase()
  const isExcel = ext === 'xlsx' || ext === 'xls'

  let rows: string[][] = []

  if (isExcel) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return { headers: [], rows: [], totalRows: 0, hasHeader: false }
    const sheet = workbook.Sheets[sheetName]
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    rows = rawRows.map((r) => (r as unknown[]).map((c) => String(c ?? '').trim()))
  } else {
    const text = await file.text()
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
    rows = lines.map((line) => {
      // 尝试逗号分割（CSV），也尝试 Tab 分割
      if (line.includes('\t')) return line.split('\t').map((c) => c.trim())
      if (line.includes(',')) return line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      return [line.trim()]
    })
  }

  if (rows.length === 0) return { headers: [], rows: [], totalRows: 0, hasHeader: false }

  // 不再尝试识别表头：第一行始终作为数据
  // 用「列 1, 列 2 ...」作为默认 header
  const firstRow = rows[0]
  const headers = firstRow.map((_, i) => `列 ${i + 1}`)

  const dataRows = rows
  // 过滤掉完全空行
  const filteredRows = dataRows.filter((r) => r.some((c) => c.trim() !== ''))

  return {
    headers,
    rows: filteredRows,
    totalRows: filteredRows.length,
    hasHeader: false,
  }
}

/**
 * 按用户指定的列映射，将原始数据转为参与人员。
 * 新规则：保留的列按顺序依次分配为 name → department → group，
 * 超出 3 列的保留列将被忽略。
 */
export function applyColumnMapping(
  raw: RawTableData,
  mapping: Record<number, FieldType>
): Omit<Participant, 'id'>[] {
  // 按列索引升序找出所有「保留」的列
  const keptCols = Object.entries(mapping)
    .filter(([, v]) => v === 'keep')
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)

  if (keptCols.length === 0) return []

  // 仅前 3 列保留分别映射为 name / department / group
  const nameIdx = keptCols[0]
  const deptIdx = keptCols[1] ?? -1
  const groupIdx = keptCols[2] ?? -1

  return raw.rows
    .map((row) => ({
      name: (row[nameIdx] || '').trim(),
      department: deptIdx >= 0 ? (row[deptIdx] || '').trim() || undefined : undefined,
      group: groupIdx >= 0 ? (row[groupIdx] || '').trim() || undefined : undefined,
    }))
    .filter((p) => p.name) // 过滤掉空姓名
}

/**
 * 下载名单模板 CSV
 * 表头可自定义：第一列为姓名（必选），其余列自由添加，上传后在列映射中指定用途
 */
export function downloadTemplate() {
  const content = '﻿姓名,部门,分组,备注（可自定义列名）\n张三,技术部,新员工,示例行可删除\n李四,产品部,管理层,\n王五,设计部,,\n赵六,运营部,普通员工,'
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '抽奖名单模板.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
