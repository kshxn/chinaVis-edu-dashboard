let filterOptionsCache = null
let trendDataCache = null

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`加载数据失败: ${path}`)
  }
  return response.json()
}

export async function getFilterOptions() {
  if (!filterOptionsCache) {
    filterOptionsCache = await loadJson('/data/filterOptions.json')
  }

  return {
    majors: filterOptionsCache.majors || [],
    sexes: filterOptionsCache.sexes || [],
    knowledges: filterOptionsCache.knowledges || [],
    classes: filterOptionsCache.classes || []
  }
}

function buildFilterKey(filters) {
  return [
    filters.major || 'all',
    filters.sex || 'all',
    filters.knowledge || 'all',
    filters.className || 'all'
  ].join('|')
}

export async function getTrendData(filters) {
  if (!trendDataCache) {
    trendDataCache = await loadJson('/data/trendData.json')
  }

  const key = buildFilterKey(filters)
  return trendDataCache[key] || trendDataCache['all|all|all|all'] || []
}