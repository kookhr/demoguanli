# 环境管理中心

一个现代化的环境管理系统，用于统一管理和快速访问多套软件环境，支持实时状态检测、用户权限管理和云端数据同步。

## ✨ 核心特性

### 🌐 智能环境管理
- **多环境支持**: 开发、测试、预生产、生产、演示等环境类型
- **智能网络检测**: 自动识别内网/外网环境，采用多层检测策略
- **实时状态监控**: 多方法状态检测，支持HTTP/HTTPS、CORS绕过等
- **混合内容处理**: 智能识别HTTPS页面访问HTTP资源的限制，提供解决方案建议
- **标签分类**: 彩色标签系统，支持自动颜色分配和深色模式适配

### 🔍 高级搜索与过滤
- **全文搜索**: 支持环境名称、描述、标签、URL等全方位搜索
- **多维度过滤**: 按类型、网络、状态、标签等多条件过滤
- **智能排序**: 自定义排序、按类型、按网络等多种排序方式
- **收藏管理**: 环境收藏功能，快速访问常用环境

### 📊 可视化统计
- **实时统计**: 总环境数、在线数、管理员数等关键指标
- **状态历史**: 24小时状态记录、趋势图表、响应时间统计
- **分组管理**: 环境分组功能，支持折叠展开和拖拽排序

### � 用户权限系统
- **角色管理**: 管理员/普通用户权限分离
- **注册控制**: 管理员可控制的用户注册开关
- **密码管理**: 安全的密码修改功能
- **权限保护**: 路由级别的权限控制和访问保护

### ☁️ 云端数据同步
- **Cloudflare KV**: 支持Cloudflare KV存储，实现数据云端同步
- **本地备份**: KV不可用时自动切换到本地存储
- **数据迁移**: 支持本地数据向云端迁移

## 🛠️ 技术栈

