import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

function TrendAreaChart({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    const chart = echarts.init(chartRef.current)

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        top: 0,
        textStyle: {
          color: '#cbd5e1'
        }
      },
      grid: {
        left: 40,
        right: 20,
        top: 40,
        bottom: 30
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.week),
        axisLine: {
          lineStyle: { color: '#475569' }
        },
        axisLabel: {
          color: '#cbd5e1'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: { color: '#475569' }
        },
        splitLine: {
          lineStyle: { color: '#1e293b' }
        },
        axisLabel: {
          color: '#cbd5e1'
        }
      },
      series: [
        {
          name: '完全正确',
          type: 'line',
          smooth: true,
          areaStyle: {},
          data: data.map((item) => item.correct)
        },
        {
          name: '部分正确',
          type: 'line',
          smooth: true,
          areaStyle: {},
          data: data.map((item) => item.partial)
        },
        {
          name: '编译错误',
          type: 'line',
          smooth: true,
          areaStyle: {},
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

  return <div ref={chartRef} style={{ width: '100%', height: '320px' }} />
}

export default TrendAreaChart