$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PHASE 40: EXPEDITION SUMMARY, TRAVEL WRAPPED & LOYALTY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Test TripGoAsia
Write-Host "`n[1] Testing TripGoAsia Travel Wrapped & Loyalty..." -ForegroundColor Yellow
$headersTGA = @{ "X-Website-Hostname" = "www.tripgoasia.com" }
$hubTGA = (Invoke-RestMethod -Uri "http://localhost:5000/api/expedition-summary/hub" -Headers $headersTGA).data
Write-Host "-> Destination Hub:" $hubTGA.destinationHub -ForegroundColor Green
Write-Host "-> Archetype:" $hubTGA.wrapped.travelerArchetype -ForegroundColor Green
Write-Host "-> Km Traveled:" $hubTGA.wrapped.totalKmTraveled "km | Tours:" $hubTGA.wrapped.toursCompleted -ForegroundColor Green
Write-Host "-> Savings (Bargain + VAT):" ($hubTGA.wrapped.totalBargainingSavings + $hubTGA.wrapped.totalVatRefundClaimed) $hubTGA.currencySymbol -ForegroundColor Green
Write-Host "-> Loyalty Tier:" $hubTGA.loyalty.currentTier "Points:" $hubTGA.loyalty.currentPoints -ForegroundColor Green
Write-Host "-> Rewards Available:" $hubTGA.availableRewards.Count -ForegroundColor Green
Write-Host "-> Certificate:" $hubTGA.certificate.title -ForegroundColor Green

# 2. Test Claiming a Reward Voucher
Write-Host "`n[2] Testing Claim Reward Voucher (THAIROAM5GB - 600 pts)..." -ForegroundColor Yellow
$claimBody = @{
    voucherCode = "THAIROAM5GB"
    pointsCost = 600
} | ConvertTo-Json

$claimRes = Invoke-RestMethod -Uri "http://localhost:5000/api/expedition-summary/claim-reward" -Method Post -Body $claimBody -ContentType "application/json" -Headers $headersTGA
Write-Host "-> Claim Message:" $claimRes.message -ForegroundColor Green
Write-Host "-> Voucher Unlocked:" $claimRes.data.voucherCode "Remaining Points:" $claimRes.data.remainingPoints -ForegroundColor Green

# 3. Test Review Boost Points
Write-Host "`n[3] Testing Post-Trip Review Boost (+250 Pts)..." -ForegroundColor Yellow
$reviewBody = @{
    tourId = "tour-phi-phi"
    rating = 5
    reviewText = "Absolute breathtaking day on the Andaman Sea! Our guide Somchai was fantastic."
    favoriteMoment = "Snorkeling in the crystal clear turquoise waters of Maya Bay"
} | ConvertTo-Json

$reviewRes = Invoke-RestMethod -Uri "http://localhost:5000/api/expedition-summary/review-boost" -Method Post -Body $reviewBody -ContentType "application/json" -Headers $headersTGA
Write-Host "-> Review Result:" $reviewRes.message -ForegroundColor Green
Write-Host "-> Points Awarded:" $reviewRes.pointsAwarded "New Balance:" $reviewRes.newTotalPoints -ForegroundColor Green

# 4. Test GujjuTours
Write-Host "`n[4] Testing GujjuTours Multi-Tenant Customization..." -ForegroundColor Yellow
$headersGJT = @{ "X-Website-Hostname" = "www.gujjutours.com" }
$hubGJT = (Invoke-RestMethod -Uri "http://localhost:5000/api/expedition-summary/hub" -Headers $headersGJT).data
Write-Host "-> Destination Hub:" $hubGJT.destinationHub -ForegroundColor Green
Write-Host "-> Archetype:" $hubGJT.wrapped.travelerArchetype -ForegroundColor Green
Write-Host "-> Top Landmark:" $hubGJT.wrapped.topLandmarksVisited[0] -ForegroundColor Green
Write-Host "-> Certificate:" $hubGJT.certificate.title -ForegroundColor Green

# 5. Test Technoheaven
Write-Host "`n[5] Testing Technoheaven Multi-Tenant Customization..." -ForegroundColor Yellow
$headersTH = @{ "X-Website-Hostname" = "www.technoheaven.com" }
$hubTH = (Invoke-RestMethod -Uri "http://localhost:5000/api/expedition-summary/hub" -Headers $headersTH).data
Write-Host "-> Destination Hub:" $hubTH.destinationHub -ForegroundColor Green
Write-Host "-> Loyalty Tier:" $hubTH.loyalty.currentTier "(Badge:" $hubTH.loyalty.tierBadgeEmoji ")" -ForegroundColor Green
Write-Host "-> Certificate:" $hubTH.certificate.title -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   ALL PHASE 40 BACKEND ENDPOINTS PASSED FLAWLESSLY!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