- **前端框架**: React 18 + Hooks
- **构建工具**: Vite 6.x
- **路由管理**: React Router DOM v6
- **UI组件**: 自研组件库
- **图标库**: Lucide React
- **样式方案**: Tailwind CSS + 自定义CSS
- **状态管理**: React Context + Hooks
- **数据存储**: Cloudflare KV + LocalStorage
- **认证系统**: 基于JWT的用户认证
- **部署平台**: Cloudflare Pages

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 本地开发
```bash
# 克隆项目
git clone <repository-url>
cd environment-management

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看应用

### 生产部署
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 默认账户
- **管理员**: `admin` / `admin123`
- **功能**: 完整的系统管理权限

## 配置说明

### 环境配置

编辑 `src/data/environments.js` 文件来配置你的环境信息：

```javascript
{
  id: 'dev',                    // 环境唯一标识
  name: '开发环境',              // 环境显示名称
  type: 'development',          // 环境类型
  network: 'internal',          // 网络类型: internal | external
  url: 'https://dev.example.com', // 主要访问地址
  status: 'online',             // 状态: online | offline | maintenance
  version: 'v1.2.3-dev',       // 版本号
  lastDeployed: '2024-01-15 14:30:00', // 最后部署时间
  description: '开发环境，用于日常开发和调试', // 环境描述
  services: [                   // 服务列表
    { name: 'Web应用', url: 'https://dev.example.com', port: 3000 },
    { name: 'API服务', url: 'https://api-dev.example.com', port: 8080 }
  ]
}
```

### 环境类型说明

- `development`: 开发环境（绿色标识）
- `testing`: 测试环境（蓝色标识）
- `staging`: 预生产环境（橙色标识）
- `production`: 生产环境（红色标识）
- `demo`: 演示环境（灰色标识）

### 网络类型说明

- `internal`: 内网环境 (分类标签)
- `external`: 外网环境 (分类标签)

**注意**: 网络类型仅作为分类标签使用，用于视觉识别和环境分类，不会影响状态检测功能。所有环境都会正常进行状态检测，无论标记为内网还是外网。

## 🌐 网络检测功能

### 简化检测策略
- **纯前端方案**: 无需额外服务器或代理，保持系统轻量级
- **双重策略**: 标准HTTP请求 + no-cors备用检测
- **快速响应**: 统一5秒超时，快速获得检测结果
- **智能缓存**: 30秒缓存机制，避免重复检测

### 状态类型
- 🟢 **可用**: 网络可直接访问
- 🔴 **不可达**: 网络不可访问，可能需要VPN或代理
- ❓ **未知**: 状态未知或检测失败
- 🔄 **检测中**: 正在进行检测

## 📋 主要功能

### 🎯 环境管理
- **环境卡片**: 3列网格布局，紧凑美观的环境信息展示
- **状态检测**: 多层次检测策略，统一检测所有环境
- **快速访问**: 一键跳转到目标环境，支持新窗口打开
- **收藏功能**: 星标收藏常用环境，支持收藏筛选
- **分类标签**: 网络类型作为分类标签，便于环境管理和识别

### 🔍 搜索与筛选
- **实时搜索**: 支持环境名称、描述、标签等全文搜索
- **多维筛选**: 按类型、网络、状态等条件筛选
- **智能排序**: 自定义、按类型、按网络等多种排序方式
- **分组管理**: 环境分组功能，支持折叠和拖拽排序

### � 状态监控
- **实时检测**: 智能状态检测，支持HTTP/HTTPS、CORS绕过
- **历史记录**: 24小时状态历史，趋势图表展示
- **响应时间**: 实时响应时间统计和性能监控
- **批量检测**: 支持单个或批量环境状态检测

### 👥 用户系统
- **权限管理**: 管理员/普通用户角色分离
- **注册控制**: 管理员可控制新用户注册
- **密码管理**: 安全的密码修改功能
- **用户管理**: 完整的用户增删改查功能

### 🎨 界面特性
- **深色模式**: 完整的深色/浅色主题切换
- **响应式设计**: 完美适配桌面端和移动端
- **快捷键支持**: 丰富的键盘快捷键操作
- **右键菜单**: 便捷的环境操作菜单

## 📖 使用指南

### 🏠 主要页面

1. **环境管理** (`/`) - 主页面
   - 环境状态监控和快速访问
   - 搜索、筛选、排序功能
   - 收藏管理和分组功能
   - 状态历史查看

2. **配置管理** (`/config`) - 管理员专用
   - 环境配置的增删改查
   - 标签管理和批量操作
   - 配置导入导出功能

3. **用户管理** (`/user-management`) - 管理员专用
   - 用户账户管理
   - 权限控制和注册设置
   - 密码管理功能

### ⚡ 快捷键

- `Ctrl + R` - 检测当前环境状态
- `Ctrl + Shift + H` - 切换状态历史面板
- `Ctrl + /` - 显示快捷键帮助
- `Escape` - 关闭模态框或面板

### 🎯 核心操作

#### 环境管理
- **状态检测**: 自动检测或手动刷新环境状态
- **快速访问**: 点击环境卡片直接访问
- **收藏管理**: 星标收藏常用环境
- **右键菜单**: 检测状态、访问环境、管理收藏、查看历史

#### 搜索筛选
- **全文搜索**: 搜索框支持环境名称、描述、标签等
- **类型筛选**: 按开发、测试、生产等环境类型筛选
- **状态筛选**: 按在线、离线等状态筛选
- **网络筛选**: 按内网、外网筛选

### 📁 项目架构
```
src/
├── components/           # React组件
│   ├── AuthProvider.jsx        # 认证上下文
│   ├── EnvironmentList.jsx     # 环境列表主页
│   ├── EnvironmentCard.jsx     # 环境卡片组件
│   ├── AdvancedSearch.jsx      # 高级搜索组件
│   ├── ConfigPage.jsx          # 配置管理页面
│   ├── UserManagementPage.jsx  # 用户管理页面
│   ├── Navigation.jsx          # 导航栏
│   ├── ContextMenu.jsx         # 右键菜单
│   ├── StatusHistoryChart.jsx  # 状态历史图表
│   └── DarkModeToggle.jsx      # 深色模式切换
├── utils/               # 工具函数
│   ├── auth.js                 # 认证管理
│   ├── userManagement.js      # 用户管理
│   ├── configManager.js       # 配置管理
│   ├── proxyStatusCheck.js    # 优化的状态检测
│   ├── statusHistory.js       # 状态历史
│   ├── kvApi.js               # KV存储API
│   └── favorites.js           # 收藏管理
├── hooks/               # 自定义Hooks
│   ├── useDarkMode.js         # 深色模式Hook
│   └── useShortcuts.js        # 快捷键Hook
├── data/
│   └── environments.js        # 默认环境数据
└── App.jsx             # 主应用入口
```

## 自定义开发

### 添加新的环境类型

1. 在 `src/utils/configManager.js` 的 `validateEnvironment` 函数中添加新的环境类型
2. 在 `src/components/EnvironmentCard.jsx` 的 `getTypeStyle` 函数中添加对应的样式
3. 在 `src/components/EnvironmentForm.jsx` 的 `environmentTypes` 数组中添加新选项

### 修改状态检测逻辑

编辑 `src/utils/networkCheck.js` 中的 `checkEnvironmentStatus` 函数来自定义状态检测逻辑。

### 自定义样式

修改 `src/index.css` 文件来调整应用的视觉样式。

### 扩展配置管理

- 修改 `src/utils/configManager.js` 来添加新的配置验证规则
- 扩展 `src/components/EnvironmentForm.jsx` 来支持更多字段
- 在 `src/components/ServiceForm.jsx` 中添加新的服务类型

## 🚀 部署指南

### Cloudflare Pages 部署（推荐）
```bash
# 1. 连接GitHub仓库到Cloudflare Pages
# 2. 设置构建命令
Build command: npm run build
Build output directory: dist

# 3. 配置环境变量（可选）
# 如需使用KV存储，在Cloudflare Pages设置中绑定KV命名空间
```

### 其他平台部署
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# 静态服务器
npm run build
# 将 dist 目录部署到任何静态文件服务器
```

### 环境配置
- **KV存储**: 推荐使用Cloudflare KV实现数据云端同步
- **HTTPS**: 生产环境必须使用HTTPS（状态检测需要）
- **域名**: 建议使用自定义域名提升用户体验

## 🎨 界面特色

### 现代化设计
- **Tailwind CSS**: 现代化的设计系统
- **深色模式**: 完整的深色/浅色主题支持
- **响应式布局**: 完美适配桌面端和移动端
- **流畅动画**: 丰富的交互动画和过渡效果

### 视觉亮点
- 🎯 **环境卡片**: 紧凑美观的3列网格布局
- 🏷️ **彩色标签**: 自动颜色分配，支持深色模式
- 📊 **状态指示**: 直观的在线/离线状态显示
- 🌐 **网络图标**: 内网/外网环境类型标识

### 交互体验
- ⚡ **快捷键**: 丰富的键盘快捷键支持
- 🖱️ **右键菜单**: 便捷的环境操作菜单
- 📱 **触摸友好**: 移动端优化的触摸交互
- 🔄 **实时更新**: 状态检测和数据同步

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
