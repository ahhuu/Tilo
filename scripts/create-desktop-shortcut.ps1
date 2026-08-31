$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Tilo.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"D:\code\Tilo\scripts\start-tilo.vbs`""
$Shortcut.WorkingDirectory = "D:\code\Tilo"
$Shortcut.Description = "Tilo 个人执行系统"
$Shortcut.Save()
Write-Output "桌面快捷方式重新生成成功: $ShortcutPath"
