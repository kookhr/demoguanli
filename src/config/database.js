// Serv00 数据库配置
export const DATABASE_CONFIG = {
  // 数据库连接配置
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'environment_manager',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  
  // 连接池配置
  pool: {
    min: 2,
    max: 10,
    acquire: 30000,
    idle: 10000
  },
  
  // 表名配置
  tables: {
    environments: 'environments',
    users: 'users',
    status_history: 'status_history',
    user_sessions: 'user_sessions',
    environment_groups: 'environment_groups'
  }
};

// API 端点配置
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || '/api',
  endpoints: {
    // 环境管理
    environments: '/environments',
    environmentById: '/environments/:id',
    environmentStatus: '/environments/:id/status',
    
    // 用户管理
    users: '/users',
    userById: '/users/:id',
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    
    // 状态历史
    statusHistory: '/status-history',
    statusHistoryByEnv: '/status-history/:envId',
    
    // 分组管理
    groups: '/groups',
    groupById: '/groups/:id'
  }
};

// 数据库表结构定义
export const TABLE_SCHEMAS = {
  environments: `
    CREATE TABLE IF NOT EXISTS environments (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      description TEXT,
      version VARCHAR(50),
      network_type ENUM('internal', 'external') DEFAULT 'external',
      environment_type ENUM('development', 'testing', 'staging', 'production') DEFAULT 'development',
      tags JSON,
      group_id VARCHAR(36),
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      INDEX idx_name (name),
      INDEX idx_type (environment_type),
      INDEX idx_network (network_type),
      INDEX idx_group (group_id),
      INDEX idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  status_history: `
    CREATE TABLE IF NOT EXISTS status_history (
      id VARCHAR(36) PRIMARY KEY,
      environment_id VARCHAR(36) NOT NULL,
      status ENUM('available', 'unreachable', 'checking') NOT NULL,
      response_time INT,
      status_code INT,
      error_message TEXT,
      detection_method VARCHAR(50),
      checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checked_by VARCHAR(36),
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
      INDEX idx_env_id (environment_id),
      INDEX idx_status (status),
      INDEX idx_checked_at (checked_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  user_sessions: `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_token (session_token),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  environment_groups: `
    CREATE TABLE IF NOT EXISTS environment_groups (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#3B82F6',
      sort_order INT DEFAULT 0,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      INDEX idx_name (name),
      INDEX idx_sort_order (sort_order),
      INDEX idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

// 默认数据
export const DEFAULT_DATA = {
  // 默认管理员用户
  admin_user: {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@localhost',
    password_hash: '$2b$10$rQJ5qJ5qJ5qJ5qJ5qJ5qJOqJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5q', // 默认密码: admin123
    role: 'admin',
    is_active: true
  },
  
  // 默认环境分组
  default_groups: [
    {
      id: 'group-dev',
      name: '开发环境',
      description: '开发和测试环境',
      color: '#10B981',
      sort_order: 1
    },
    {
      id: 'group-prod',
      name: '生产环境',
      description: '生产和预发布环境',
      color: '#EF4444',
      sort_order: 2
    }
  ]
};

export default DATABASE_CONFIG;
