#!/usr/bin/env node

/**
 * 简单的 CORS 代理服务器
 * 解决前端跨域检测问题
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// 解析 JSON 请求体
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 主要的代理检测端点
app.post('/api/check', async (req, res) => {
  const { url, method = 'HEAD', timeout = 10000 } = req.body;
  
  if (!url) {
    return res.status(400).json({
      error: 'URL is required',
      code: 'MISSING_URL'
    });
  }
  
  const startTime = Date.now();
  
  try {
    console.log(`🔍 代理检测请求: ${method} ${url}`);
    
    // 解析 URL
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    // 构建请求选项
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      timeout: timeout,
      headers: {
        'User-Agent': 'Environment-Monitor-Proxy/1.0',
        'Accept': '*/*',
        'Connection': 'close'
      }
    };
    
    // 如果是 HTTPS，添加 SSL 选项
    if (isHttps) {
      options.rejectUnauthorized = false; // 允许自签名证书
    }
    
    const result = await makeRequest(httpModule, options);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ 代理检测成功: ${url} - ${result.status} (${responseTime}ms)`);
    
    res.json({
      url,
      status: result.status,
      statusText: result.statusText,
      responseTime,
      headers: result.headers,
      timestamp: new Date().toISOString(),
      method: 'proxy'
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`❌ 代理检测失败: ${url} - ${error.message} (${responseTime}ms)`);
    
    // 根据错误类型返回不同的状态
    let status = 0;
    let statusText = error.message;
    
    if (error.code === 'ECONNREFUSED') {
      status = 0;
      statusText = 'Connection refused';
    } else if (error.code === 'ENOTFOUND') {
      status = 0;
      statusText = 'Host not found';
    } else if (error.code === 'ETIMEDOUT') {
      status = 0;
      statusText = 'Connection timeout';
    } else if (error.code === 'ECONNRESET') {
      status = 0;
      statusText = 'Connection reset';
    }
    
    res.json({
      url,
      status,
      statusText,
      responseTime,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      method: 'proxy-error'
    });
  }
});

// 创建 HTTP 请求的 Promise 包装
function makeRequest(httpModule, options) {
  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      // 收集响应头
      const headers = {};
      for (const [key, value] of Object.entries(res.headers)) {
        headers[key] = value;
      }
      
      resolve({
        status: res.statusCode,
        statusText: res.statusMessage || '',
        headers
      });
      
      // 丢弃响应体（我们只需要状态码）
      res.resume();
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 CORS 代理服务器已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🔍 检测端点: POST http://localhost:${PORT}/api/check`);
  console.log(`💚 健康检查: GET http://localhost:${PORT}/health`);
  console.log('');
  console.log('使用示例:');
  console.log(`curl -X POST http://localhost:${PORT}/api/check \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"url": "https://www.google.com", "method": "HEAD"}\'');
  console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在优雅关闭服务器...');
  process.exit(0);
});
