Add-Type -AssemblyName System.Drawing

function Generate-LuveaIcon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$isMaskable = $false,
        [bool]$isApple = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = $size / 100.0

    # Fundo Escuro de Luxo (#121214)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#141416"))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#27272A"), [Math]::Max(1.0, 1.5 * $scale))
    
    if ($isMaskable -or $isApple) {
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    } else {
        $r = [float](22.0 * $scale)
        $m = [float](2.0 * $scale)
        $w = [float]($size - 4.0 * $scale)
        $rect = New-Object System.Drawing.RectangleF($m, $m, $w, $w)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddArc($rect.X, $rect.Y, $r, $r, [float]180, [float]90)
        $path.AddArc([float]($rect.Right - $r), [float]$rect.Y, $r, $r, [float]270, [float]90)
        $path.AddArc([float]($rect.Right - $r), [float]($rect.Bottom - $r), $r, $r, [float]0, [float]90)
        $path.AddArc([float]$rect.X, [float]($rect.Bottom - $r), $r, $r, [float]90, [float]90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)
        $g.DrawPath($borderPen, $path)
        $path.Dispose()
    }

    # Monograma "L"
    if ($isMaskable) {
        $scaleL = $scale * 0.76
        $offset = ($size - (100 * $scaleL)) / 2
    } else {
        $scaleL = $scale
        $offset = 0
    }

    $strokeWidth = 7.0 * $scaleL
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $strokeWidth)
    $whitePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $whitePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $whitePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $lPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p1 = New-Object System.Drawing.PointF(($offset + 38 * $scaleL), ($offset + 28 * $scaleL))
    $p2 = New-Object System.Drawing.PointF(($offset + 38 * $scaleL), ($offset + 64 * $scaleL))
    $ctrl1 = New-Object System.Drawing.PointF(($offset + 38 * $scaleL), ($offset + 69.5 * $scaleL))
    $ctrl2 = New-Object System.Drawing.PointF(($offset + 42.5 * $scaleL), ($offset + 73 * $scaleL))
    $p3 = New-Object System.Drawing.PointF(($offset + 48 * $scaleL), ($offset + 73 * $scaleL))
    $p4 = New-Object System.Drawing.PointF(($offset + 68 * $scaleL), ($offset + 73 * $scaleL))

    $lPath.AddLine($p1, $p2)
    $lPath.AddBezier($p2, $ctrl1, $ctrl2, $p3)
    $lPath.AddLine($p3, $p4)

    $g.DrawPath($whitePen, $lPath)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $lPath.Dispose()
    $whitePen.Dispose()
    $bgBrush.Dispose()
    $borderPen.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Gerado com sucesso: $outputPath"
}

Generate-LuveaIcon -size 180 -outputPath "public\apple-touch-icon.png" -isApple $true
Generate-LuveaIcon -size 192 -outputPath "public\icon-192.png"
Generate-LuveaIcon -size 512 -outputPath "public\icon-512.png"
Generate-LuveaIcon -size 512 -outputPath "public\icon-maskable-512.png" -isMaskable $true
