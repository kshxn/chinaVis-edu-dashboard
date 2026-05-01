import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

function StudentRadarChart({ data }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !data) return

    const chart = echarts.init(chartRef.current)

    const option = {
      backgroundColor: 'transparent',
      tooltip: {},
      legend: {
        bottom: 0,
        textStyle: { color: '#cbd5e1' }
      },
      radar: {
        indicator: data.indicators,
        center: ['50%', '50%'],
        radius: '65%',
        axisName: { color: '#94a3b8', fontSize: 12 },
        splitLine: { lineStyle: { color: '#1e293b' } },
        splitArea: { areaStyle: { color: ['rgba(30,41,59,0.3)', 'rgba(15,23,42,0.2)'] } },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      series: [
        {
          type: 'radar',
          data: data.students.map((s) => ({
            name: s.name,
            value: s.values,
            areaStyle: { opacity: 0.25 },
            lineStyle: { width: 2 }
          }))
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

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

export default StudentRadarChart
