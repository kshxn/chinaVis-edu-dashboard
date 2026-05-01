let filterOptionsCache = null
let trendDataCache = null

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`加载数据失败: ${path}`)
  }
  return response.json()
}

export async function getFilterOptions() {
  if (!filterOptionsCache) {
    filterOptionsCache = await loadJson('/data/filterOptions.json')
  }

  return {
    majors: filterOptionsCache.majors || [],
    sexes: filterOptionsCache.sexes || [],
    knowledges: filterOptionsCache.knowledges || [],
    classes: filterOptionsCache.classes || []
  }
}

function buildFilterKey(filters) {
  return [
    filters.major || 'all',
    filters.sex || 'all',
    filters.knowledge || 'all',
    filters.className || 'all'
  ].join('|')
}

function normalizeFilters(filters = {}) {
  return {
    major: filters.major || 'all',
    sex: filters.sex || 'all',
    knowledge: filters.knowledge || 'all',
    className: filters.className || 'all'
  }
}

function sumTrendRows(rows) {
  return rows.reduce(
    (total, item) => total + (item.correct || 0) + (item.partial || 0) + (item.error || 0),
    0
  )
}

function summarizeRows(rows) {
  const summary = rows.reduce(
    (total, item) => ({
      correct: total.correct + (item.correct || 0),
      partial: total.partial + (item.partial || 0),
      error: total.error + (item.error || 0),
      activeWeeks: total.activeWeeks + (sumTrendRows([item]) > 0 ? 1 : 0)
    }),
    { correct: 0, partial: 0, error: 0, activeWeeks: 0 }
  )

  const total = summary.correct + summary.partial + summary.error
  return {
    ...summary,
    total,
    correctRate: total === 0 ? 0 : summary.correct / total,
    nonErrorRate: total === 0 ? 0 : (summary.correct + summary.partial) / total
  }
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits))
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function getRows(filters = {}) {
  const key = buildFilterKey(normalizeFilters(filters))
  return trendDataCache[key] || []
}

function getCoverage(filters, knowledges) {
  if (filters.knowledge !== 'all') {
    return sumTrendRows(getRows(filters)) > 0 ? 100 : 0
  }

  const covered = knowledges.filter((knowledge) => (
    sumTrendRows(getRows({ ...filters, knowledge })) > 0
  )).length

  return knowledges.length === 0 ? 0 : (covered / knowledges.length) * 100
}

function getMomentum(rows) {
  if (rows.length < 2) return 50

  const midpoint = Math.floor(rows.length / 2)
  const early = summarizeRows(rows.slice(0, midpoint))
  const late = summarizeRows(rows.slice(midpoint))
  return clamp(50 + (late.correctRate - early.correctRate) * 100)
}

function getRadarValues(filters, options, globalWeeklyAverage) {
  const normalized = normalizeFilters(filters)
  const rows = getRows(normalized)
  const summary = summarizeRows(rows)
  const averageWeekly = rows.length === 0 ? 0 : summary.total / rows.length

  return [
    round(summary.correctRate * 100),
    round(summary.nonErrorRate * 100),
    round(clamp((averageWeekly / globalWeeklyAverage) * 100)),
    round(getCoverage(normalized, options.knowledges || [])),
    round(rows.length === 0 ? 0 : (summary.activeWeeks / rows.length) * 100),
    round(getMomentum(rows))
  ]
}

function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

async function ensureTrendData() {
  if (!trendDataCache) {
    trendDataCache = await loadJson('/data/trendData.json')
  }
  return trendDataCache
}

async function ensureFilterOptions() {
  if (!filterOptionsCache) {
    filterOptionsCache = await loadJson('/data/filterOptions.json')
  }
  return filterOptionsCache
}

function getTrendRows(filters) {
  const key = buildFilterKey(filters)
  return trendDataCache[key] || []
}

function pearsonCorrelation(left, right) {
  const length = Math.min(left.length, right.length)
  if (length === 0) return 0

  const leftMean = left.reduce((sum, value) => sum + value, 0) / length
  const rightMean = right.reduce((sum, value) => sum + value, 0) / length

  let numerator = 0
  let leftDenominator = 0
  let rightDenominator = 0

  for (let i = 0; i < length; i += 1) {
    const leftDelta = left[i] - leftMean
    const rightDelta = right[i] - rightMean
    numerator += leftDelta * rightDelta
    leftDenominator += leftDelta * leftDelta
    rightDenominator += rightDelta * rightDelta
  }

  const denominator = Math.sqrt(leftDenominator * rightDenominator)
  return denominator === 0 ? 0 : numerator / denominator
}

export async function getTrendData(filters) {
  await ensureTrendData()

  const key = buildFilterKey(normalizeFilters(filters))
  return trendDataCache[key] || trendDataCache['all|all|all|all'] || []
}

export async function getRadarData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()
  const normalized = normalizeFilters(filters)
  const globalRows = getRows()
  const globalSummary = summarizeRows(globalRows)
  const globalWeeklyAverage = globalRows.length === 0
    ? 1
    : Math.max(1, globalSummary.total / globalRows.length)

  const series = [
    {
      key: buildFilterKey(normalized),
      name: '当前筛选',
      filters: normalized
    }
  ]

  if (normalized.major !== 'all') {
    const baselineFilters = { ...normalized, sex: 'all', knowledge: 'all', className: 'all' }
    series.push({
      key: buildFilterKey(baselineFilters),
      name: `${normalized.major} 基准`,
      filters: baselineFilters
    })
  }

  series.push({
    key: buildFilterKey({}),
    name: '全体基准',
    filters: {}
  })

  const uniqueSeries = series.filter((item, index, list) => (
    list.findIndex((candidate) => candidate.key === item.key) === index
  ))

  return {
    indicators: [
      { name: '正确率', max: 100 },
      { name: '非错误率', max: 100 },
      { name: '提交强度', max: 100 },
      { name: '知识覆盖', max: 100 },
      { name: '活跃持续', max: 100 },
      { name: '后期提升', max: 100 }
    ],
    students: uniqueSeries.map((item) => ({
      name: item.name,
      values: getRadarValues(item.filters, options, globalWeeklyAverage)
    }))
  }
}

