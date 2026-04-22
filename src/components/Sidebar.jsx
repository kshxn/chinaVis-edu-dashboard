function Sidebar({ filters, setFilters, options }) {
  const handleChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">实时过滤面板</h2>

      <div className="filter-group">
        <label>专业</label>
        <select
          value={filters.major}
          onChange={(e) => handleChange('major', e.target.value)}
        >
          <option value="all">全部</option>
          {options.majors.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>性别</label>
        <select
          value={filters.sex}
          onChange={(e) => handleChange('sex', e.target.value)}
        >
          <option value="all">全部</option>
          {options.sexes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>知识领域</label>
        <select
          value={filters.knowledge}
          onChange={(e) => handleChange('knowledge', e.target.value)}
        >
          <option value="all">全部</option>
          {options.knowledges.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>班级</label>
        <select
          value={filters.className}
          onChange={(e) => handleChange('className', e.target.value)}
        >
          <option value="all">全部</option>
          {options.classes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

     <div className="sidebar-tip">
  <div>数据概览：</div>
  <div>学习者：1364 人</div>
  <div>题目：44 道</div>
  <div>日志：232818 条</div>
  <div>时间范围：148 天</div>
  </div>
    </div>
  )
}

export default Sidebar