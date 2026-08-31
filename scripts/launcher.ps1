# 1. 检查 5173 端口是否已有服务在运行
$isPortOpen = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 5173)
    if ($tcp.Connected) {
        $isPortOpen = $true
        $tcp.Close()
    }
} catch {
    $isPortOpen = $false
}

# 2. 如果服务未启动，则在后台静默启动 npm run dev
if (-not $isPortOpen) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "d:\code\Tilo" -WindowStyle Hidden
    
    # 等待端口就绪（最多等待 10 秒）
    $retries = 0
    while ($retries -lt 20) {
        Start-Sleep -Milliseconds 500
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", 5173)
            if ($tcp.Connected) {
                $tcp.Close()
                break
            }
        } catch {}
        $retries++
    }
}

# 3. 自动唤起默认浏览器打开 Tilo
Start-Process "http://localhost:5173"
