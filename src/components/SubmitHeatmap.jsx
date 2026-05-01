import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

function SubmitHeatmap({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.data.length === 0) return

    const chart = echarts.init(chartRef.current)

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        formatter: (p) =>
          `${data.weeks[p.data[0]]} · ${data.knowledges[p.data[1]]}<br/>提交量: <b>${p.data[2]}</b>`
      },
      grid: { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis: {
        type: 'category',
        data: data.weeks,
        splitArea: { show: true },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#475569' } }
      },
      yAxis: {
        type: 'category',
        data: data.knowledges,
        splitArea: { show: true },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        axisLine: { lineStyle: { color: '#475569' } }
      },
      visualMap: {
        min: 0,
        max: Math.max(1, data.max || 0),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        inRange: { color: ['#0f172a', '#1d4ed8', '#38bdf8', '#7dd3fc'] }
      },
      series: [
        {
          type: 'heatmap',
          data: data.data,
          label: { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(56,189,248,0.5)' } }
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

  if (!data || data.data.length === 0) {
    return <div className="chart-placeholder">当前筛选条件下无知识点提交</div>
  }

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

export default SubmitHeatmap
