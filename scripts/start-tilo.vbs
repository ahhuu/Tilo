Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\code\Tilo"
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""d:\code\Tilo\scripts\launcher.ps1""", 0, False
