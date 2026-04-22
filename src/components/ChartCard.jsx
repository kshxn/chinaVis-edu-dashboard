function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`chart-card ${className}`}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        {children || <div className="chart-placeholder">数据分析区域</div>}
      </div>
    </div>
  )
}

export default ChartCard