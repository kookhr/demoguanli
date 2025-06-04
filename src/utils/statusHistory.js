// 状态历史管理工具

const HISTORY_STORAGE_KEY = 'environment_status_history';
const MAX_HISTORY_HOURS = 24;
const MAX_RECORDS_PER_ENV = 288; // 24小时 * 12次/小时 = 288条记录

// 获取状态历史
export const getStatusHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('获取状态历史失败:', error);
    return {};
  }
};

// 保存状态历史
export const saveStatusHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存状态历史失败:', error);
  }
};

// 添加状态记录
export const addStatusRecord = (environmentId, statusData) => {
  const history = getStatusHistory();
  const now = new Date().toISOString();
  
  if (!history[environmentId]) {
    history[environmentId] = [];
  }
  
  const record = {
    timestamp: now,
    status: statusData.status,
    responseTime: statusData.responseTime,
    error: statusData.error || null
  };
  
  // 添加新记录
  history[environmentId].push(record);
  
  // 清理过期记录（超过24小时）
  const cutoffTime = new Date(Date.now() - MAX_HISTORY_HOURS * 60 * 60 * 1000);
  history[environmentId] = history[environmentId].filter(
    record => new Date(record.timestamp) > cutoffTime
  );
  
  // 限制记录数量
  if (history[environmentId].length > MAX_RECORDS_PER_ENV) {
    history[environmentId] = history[environmentId].slice(-MAX_RECORDS_PER_ENV);
  }
  
  saveStatusHistory(history);
  return record;
};

// 获取环境的状态历史
export const getEnvironmentHistory = (environmentId) => {
  const history = getStatusHistory();
  return history[environmentId] || [];
};

// 计算可用性统计
export const calculateAvailabilityStats = (environmentId, hours = 24) => {
  const records = getEnvironmentHistory(environmentId);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const recentRecords = records.filter(
    record => new Date(record.timestamp) > cutoffTime
  );
  
  if (recentRecords.length === 0) {
    return {
      availability: 0,
      totalChecks: 0,
      onlineChecks: 0,
      averageResponseTime: 0,
      lastDowntime: null,
      downtimeCount: 0
    };
  }
  
  const onlineStatuses = ['online', 'reachable'];
  const onlineChecks = recentRecords.filter(r => onlineStatuses.includes(r.status)).length;
  const availability = (onlineChecks / recentRecords.length) * 100;
  
  // 计算平均响应时间（仅在线状态）
  const onlineRecords = recentRecords.filter(r => 
    onlineStatuses.includes(r.status) && r.responseTime
  );
  const averageResponseTime = onlineRecords.length > 0
    ? onlineRecords.reduce((sum, r) => sum + r.responseTime, 0) / onlineRecords.length
    : 0;
  
  // 查找最后一次故障时间
  const offlineRecords = recentRecords.filter(r => 
    !onlineStatuses.includes(r.status)
  );
  const lastDowntime = offlineRecords.length > 0
    ? offlineRecords[offlineRecords.length - 1].timestamp
    : null;
  
  return {
    availability: Math.round(availability * 100) / 100,
    totalChecks: recentRecords.length,
    onlineChecks,
    averageResponseTime: Math.round(averageResponseTime),
    lastDowntime,
    downtimeCount: offlineRecords.length
  };
};

// 获取状态变化事件
export const getStatusChangeEvents = (environmentId, hours = 24) => {
  const records = getEnvironmentHistory(environmentId);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const recentRecords = records.filter(
    record => new Date(record.timestamp) > cutoffTime
  );
  
  const events = [];
  let previousStatus = null;
  
  recentRecords.forEach(record => {
    if (previousStatus && previousStatus !== record.status) {
      events.push({
        timestamp: record.timestamp,
        from: previousStatus,
        to: record.status,
        duration: null // 可以后续计算持续时间
      });
    }
    previousStatus = record.status;
  });
  
  return events;
};

// 生成趋势数据（用于图表）
export const generateTrendData = (environmentId, hours = 24) => {
  const records = getEnvironmentHistory(environmentId);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const recentRecords = records.filter(
    record => new Date(record.timestamp) > cutoffTime
  );
  
  // 按小时分组数据
  const hourlyData = {};
  const now = new Date();
  
  // 初始化24小时的数据
  for (let i = hours - 1; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    hourlyData[hourKey] = {
      hour: hourKey,
      online: 0,
      offline: 0,
      total: 0,
      avgResponseTime: 0,
      responseTimeSum: 0,
      responseTimeCount: 0
    };
  }
  
  // 填充实际数据
  recentRecords.forEach(record => {
    const hourKey = record.timestamp.slice(0, 13);
    if (hourlyData[hourKey]) {
      hourlyData[hourKey].total++;
      
      if (['online', 'reachable'].includes(record.status)) {
        hourlyData[hourKey].online++;
        if (record.responseTime) {
          hourlyData[hourKey].responseTimeSum += record.responseTime;
          hourlyData[hourKey].responseTimeCount++;
        }
      } else {
        hourlyData[hourKey].offline++;
      }
    }
  });
  
  // 计算平均响应时间
  Object.values(hourlyData).forEach(data => {
    if (data.responseTimeCount > 0) {
      data.avgResponseTime = Math.round(data.responseTimeSum / data.responseTimeCount);
    }
  });
  
  return Object.values(hourlyData).sort((a, b) => a.hour.localeCompare(b.hour));
};

// 清理所有历史数据
export const clearAllHistory = () => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

// 导出历史数据
export const exportHistory = (environmentId = null) => {
  const history = getStatusHistory();
  const data = environmentId ? { [environmentId]: history[environmentId] } : history;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `status-history-${environmentId || 'all'}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
