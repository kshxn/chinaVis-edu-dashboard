import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

const QUADRANT_COLORS = ['#38bdf8', '#f59e0b', '#a78bfa', '#f87171']

function EfficiencyScatter({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data || !data.groups || data.groups.length === 0) return

    const chart = echarts.init(chartRef.current)
    const thresholdText = `${data.thresholds.total}次 / ${data.thresholds.correctRate}%`

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (p) => (
          `${p.data[2]} · ${p.seriesName}<br/>` +
          `提交次数: <b>${p.data[0].toLocaleString()}</b><br/>` +
          `正确率: <b>${p.data[1]}%</b><br/>` +
          `部分正确: ${p.data[3].toLocaleString()}<br/>` +
          `错误: ${p.data[4].toLocaleString()}<br/>` +
          `<small>四象限阈值: ${thresholdText}</small>`
        )
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#cbd5e1', fontSize: 11 }
      },
      grid: { left: 50, right: 20, top: 30, bottom: 50 },
      xAxis: {
        type: 'value',
        name: '提交次数',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#64748b' },
        min: 0,
        max: data.xMax,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        nameLocation: 'middle',
        nameGap: 36,
        nameTextStyle: { color: '#64748b' },
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8' }
      },
      // 象限分割线
      markLine: {},
      series: [
        // 象限背景参考线（竖线 x=60，横线 y=70）
        {
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#334155', type: 'dashed' },
            label: {
              color: '#94a3b8',
              formatter: ({ value }) => `${value}`
            },
            data: [
              { xAxis: data.thresholds.total },
              { yAxis: data.thresholds.correctRate }
            ]
          },
          data: []
        },
        ...data.groups.map((group, i) => ({
          name: group.name,
          type: 'scatter',
          symbolSize: (value) => Math.max(8, Math.min(22, Math.sqrt(value[0]) / 2.4)),
          itemStyle: { color: QUADRANT_COLORS[i], opacity: 0.85 },
          data: group.students
        }))
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

  if (!data || !data.groups || data.groups.every((group) => group.students.length === 0)) {
    return <div className="chart-placeholder">当前筛选条件下无效率散点数据</div>
  }

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

export default EfficiencyScatter
