import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

function MajorClassSankey({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.links.length === 0) return

    const chart = echarts.init(chartRef.current)
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          if (p.dataType === 'edge') {
            return `${p.data.source} → ${p.data.target}<br/>提交量: <b>${p.data.value.toLocaleString()}</b>`
          }
          return `${p.name}<br/>关联提交流量`
        }
      },
      series: [
        {
          type: 'sankey',
          top: 10,
          left: 8,
          right: 24,
          bottom: 10,
          nodeWidth: 14,
          nodeGap: 8,
          nodeAlign: 'justify',
          draggable: true,
          data: data.nodes,
          links: data.links,
          emphasis: {
            focus: 'adjacency'
          },
          label: {
            color: '#cbd5e1',
            fontSize: 11
          },
          itemStyle: {
            borderColor: '#0f172a',
            borderWidth: 1
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: 0.42
          },
          levels: [
            {
              depth: 0,
              itemStyle: { color: '#38bdf8' },
              lineStyle: { color: 'source', opacity: 0.38 }
            },
            {
              depth: 1,
              itemStyle: { color: '#a78bfa' }
            }
          ]
        }
      ]
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [data])

  if (!data || data.links.length === 0) {
    return <div className="chart-placeholder">当前筛选条件下无专业到班级流量</div>
  }

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

export default MajorClassSankey
