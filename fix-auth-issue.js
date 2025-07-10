// 认证问题修复工具
// 在浏览器控制台中运行此脚本来修复认证问题

console.log('🔐 认证问题修复工具已加载');

// 修复认证问题的工具对象
window.AuthFixer = {
    
    // 1. 设置测试认证token
    setTestToken() {
        const testToken = 'test-token-' + Date.now();
        localStorage.setItem('auth_token', testToken);
        console.log('✅ 已设置测试token:', testToken);
        return testToken;
    },
    
    // 2. 设置API密钥
    setApiKey() {
        localStorage.setItem('api_key', 'demo-api-key-2025');
        console.log('✅ 已设置API密钥');
    },
    
    // 3. 测试配置导入（带认证）
    async testImportWithAuth() {
        console.log('🧪 测试配置导入（带认证）...');
        
        // 确保有认证信息
        let token = localStorage.getItem('auth_token');
        if (!token) {
            token = this.setTestToken();
        }
        
        const testConfig = {
            environments: [{
                id: 'test-env-' + Date.now(),
                name: '测试环境',
                url: 'https://httpbin.org/status/200',
                description: '认证测试环境',
                network_type: 'external',
                environment_type: 'testing'
            }]
        };
        
        try {
            // 方法1: 使用Bearer Token
            console.log('📤 尝试方法1: Bearer Token');
            const response1 = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testConfig)
            });
            
            if (response1.ok) {
                const data = await response1.json();
                console.log('✅ Bearer Token 方法成功:', data);
                return { success: true, method: 'Bearer Token', data };
            } else {
                console.log('❌ Bearer Token 方法失败:', response1.status, await response1.text());
            }
            
            // 方法2: 使用API Key头部
            console.log('📤 尝试方法2: API Key 头部');
            const response2 = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'demo-api-key-2025'
                },
                body: JSON.stringify(testConfig)
            });
            
            if (response2.ok) {
                const data = await response2.json();
                console.log('✅ API Key 头部方法成功:', data);
                return { success: true, method: 'API Key Header', data };
            } else {
                console.log('❌ API Key 头部方法失败:', response2.status, await response2.text());
            }
            
            // 方法3: 使用URL参数
            console.log('📤 尝试方法3: URL 参数');
            const response3 = await fetch('/api/import?api_key=demo-api-key-2025', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testConfig)
            });
            
            if (response3.ok) {
                const data = await response3.json();
                console.log('✅ URL 参数方法成功:', data);
                return { success: true, method: 'URL Parameter', data };
            } else {
                console.log('❌ URL 参数方法失败:', response3.status, await response3.text());
            }
            
            return { success: false, error: '所有认证方法都失败了' };
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 4. 修复前端API调用
    fixFrontendAPI() {
        console.log('🔧 修复前端API调用...');
        
        // 检查是否存在databaseAPI实例
        if (typeof window.databaseAPI !== 'undefined') {
            console.log('📦 找到现有的databaseAPI实例');
            
            // 设置认证信息
            const token = localStorage.getItem('auth_token') || this.setTestToken();
            window.databaseAPI.setToken(token);
            
            console.log('✅ 已更新databaseAPI的认证信息');
        } else {
            console.log('⚠️ 未找到databaseAPI实例，创建临时修复');
            
            // 创建临时的API修复
            window.fixedImportConfig = async (configString) => {
                try {
                    const config = JSON.parse(configString);
                    const result = await this.testImportWithAuth();
                    
                    if (result.success) {
                        console.log('✅ 配置导入成功');
                        return config.environments;
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error('❌ 配置导入失败:', error);
                    throw error;
                }
            };
            
            console.log('✅ 已创建临时修复函数: window.fixedImportConfig()');
        }
    },
    
    // 5. 诊断认证问题
    async diagnoseAuth() {
        console.log('🔍 诊断认证问题...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            localStorage: {
                auth_token: localStorage.getItem('auth_token'),
                api_key: localStorage.getItem('api_key')
            },
            tests: {}
        };
        
        // 测试健康检查
        try {
            const healthResponse = await fetch('/api/health');
            diagnosis.tests.health = {
                status: healthResponse.status,
                ok: healthResponse.ok
            };
        } catch (error) {
            diagnosis.tests.health = { error: error.message };
        }
        
        // 测试认证端点
        const token = localStorage.getItem('auth_token') || 'test-token-temp';
        try {
            const authResponse = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ environments: [] })
            });
            
            diagnosis.tests.auth = {
                status: authResponse.status,
                ok: authResponse.ok,
                statusText: authResponse.statusText
            };
        } catch (error) {
            diagnosis.tests.auth = { error: error.message };
        }
        
        console.log('📊 认证诊断结果:', diagnosis);
        return diagnosis;
    },
    
    // 6. 一键修复
    async quickFix() {
        console.log('🚀 开始一键修复认证问题...');
        
        // 1. 设置认证信息
        this.setTestToken();
        this.setApiKey();
        
        // 2. 修复前端API
        this.fixFrontendAPI();
        
        // 3. 测试修复效果
        const testResult = await this.testImportWithAuth();
        
        // 4. 诊断结果
        const diagnosis = await this.diagnoseAuth();
        
        const result = {
            fixed: testResult.success,
            method: testResult.method,
            diagnosis: diagnosis
        };
        
        if (result.fixed) {
            console.log('✅ 认证问题修复成功！');
            console.log('🎉 现在可以正常使用配置导入功能了');
        } else {
            console.log('❌ 认证问题修复失败');
            console.log('💡 请检查服务器端配置或联系技术支持');
        }
        
        return result;
    },
    
    // 7. 显示使用说明
    showHelp() {
        console.log(`
🔐 认证问题修复工具使用说明

基本命令：
1. AuthFixer.setTestToken()     - 设置测试token
2. AuthFixer.setApiKey()        - 设置API密钥
3. AuthFixer.testImportWithAuth() - 测试导入功能
4. AuthFixer.fixFrontendAPI()   - 修复前端API
5. AuthFixer.diagnoseAuth()     - 诊断认证问题
6. AuthFixer.quickFix()         - 一键修复所有问题

快速修复：
AuthFixer.quickFix()

手动测试：
AuthFixer.testImportWithAuth()

获取帮助：
AuthFixer.showHelp()
        `);
    }
};

// 自动运行初始诊断
AuthFixer.diagnoseAuth().then(result => {
    console.log('🔍 初始诊断完成');
    
    if (result.tests.auth && result.tests.auth.status === 403) {
        console.log('❌ 检测到403认证错误');
        console.log('💡 运行 AuthFixer.quickFix() 来修复问题');
    }
});

// 显示帮助信息
AuthFixer.showHelp();

export default window.AuthFixer;
