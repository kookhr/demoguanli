// 收藏和排序管理工具

const FAVORITES_STORAGE_KEY = 'environment_favorites';
const SORT_ORDER_STORAGE_KEY = 'environment_sort_order';

// 获取收藏列表
export const getFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return [];
  }
};

// 保存收藏列表
export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('保存收藏列表失败:', error);
  }
};

// 添加收藏
export const addToFavorites = (environmentId) => {
  const favorites = getFavorites();
  if (!favorites.includes(environmentId)) {
    favorites.push(environmentId);
    saveFavorites(favorites);
  }
  return favorites;
};

// 移除收藏
export const removeFromFavorites = (environmentId) => {
  const favorites = getFavorites();
  const filtered = favorites.filter(id => id !== environmentId);
  saveFavorites(filtered);
  return filtered;
};

// 切换收藏状态
export const toggleFavorite = (environmentId) => {
  const favorites = getFavorites();
  const isFavorite = favorites.includes(environmentId);
  
  if (isFavorite) {
    return removeFromFavorites(environmentId);
  } else {
    return addToFavorites(environmentId);
  }
};

// 检查是否收藏
export const isFavorite = (environmentId) => {
  return getFavorites().includes(environmentId);
};

// 获取排序顺序
export const getSortOrder = () => {
  try {
    const stored = localStorage.getItem(SORT_ORDER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('获取排序顺序失败:', error);
    return [];
  }
};

// 保存排序顺序
export const saveSortOrder = (order) => {
  try {
    localStorage.setItem(SORT_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.error('保存排序顺序失败:', error);
  }
};

// 更新环境排序
export const updateEnvironmentOrder = (environmentIds) => {
  saveSortOrder(environmentIds);
};

// 根据收藏和自定义排序对环境进行排序
export const sortEnvironments = (environments, sortBy = 'custom') => {
  const favorites = getFavorites();
  const customOrder = getSortOrder();
  
  // 创建排序权重映射
  const getOrderWeight = (envId) => {
    const customIndex = customOrder.indexOf(envId);
    return customIndex >= 0 ? customIndex : 999999;
  };
  
  switch (sortBy) {
    case 'favorites':
      return [...environments].sort((a, b) => {
        const aIsFav = favorites.includes(a.id);
        const bIsFav = favorites.includes(b.id);
        
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        
        // 如果都是收藏或都不是收藏，按名称排序
        return a.name.localeCompare(b.name);
      });
      
    case 'name':
      return [...environments].sort((a, b) => a.name.localeCompare(b.name));
      
    case 'type': {
      const typeOrder = ['production', 'staging', 'testing', 'development'];
      return [...environments].sort((a, b) => {
        const aIndex = typeOrder.indexOf(a.type);
        const bIndex = typeOrder.indexOf(b.type);
        
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        
        return a.name.localeCompare(b.name);
      });
    }
      
    case 'network':
      return [...environments].sort((a, b) => {
        if (a.network !== b.network) {
          return a.network === 'external' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
    case 'custom':
    default:
      return [...environments].sort((a, b) => {
        const aIsFav = favorites.includes(a.id);
        const bIsFav = favorites.includes(b.id);
        
        // 收藏的环境优先
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        
        // 然后按自定义排序
        const aWeight = getOrderWeight(a.id);
        const bWeight = getOrderWeight(b.id);
        
        if (aWeight !== bWeight) {
          return aWeight - bWeight;
        }
        
        // 最后按名称排序
        return a.name.localeCompare(b.name);
      });
  }
};

// 移动环境位置
export const moveEnvironment = (environments, fromIndex, toIndex) => {
  const newEnvironments = [...environments];
  const [movedItem] = newEnvironments.splice(fromIndex, 1);
  newEnvironments.splice(toIndex, 0, movedItem);
  
  // 更新排序顺序
  const newOrder = newEnvironments.map(env => env.id);
  saveSortOrder(newOrder);
  
  return newEnvironments;
};

// 重置排序
export const resetSortOrder = () => {
  localStorage.removeItem(SORT_ORDER_STORAGE_KEY);
};

// 清除所有收藏
export const clearAllFavorites = () => {
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
};

// 导出收藏和排序设置
export const exportPreferences = () => {
  const preferences = {
    favorites: getFavorites(),
    sortOrder: getSortOrder(),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(preferences, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `environment-preferences-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 导入收藏和排序设置
export const importPreferences = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const preferences = JSON.parse(e.target.result);
        
        if (preferences.favorites) {
          saveFavorites(preferences.favorites);
        }
        
        if (preferences.sortOrder) {
          saveSortOrder(preferences.sortOrder);
        }
        
        resolve(preferences);
      } catch {
        reject(new Error('无效的配置文件格式'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};
