#!/usr/bin/env pwsh

# Git Branch Cleanup Analysis Script
# Helps identify branches that are safe to delete

Write-Host "🔍 Analyzing Git branches for cleanup..." -ForegroundColor Blue

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Green

# Check if we're on main/master
$branches = git branch --format='%(refname:short)'
if ($branches -contains "main") {
    $mainBranch = "main"
} elseif ($branches -contains "master") {
    $mainBranch = "master"
} else {
    Write-Host "⚠️  Neither 'main' nor 'master' branch found!" -ForegroundColor Red
    exit 1
}
Write-Host "🏠 Main branch: $mainBranch" -ForegroundColor Green

Write-Host "`n" + "="*50

# 1. Show merged branches
Write-Host "✅ Branches merged into $mainBranch (safe to delete):" -ForegroundColor Green
$mergedBranches = git branch --merged $mainBranch | Where-Object { $_ -notmatch "^\*" -and $_ -notmatch $mainBranch }
if ($mergedBranches) {
    $mergedBranches | ForEach-Object { Write-Host "   $($_.Trim())" -ForegroundColor Yellow }
} else {
    Write-Host "   No merged branches found" -ForegroundColor Gray
}

Write-Host "`n" + "="*50

# 2. Show remote tracking status
Write-Host "📡 Remote tracking status:" -ForegroundColor Green
git branch -vv

Write-Host "`n" + "="*50

# 3. Show branches with no remote tracking
Write-Host "🔗 Local branches without remote tracking:" -ForegroundColor Green
$localOnly = git branch -vv | Where-Object { $_ -notmatch "origin/" -and $_ -notmatch "^\*.*$mainBranch" }
if ($localOnly) {
    $localOnly | ForEach-Object { Write-Host "   $($_.Trim())" -ForegroundColor Yellow }
} else {
    Write-Host "   All branches have remote tracking" -ForegroundColor Gray
}

Write-Host "`n" + "="*50

# 4. Show stale remote branches
Write-Host "🗑️  Stale remote tracking branches:" -ForegroundColor Green
$staleRemotes = git remote prune origin --dry-run
if ($staleRemotes) {
    $staleRemotes | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
} else {
    Write-Host "   No stale remote branches found" -ForegroundColor Gray
}

Write-Host "`n" + "="*50

# 5. Show branch ages
Write-Host "📅 Branch last activity (oldest first):" -ForegroundColor Green
git for-each-ref --format='%(refname:short)|%(committerdate:short)|%(authorname)' refs/heads | 
    Sort-Object { [DateTime]($_.Split('|')[1]) } |
    ForEach-Object {
        $parts = $_.Split('|')
        $branch = $parts[0]
        $date = $parts[1]
        $author = $parts[2]
        $color = if ($branch -eq $currentBranch) { "Green" } elseif ($branch -eq $mainBranch) { "Cyan" } else { "White" }
        Write-Host "   $branch" -ForegroundColor $color -NoNewline
        Write-Host " ($date by $author)" -ForegroundColor Gray
    }

Write-Host "`n" + "="*50

# 6. Provide cleanup commands
Write-Host "🧹 Suggested cleanup commands:" -ForegroundColor Green
Write-Host ""
Write-Host "# Delete merged branches:" -ForegroundColor Cyan
if ($mergedBranches) {
    $mergedBranches | ForEach-Object { 
        $branch = $_.Trim()
        Write-Host "git branch -d $branch" -ForegroundColor Yellow
    }
} else {
    Write-Host "# No merged branches to delete" -ForegroundColor Gray
}

Write-Host ""
Write-Host "# Clean up stale remote references:" -ForegroundColor Cyan
Write-Host "git remote prune origin" -ForegroundColor Yellow

Write-Host ""
Write-Host "# Force delete unmerged branches (use with caution):" -ForegroundColor Cyan
Write-Host "# git branch -D <branch-name>" -ForegroundColor Red

Write-Host "`n" + "="*50
Write-Host "⚠️  Always verify before deleting branches!" -ForegroundColor Red
Write-Host "💡 Use 'git branch -d' for safe deletion (merged branches only)" -ForegroundColor Blue
Write-Host "💡 Use 'git branch -D' to force delete (unmerged branches)" -ForegroundColor Blue