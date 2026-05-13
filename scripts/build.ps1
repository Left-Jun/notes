$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$candidates = @(
    "$root\hugo.exe",
    "C:\Users\MR\Desktop\Hugo\Left_Jun\hugo.exe",
    "hugo"
)

$hugo = $null
foreach ($candidate in $candidates) {
    if ($candidate -eq "hugo") {
        $cmd = Get-Command hugo -ErrorAction SilentlyContinue
        if ($cmd) {
            $hugo = $cmd.Source
            break
        }
    }
    elseif (Test-Path -LiteralPath $candidate) {
        $hugo = $candidate
        break
    }
}

if (-not $hugo) {
    throw "没有找到 Hugo。可以把 hugo.exe 放到站点根目录，或安装 Hugo 后重试。"
}

& $hugo --source $root --gc --minify

