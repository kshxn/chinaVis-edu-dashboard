import { useMemo, useState } from 'react'

const COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#f59e0b', '#f87171', '#22d3ee', '#c084fc', '#facc15']

function polarPoint(cx, cy, radius, angle) {
  const adjusted = angle - Math.PI / 2
  return {
    x: cx + Math.cos(adjusted) * radius,
    y: cy + Math.sin(adjusted) * radius
  }
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarPoint(cx, cy, radius, endAngle)
  const end = polarPoint(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function ribbonPath(cx, cy, radius, source, target) {
  const s0 = polarPoint(cx, cy, radius, source.startAngle)
  const s1 = polarPoint(cx, cy, radius, source.endAngle)
  const t0 = polarPoint(cx, cy, radius, target.startAngle)
  const t1 = polarPoint(cx, cy, radius, target.endAngle)
  const sourceLargeArc = source.endAngle - source.startAngle > Math.PI ? 1 : 0
  const targetLargeArc = target.endAngle - target.startAngle > Math.PI ? 1 : 0

  return [
    `M ${s0.x} ${s0.y}`,
    `A ${radius} ${radius} 0 ${sourceLargeArc} 1 ${s1.x} ${s1.y}`,
    `C ${cx} ${cy} ${cx} ${cy} ${t0.x} ${t0.y}`,
    `A ${radius} ${radius} 0 ${targetLargeArc} 1 ${t1.x} ${t1.y}`,
    `C ${cx} ${cy} ${cx} ${cy} ${s0.x} ${s0.y}`,
    'Z'
  ].join(' ')
}

function buildLayout(data) {
  const cx = 260
  const cy = 140
  const outerRadius = 104
  const ribbonRadius = 78
  const gap = 0.045
  const totalNodeWeight = data.nodes.reduce((sum, node) => sum + Math.max(node.total, 1), 0)
  const angleBudget = Math.PI * 2 - gap * data.nodes.length
  let cursor = 0

  const nodes = data.nodes.map((node, index) => {
    const span = angleBudget * (Math.max(node.total, 1) / totalNodeWeight)
    const layoutNode = {
      ...node,
      color: COLORS[index % COLORS.length],
      startAngle: cursor,
      endAngle: cursor + span,
      midAngle: cursor + span / 2
    }
    cursor += span + gap
    return layoutNode
  })

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const incidentWeight = new Map(nodes.map((node) => [node.id, 0]))
  data.links.forEach((link) => {
    incidentWeight.set(link.source, incidentWeight.get(link.source) + link.value)
    incidentWeight.set(link.target, incidentWeight.get(link.target) + link.value)
  })

  const segmentCursor = new Map(nodes.map((node) => [node.id, node.startAngle]))
  const linkSegments = new Map()

  data.links.forEach((link) => {
    const sourceNode = nodeMap.get(link.source)
    const targetNode = nodeMap.get(link.target)
    const endpointNodes = [sourceNode, targetNode]

    endpointNodes.forEach((node) => {
      const total = incidentWeight.get(node.id) || 1
      const nodeSpan = node.endAngle - node.startAngle
      const segmentSpan = Math.max(0.01, nodeSpan * (link.value / total))
      const startAngle = segmentCursor.get(node.id)
      const endAngle = Math.min(node.endAngle, startAngle + segmentSpan)
      segmentCursor.set(node.id, endAngle)
      linkSegments.set(`${link.source}|${link.target}|${node.id}`, { startAngle, endAngle })
    })
  })

  const ribbons = data.links.map((link) => {
    const sourceNode = nodeMap.get(link.source)
    return {
      ...link,
      color: sourceNode.color,
      sourceSegment: linkSegments.get(`${link.source}|${link.target}|${link.source}`),
      targetSegment: linkSegments.get(`${link.source}|${link.target}|${link.target}`)
    }
  })

  return { cx, cy, outerRadius, ribbonRadius, nodes, ribbons }
}

function isNodeActive(active, nodeId) {
  if (!active) return true
  return active.type === 'node'
    ? active.id === nodeId
    : active.source === nodeId || active.target === nodeId
}

function isRibbonActive(active, ribbon) {
  if (!active) return true
  return active.type === 'node'
    ? ribbon.source === active.id || ribbon.target === active.id
    : ribbon.source === active.source && ribbon.target === active.target
}

function KnowledgeChordChart({ data }) {
  const [active, setActive] = useState(null)
  const layout = useMemo(() => {
    if (!data || data.nodes.length === 0 || data.links.length === 0) return null
    return buildLayout(data)
  }, [data])

  if (!layout) {
    return <div className="chart-placeholder">当前筛选条件下无知识点相关性</div>
  }

  const activeLabel = active?.type === 'node'
    ? `${active.id} · ${active.total.toLocaleString()} 次提交`
    : active
      ? `${active.source} ↔ ${active.target} · r=${active.correlation}`
      : 'Hover to inspect'

  return (
    <div className="chord-wrap" onMouseLeave={() => setActive(null)}>
      <svg className="chord-svg" viewBox="0 0 520 280" role="img" aria-label="知识点相关性和弦图">
        <g>
          {layout.ribbons.map((ribbon) => (
            <path
              key={`${ribbon.source}-${ribbon.target}`}
              d={ribbonPath(layout.cx, layout.cy, layout.ribbonRadius, ribbon.sourceSegment, ribbon.targetSegment)}
              fill={ribbon.color}
              opacity={isRibbonActive(active, ribbon) ? 0.48 : 0.08}
              className="chord-ribbon"
              onMouseEnter={() => setActive({ type: 'ribbon', ...ribbon })}
            >
              <title>{`${ribbon.source} ↔ ${ribbon.target}: r=${ribbon.correlation}`}</title>
            </path>
          ))}
        </g>

        <g>
          {layout.nodes.map((node) => {
            const labelPoint = polarPoint(layout.cx, layout.cy, layout.outerRadius + 18, node.midAngle)
            return (
              <g
                key={node.id}
                className="chord-node"
                opacity={isNodeActive(active, node.id) ? 1 : 0.32}
                onMouseEnter={() => setActive({ type: 'node', ...node })}
              >
                <path
                  d={arcPath(layout.cx, layout.cy, layout.outerRadius, node.startAngle, node.endAngle)}
                  stroke={node.color}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={labelPoint.x < layout.cx ? 'end' : 'start'}
                  dominantBaseline="middle"
                >
                  {node.name}
                </text>
                <title>{`${node.name}: ${node.total.toLocaleString()} 次提交`}</title>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="chord-center">{activeLabel}</div>
    </div>
  )
}

export default KnowledgeChordChart
