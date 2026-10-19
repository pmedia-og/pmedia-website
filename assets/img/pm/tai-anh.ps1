# Tải toàn bộ ảnh đang dùng trên site từ pmedia.vn về thư mục này (Windows PowerShell).
# Chạy: chuột phải > Run with PowerShell, hoặc:  powershell -ExecutionPolicy Bypass -File tai-anh.ps1
$base = 'https://pmedia.vn/wp-content/uploads/'
$ok = 0; $fail = 0
Get-Content (Join-Path $PSScriptRoot 'danh-sach-anh.txt') | Where-Object { $_.Trim() } | ForEach-Object {
  $url = $_.Trim()
  $out = Join-Path $PSScriptRoot ($url.Substring($base.Length) -replace '/', '\')
  if (Test-Path $out) { $ok++; return }
  New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
  try { Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing; $ok++; Write-Host "OK   $url" }
  catch { $fail++; Write-Host "LOI  $url" -ForegroundColor Red }
}
Write-Host "`nXong: $ok anh da co, $fail anh loi."
