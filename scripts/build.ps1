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
    throw "Hugo was not found. Put hugo.exe in the site root, install Hugo, or keep the portfolio Hugo binary available."
}

& $hugo --source $root --gc --minify
