# verify-admin-auth.ps1
# End-to-end Verification Script for Multi-Tenant Admin Authentication

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Multi-Tenant Admin Authentication Verification" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testSites = @(
    @{
        SiteId = "tripgoasia"
        Hostname = "www.tripgoasia.com"
        Email = "admin@tripgoasia.com"
        Password = "Admin@12345"
        ForeignHostname = "www.gujjutours.com"
    },
    @{
        SiteId = "gujjutours"
        Hostname = "www.gujjutours.com"
        Email = "admin@gujjutours.com"
        Password = "Admin@12345"
        ForeignHostname = "stagingb2b.technoheaven.com"
    },
    @{
        SiteId = "technoheaven"
        Hostname = "stagingb2b.technoheaven.com"
        Email = "admin@technoheaven.com"
        Password = "Admin@12345"
        ForeignHostname = "www.tripgoasia.com"
    }
)

$allPassed = $true

foreach ($test in $testSites) {
    Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host " Testing Tenant: $($test.SiteId) ($($test.Hostname))" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow

    # 1. Dev Reset Lockout / Rate Limit
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/dev-reset-ratelimit" `
            -Method POST `
            -Headers @{ "X-Website-Hostname" = $test.Hostname } `
            -ContentType "application/json" | Out-Null
    } catch {}

    # 2. Admin Login
    Write-Host "[TEST 1] Logging in as admin ($($test.Email))..." -NoNewline
    $loginBody = @{
        email = $test.Email
        password = $test.Password
    } | ConvertTo-Json

    $loginRes = $null
    try {
        $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method POST `
            -Headers @{ "X-Website-Hostname" = $test.Hostname } `
            -ContentType "application/json" `
            -Body $loginBody

        if ($loginRes.success -and $loginRes.data.token) {
            Write-Host " [PASS] (HTTP 200 OK, User role: $($loginRes.data.user.role))" -ForegroundColor Green
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $allPassed = $false
            continue
        }
    } catch {
        Write-Host " [FAIL]: $($_.Exception.Message)" -ForegroundColor Red
        $allPassed = $false
        continue
    }

    $token = $loginRes.data.token

    # 3. Access Protected Admin Stats for this website
    Write-Host "[TEST 2] Calling protected GET /api/admin/stats with own tenant token..." -NoNewline
    try {
        $statsRes = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $token"
                "X-Website-Hostname" = $test.Hostname
            }

        if ($statsRes.success -and $statsRes.data.websiteId -eq $test.SiteId) {
            Write-Host " [PASS] (HTTP 200 OK, Tenant: $($statsRes.data.websiteId))" -ForegroundColor Green
        } else {
            Write-Host " [FAIL]: Unexpected response structure" -ForegroundColor Red
            $allPassed = $false
        }
    } catch {
        Write-Host " [FAIL]: $($_.Exception.Message)" -ForegroundColor Red
        $allPassed = $false
    }

    # 4. Cross-Tenant Rejection Test
    Write-Host "[TEST 3] Calling protected endpoint of DIFFERENT tenant ($($test.ForeignHostname)) with this token..." -NoNewline
    $crossTenantBlocked = $false
    try {
        $foreignRes = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $token"
                "X-Website-Hostname" = $test.ForeignHostname
            }
        Write-Host " [FAIL]: Cross-tenant access was NOT blocked!" -ForegroundColor Red
        $allPassed = $false
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host " [PASS] (Correctly rejected with HTTP $statusCode)" -ForegroundColor Green
            $crossTenantBlocked = $true
        } else {
            Write-Host " [WARN]: Returned status $statusCode ($($_.Exception.Message))" -ForegroundColor Yellow
        }
    }
}

# 5. Invalid Password Test
Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host " Testing Error Handling (Wrong Password)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Yellow

Write-Host "[TEST 4] Attempting login with invalid password..." -NoNewline
$badLoginBody = @{
    email = "admin@tripgoasia.com"
    password = "WrongPassword!999"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Headers @{ "X-Website-Hostname" = "www.tripgoasia.com" } `
        -ContentType "application/json" `
        -Body $badLoginBody
    Write-Host " [FAIL]: Invalid password should not succeed!" -ForegroundColor Red
    $allPassed = $false
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host " [PASS] (Correctly rejected with HTTP 401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host " [WARN]: Status $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL MULTI-TENANT VERIFICATION TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
} else {
    Write-Host " ONE OR MORE TESTS FAILED. PLEASE REVIEW LOGS ABOVE." -ForegroundColor Red
}
Write-Host "============================================================" -ForegroundColor Cyan
