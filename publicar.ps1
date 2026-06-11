# publicar.ps1 — publica o dashboard no GitHub e no Netlify
# Uso: .\publicar.ps1 "mensagem do commit"
# Uso sem mensagem: .\publicar.ps1  (usa mensagem padrão com data)

param(
    [string]$Mensagem = ""
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

if (-not $Mensagem) {
    $data = Get-Date -Format "dd/MM/yyyy HH:mm"
    $Mensagem = "Atualização $data"
}

Write-Host ""
Write-Host "📦 Publicando dashboard..." -ForegroundColor Cyan
Write-Host ""

# 1. Git
Write-Host "1/3  Git — preparando commit..." -ForegroundColor Yellow
git add okr_dashboard_barbara.html index.html template_analise_mensal.xlsx 2>$null
git add -u 2>$null

$status = git status --porcelain
if ($status) {
    git commit -m $Mensagem
    Write-Host "     Commit criado: $Mensagem" -ForegroundColor Green
} else {
    Write-Host "     Nenhuma alteração para commitar." -ForegroundColor Gray
}

# 2. GitHub
Write-Host "2/3  GitHub — enviando..." -ForegroundColor Yellow
git push origin master:main
Write-Host "     GitHub atualizado!" -ForegroundColor Green

# 3. Netlify
Write-Host "3/3  Netlify — fazendo deploy..." -ForegroundColor Yellow
netlify deploy --prod --dir .
Write-Host "     Netlify atualizado!" -ForegroundColor Green

Write-Host ""
Write-Host "✅  Publicado com sucesso em:" -ForegroundColor Green
Write-Host "    GitHub  → https://cecossi.github.io/OKR/" -ForegroundColor White
Write-Host "    Netlify → https://okr-barbara-preambulo.netlify.app" -ForegroundColor White
Write-Host ""
