<?php
// Serv00平台MIME类型修复工具
// 此文件用于解决JavaScript模块MIME类型错误

// 设置正确的MIME类型
$file = $_GET['file'] ?? '';
$ext = pathinfo($file, PATHINFO_EXTENSION);

// 如果没有指定文件，显示帮助信息
if (empty($file)) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Serv00 MIME类型修复工具</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; }
            pre { background: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .success { color: #059669; }
            .error { color: #dc2626; }
        </style>
    </head>
    <body>
        <h1>Serv00 MIME类型修复工具</h1>
        <p>此工具用于解决JavaScript模块MIME类型错误。</p>
        
        <h2>使用方法</h2>
        <p>在URL中添加<code>?file=路径</code>参数来访问文件，例如：</p>
        <pre>serv00-mime-fix.php?file=assets/index-CmRkGmP_.js</pre>
        
        <h2>支持的文件类型</h2>
        <ul>
            <li><strong>.js, .mjs</strong> - JavaScript文件 (application/javascript)</li>
            <li><strong>.css</strong> - CSS文件 (text/css)</li>
            <li><strong>.json</strong> - JSON文件 (application/json)</li>
            <li><strong>.svg</strong> - SVG图像 (image/svg+xml)</li>
            <li><strong>.woff, .woff2</strong> - Web字体 (font/woff, font/woff2)</li>
        </ul>
        
        <h2>配置说明</h2>
        <p>如果您仍然遇到MIME类型错误，请修改您的index.html文件，将资源路径指向此代理：</p>
        <pre>&lt;script type="module" src="serv00-mime-fix.php?file=assets/your-file.js"&gt;&lt;/script&gt;</pre>
        
        <p class="success">✅ MIME类型修复工具已准备就绪</p>
    </body>
    </html>';
    exit;
}

// 安全检查 - 防止目录遍历
$file = str_replace('../', '', $file);

// 构建文件路径
$filePath = $file;
if (!file_exists($filePath) && file_exists('dist/' . $file)) {
    $filePath = 'dist/' . $file;
}

// 如果文件不存在
if (!file_exists($filePath)) {
    header('HTTP/1.1 404 Not Found');
    echo "File not found: $file";
    exit;
}

// 根据扩展名设置正确的MIME类型
switch ($ext) {
    case 'js':
    case 'mjs':
        header('Content-Type: application/javascript');
        break;
    case 'css':
        header('Content-Type: text/css');
        break;
    case 'json':
        header('Content-Type: application/json');
        break;
    case 'svg':
        header('Content-Type: image/svg+xml');
        break;
    case 'woff':
        header('Content-Type: font/woff');
        break;
    case 'woff2':
        header('Content-Type: font/woff2');
        break;
    case 'html':
    case 'htm':
        header('Content-Type: text/html');
        break;
    case 'xml':
        header('Content-Type: application/xml');
        break;
    case 'png':
        header('Content-Type: image/png');
        break;
    case 'jpg':
    case 'jpeg':
        header('Content-Type: image/jpeg');
        break;
    case 'gif':
        header('Content-Type: image/gif');
        break;
    case 'ico':
        header('Content-Type: image/x-icon');
        break;
    default:
        // 默认二进制类型
        header('Content-Type: application/octet-stream');
}

// 设置缓存控制
header('Cache-Control: public, max-age=31536000');
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// 输出文件内容
readfile($filePath);
