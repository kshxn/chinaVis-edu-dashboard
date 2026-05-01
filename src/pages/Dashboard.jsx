import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChartCard from '../components/ChartCard'
import TrendAreaChart from '../components/TrendAreaChart'
import StudentRadarChart from '../components/StudentRadarChart'
import SubmitHeatmap from '../components/SubmitHeatmap'
import EfficiencyScatter from '../components/EfficiencyScatter'
import MajorClassSankey from '../components/MajorClassSankey'
import KnowledgeChordChart from '../components/KnowledgeChordChart'
import KnowledgeScaleBar from '../components/KnowledgeScaleBar'
import {
  getFilterOptions,
  getTrendData,
  getRadarData,
  getHeatmapData,
  getScatterData,
  getMajorClassSankeyData,
  getKnowledgeChordData,
  getKnowledgeScaleData
} from '../services/api'

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
  const [radarData, setRadarData] = useState(null)
  const [heatmapData, setHeatmapData] = useState(null)
  const [scatterData, setScatterData] = useState([])
  const [sankeyData, setSankeyData] = useState(null)
  const [chordData, setChordData] = useState(null)
  const [knowledgeScaleData, setKnowledgeScaleData] = useState([])

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

  useEffect(() => {
    async function loadFlowCharts() {
      const [sankey, chord] = await Promise.all([
        getMajorClassSankeyData(filters),
        getKnowledgeChordData(filters)
      ])
      setSankeyData(sankey)
      setChordData(chord)
    }
    loadFlowCharts()
  }, [filters])

  useEffect(() => {
    async function loadCharts() {
      const [radar, heatmap, scatter, knowledgeScale] = await Promise.all([
        getRadarData(filters),
        getHeatmapData(filters),
        getScatterData(filters),
        getKnowledgeScaleData(filters)
      ])
      setRadarData(radar)
      setHeatmapData(heatmap)
      setScatterData(scatter)
      setKnowledgeScaleData(knowledgeScale)
    }
    loadCharts()
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
          <ChartCard title="多变量学生表现画像">
            <StudentRadarChart data={radarData} />
          </ChartCard>
          <ChartCard title="知识点提交热力图">
            <SubmitHeatmap data={heatmapData} />
          </ChartCard>
          <ChartCard title="表现 vs 效率散点图">
            <EfficiencyScatter data={scatterData} />
          </ChartCard>
          <ChartCard title="子知识标签规模">
            <KnowledgeScaleBar data={knowledgeScaleData} />
          </ChartCard>
          <ChartCard title="专业 → 班级流向">
            <MajorClassSankey data={sankeyData} />
          </ChartCard>
          <ChartCard title="知识点相关性和弦图">
            <KnowledgeChordChart data={chordData} />
          </ChartCard>
          <ChartCard title="提交趋势与状态分布" className="span-2">
            <TrendAreaChart data={trendData} />
          </ChartCard>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
