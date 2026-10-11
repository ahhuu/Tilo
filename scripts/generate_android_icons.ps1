Add-Type -AssemblyName System.Drawing

$sourcePath = "D:\code\Tilo\src-tauri\icons\icon.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source icon not found: $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; FgSize = 432 }
)

function Resize-Image($img, $width, $height, $isRound = $false) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)

    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse($destRect)
        $graphics.SetClip($path)
    }

    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $graphics.DrawImage($img, $destRect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    $graphics.Dispose()
    return $destImg
}

foreach ($d in $densities) {
    $dir = "D:\code\Tilo\android\app\src\main\res\$($d.Name)"
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # 1. ic_launcher.png (Square / Normal brand icon)
    $launcher = Resize-Image $srcImg $d.Size $d.Size $false
    $launcherPath = Join-Path $dir "ic_launcher.png"
    if (Test-Path $launcherPath) { Remove-Item $launcherPath -Force }
    $launcher.Save($launcherPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $launcher.Dispose()

    # 2. ic_launcher_round.png (Circle brand icon)
    $roundLauncher = Resize-Image $srcImg $d.Size $d.Size $true
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    if (Test-Path $roundPath) { Remove-Item $roundPath -Force }
    $roundLauncher.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundLauncher.Dispose()

    # 3. ic_launcher_foreground.png (Foreground for adaptive icon)
    $fg = Resize-Image $srcImg $d.FgSize $d.FgSize $false
    $fgPath = Join-Path $dir "ic_launcher_foreground.png"
    if (Test-Path $fgPath) { Remove-Item $fgPath -Force }
    $fg.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()

    Write-Host "Generated icons for $($d.Name): $($d.Size)x$($d.Size)"
}

$srcImg.Dispose()
Write-Host "All Android icons generated successfully!"
