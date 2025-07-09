# 🔧 故障排除指南

## 🚨 常见问题及解决方案

### 1. 构建失败：`sh: vite: not found`

**问题**：Vite 构建工具未找到

**解决方案**：
```bash
# 方法一：使用修复脚本
wget https://raw.githubusercontent.com/kookhr/demoguanli/serv00/fix-build.sh
chmod +x fix-build.sh
./fix-build.sh

# 方法二：手动修复
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm install vite --save-dev
npm run build
```

### 2. 依赖安装失败

**问题**：npm install 报错

**解决方案**：
```bash
# 清理并重新安装
npm cache clean --force
rm -rf node_modules package-lock.json

# 尝试不同的安装方式
npm install --legacy-peer-deps
# 或者
npm install --force
```

### 3. Node.js 版本过低

**问题**：Node.js 版本 < 16

**解决方案**：
```bash
# 检查版本
node --version

# 如果版本过低，联系 Serv00 支持升级
# 或使用 nvm（如果可用）
nvm install 18
nvm use 18
```

### 4. 数据库连接失败

**问题**：API 无法连接数据库

**解决方案**：
```bash
# 1. 检查数据库是否创建
mysql -u username -p

# 2. 运行初始化脚本
~/init_database.sh

# 3. 检查配置文件
cat ~/domains/*/public_html/api/.env
```

### 5. 权限问题

**问题**：文件权限错误

**解决方案**：
```bash
# 修复权限
chmod -R 755 ~/domains/*/public_html/
find ~/domains/*/public_html/ -name "*.php" -exec chmod 644 {} \;
```

### 6. API 404 错误

**问题**：访问 /api 返回 404

**解决方案**：
```bash
# 检查 .htaccess 文件
cat ~/domains/*/public_html/.htaccess

# 如果缺失，重新创建
cat > ~/domains/*/public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.html [L]
RewriteRule ^api/(.*)$ /api/index.php [L,QSA]
EOF
```

### 7. 页面空白

**问题**：网站显示空白页面

**解决方案**：
```bash
# 检查浏览器控制台错误
# 检查文件是否存在
ls -la ~/domains/*/public_html/

# 重新部署
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

## 🔍 调试工具

### 检查系统状态
```bash
# 检查 PHP
php --version

# 检查 MySQL
mysql --version

# 检查网站文件
ls -la ~/domains/*/public_html/

# 检查 API 健康状态
curl https://your-domain.serv00.net/api/health
```

### 查看日志
```bash
# PHP 错误日志
tail -f /tmp/php_errors.log

# 应用日志
tail -f /tmp/environment_manager.log

# Apache 错误日志
tail -f ~/domains/*/logs/error.log
```

### 测试数据库连接
```bash
# 测试 MySQL 连接
mysql -u username -p database_name -e "SHOW TABLES;"

# 检查数据库配置
grep -E "DB_|JWT_" ~/domains/*/public_html/api/.env
```

## 🆘 紧急修复

### 完全重新安装
```bash
# 1. 清理所有文件
rm -rf ~/domains/*/public_html/*

# 2. 重新运行安装脚本
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash

# 3. 重新初始化数据库
~/init_database.sh
```

### 手动部署（如果自动脚本失败）
```bash
# 1. 克隆项目
git clone -b serv00 https://github.com/kookhr/demoguanli.git
cd demoguanli

# 2. 手动构建
./fix-build.sh

# 3. 手动复制文件
cp -r dist/* ~/domains/*/public_html/
cp -r api ~/domains/*/public_html/
cp -r database ~/domains/*/public_html/

# 4. 设置权限
chmod -R 755 ~/domains/*/public_html/
```

## 📞 获取帮助

### 收集错误信息
在寻求帮助时，请提供：

1. **错误信息**：完整的错误日志
2. **系统信息**：
   ```bash
   echo "Node.js: $(node --version)"
   echo "npm: $(npm --version)"
   echo "PHP: $(php --version | head -1)"
   echo "MySQL: $(mysql --version)"
   ```
3. **文件状态**：
   ```bash
   ls -la ~/domains/*/public_html/
   ```

### 联系方式
- 📧 GitHub Issues: https://github.com/kookhr/demoguanli/issues
- 📖 项目文档: https://github.com/kookhr/demoguanli/tree/serv00

## 💡 预防措施

### 定期维护
```bash
# 每月清理日志
truncate -s 0 /tmp/php_errors.log
truncate -s 0 /tmp/environment_manager.log

# 备份数据库
mysqldump -u username -p environment_manager > backup_$(date +%Y%m%d).sql

# 更新到最新版本
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

### 监控检查
- 定期访问网站确保正常运行
- 检查 API 健康状态：`/api/health`
- 监控磁盘空间使用情况

---

🎯 **记住**：大多数问题都可以通过重新运行安装脚本解决！
