import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

function KnowledgeScaleBar({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    const chart = echarts.init(chartRef.current)
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const total = params.reduce((sum, item) => sum + item.value, 0)
          const rows = params.map((item) => `${item.marker}${item.seriesName}: <b>${item.value.toLocaleString()}</b>`)
          return `${params[0].axisValue}<br/>${rows.join('<br/>')}<br/>总提交: <b>${total.toLocaleString()}</b>`
        }
      },
      legend: {
        top: 0,
        textStyle: { color: '#cbd5e1', fontSize: 11 }
      },
      grid: { left: 46, right: 16, top: 36, bottom: 36 },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.knowledge),
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        {
          name: '完全正确',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 26,
          itemStyle: { color: '#38bdf8' },
          data: data.map((item) => item.correct)
        },
        {
          name: '部分正确',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 26,
          itemStyle: { color: '#f59e0b' },
          data: data.map((item) => item.partial)
        },
        {
          name: '错误',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 26,
          itemStyle: { color: '#f87171' },
          data: data.map((item) => item.error)
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

  if (!data || data.length === 0) {
    return <div className="chart-placeholder">当前筛选条件下无子知识标签提交</div>
  }

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

export default KnowledgeScaleBar
