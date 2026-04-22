import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChartCard from '../components/ChartCard'
import TrendAreaChart from '../components/TrendAreaChart'
import { getFilterOptions, getTrendData } from '../services/api'

function Dashboard() {
  const [filters, setFilters] = useState({
    major: 'all',
    sex: 'all',
    knowledge: 'all',
    className: 'all'
  })

  const [options, setOptions] = useState({
    majors: [],
    sexes: [],
    knowledges: [],
    classes: []
  })

  const [trendData, setTrendData] = useState([])

  useEffect(() => {
    async function loadOptions() {
      const data = await getFilterOptions()
      setOptions(data)
    }
    loadOptions()
  }, [])

  useEffect(() => {
    async function loadTrend() {
      const data = await getTrendData(filters)
      setTrendData(data)
    }
    loadTrend()
  }, [filters])

  return (
    <div className="dashboard">
      <aside className="sidebar-area">
        <Sidebar
          filters={filters}
          setFilters={setFilters}
          options={options}
        />
      </aside>

      <main className="main-area">
        <div className="top-bar">
          <div>
            <p className="top-tag">Visualization Course Project</p>
            <h1 className="page-title">时序多变量教育数据可视分析平台</h1>
            <p className="page-subtitle">
              NorthClass Learning Behavior Visual Analysis Dashboard
            </p>
          </div>
          <div className="live-badge">● Live Data Feed</div>
        </div>

        <div className="chart-grid">
          <ChartCard title="多变量学生表现画像" />
          <ChartCard title="知识点提交热力图" />
          <ChartCard title="表现 vs 效率散点图" />
          <ChartCard title="子知识标签规模" />
          <ChartCard title="专业 → 班级 → 知识领域" />
          <ChartCard title="知识标签相关性" />
          <ChartCard title="提交趋势与状态分布" className="span-2">
            <TrendAreaChart data={trendData} />
          </ChartCard>
        </div>
      </main>
    </div>
  )
}

export default Dashboard