export async function getHeatmapData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()
  const normalized = normalizeFilters(filters)
  const knowledges = normalized.knowledge === 'all'
    ? options.knowledges || []
    : [normalized.knowledge]
  const weeks = options.weeks || []
  const data = []
  let max = 0

  weeks.forEach((week, weekIndex) => {
    knowledges.forEach((knowledge, knowledgeIndex) => {
      const rows = getRows({ ...normalized, knowledge })
      const row = rows.find((item) => item.week === week)
      const value = row ? sumTrendRows([row]) : 0
      max = Math.max(max, value)
      data.push([weekIndex, knowledgeIndex, value])
    })
  })

  return { weeks, knowledges, data, max }
}

export async function getScatterData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()
  const normalized = normalizeFilters(filters)

  let dimension = 'className'
  let values = options.classes || []
  let label = '班级'

  if (normalized.className !== 'all' && normalized.major === 'all') {
    dimension = 'major'
    values = options.majors || []
    label = '专业'
  } else if (normalized.className !== 'all' && normalized.major !== 'all' && normalized.knowledge === 'all') {
    dimension = 'knowledge'
    values = options.knowledges || []
    label = '知识点'
  } else if (
    normalized.className !== 'all' &&
    normalized.major !== 'all' &&
    normalized.knowledge !== 'all' &&
    normalized.sex === 'all'
  ) {
    dimension = 'sex'
    values = options.sexes || []
    label = '性别'
  }

  const points = values.map((value) => {
    const pointFilters = { ...normalized, [dimension]: value }
    const summary = summarizeRows(getRows(pointFilters))
    return {
      label: value,
      total: summary.total,
      correctRate: round(summary.correctRate * 100),
      partial: summary.partial,
      error: summary.error
    }
  }).filter((point) => point.total > 0)

  const totalThreshold = median(points.map((point) => point.total))
  const rateThreshold = median(points.map((point) => point.correctRate))
  const groups = [
    { name: '高量高准', students: [] },
    { name: '高量低准', students: [] },
    { name: '低量高准', students: [] },
    { name: '低量低准', students: [] }
  ]

  points.forEach((point) => {
    const highVolume = point.total >= totalThreshold
    const highQuality = point.correctRate >= rateThreshold
    const groupIndex = highVolume && highQuality
      ? 0
      : highVolume
        ? 1
        : highQuality
          ? 2
          : 3

    groups[groupIndex].students.push([
      point.total,
      point.correctRate,
      point.label,
      point.partial,
      point.error
    ])
  })

  return {
    dimensionLabel: label,
    thresholds: {
      total: round(totalThreshold, 0),
      correctRate: round(rateThreshold)
    },
    xMax: Math.max(10, Math.ceil(Math.max(...points.map((point) => point.total), 0) * 1.12)),
    groups
  }
}

export async function getKnowledgeScaleData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()
  const normalized = normalizeFilters(filters)
  const knowledges = normalized.knowledge === 'all'
    ? options.knowledges || []
    : [normalized.knowledge]

  return knowledges.map((knowledge) => {
    const summary = summarizeRows(getRows({ ...normalized, knowledge }))
    return {
      knowledge,
      correct: summary.correct,
      partial: summary.partial,
      error: summary.error,
      total: summary.total,
      correctRate: round(summary.correctRate * 100)
    }
  }).filter((item) => item.total > 0)
}

export async function getMajorClassSankeyData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()

  const majors = filters.major === 'all' || !filters.major
    ? options.majors || []
    : [filters.major]
  const classes = filters.className === 'all' || !filters.className
    ? options.classes || []
    : [filters.className]

  const links = []
  let total = 0

  majors.forEach((major) => {
    classes.forEach((className) => {
      const rows = getTrendRows({
        major,
        sex: filters.sex || 'all',
        knowledge: filters.knowledge || 'all',
        className
      })
      const value = sumTrendRows(rows)

      if (value > 0) {
        total += value
        links.push({
          source: major,
          target: className,
          value
        })
      }
    })
  })

  const nodes = Array.from(
    new Set(links.flatMap((link) => [link.source, link.target]))
  ).map((name) => ({ name }))

  return { nodes, links, total }
}

export async function getKnowledgeChordData(filters = {}) {
  await ensureTrendData()
  const options = await ensureFilterOptions()
  const knowledges = options.knowledges || []

  const nodes = knowledges.map((knowledge) => {
    const rows = getTrendRows({
      major: filters.major || 'all',
      sex: filters.sex || 'all',
      knowledge,
      className: filters.className || 'all'
    })

    return {
      id: knowledge,
      name: knowledge,
      total: sumTrendRows(rows),
      vector: rows.map((item) => (item.correct || 0) + (item.partial || 0) + (item.error || 0))
    }
  })

  const links = []
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const correlation = pearsonCorrelation(nodes[i].vector, nodes[j].vector)
      if (correlation > 0.2) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          value: Number(correlation.toFixed(3)),
          correlation: Number(correlation.toFixed(3))
        })
      }
    }
  }

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.name,
      total: node.total
    })),
    links
  }
}
