# Automated Access Modes Test Script using Curl
$baseUrl = "http://127.0.0.1/antestreias/v2/backend"
$cookieFile = Join-Path (Get-Location) "scratch/cookies.txt"

# Ensure cookie file is clean initially
if (Test-Path $cookieFile) {
    Remove-Item $cookieFile -Force
}

Write-Host "--- Starting Access Modes API Test (Curl-Based) ---" -ForegroundColor Cyan

# Helper function to check status of a request using curl.exe
function Test-Request {
    param(
        [string]$Url,
        [string]$Method = "GET",
        $Body = $null,
        [bool]$UseSession = $false,
        [int]$ExpectedStatus = 200
    )
    
    $tempOutFile = [System.IO.Path]::GetTempFileName()
    $tempBodyFile = $null
    
    # Base arguments for curl.exe
    # -s (silent), -w "%{http_code}" (write http status to stdout), -X (HTTP method), -o (output file)
    $curlArgs = @("-s", "-w", "%{http_code}", "-X", $Method, "-o", $tempOutFile)
    
    # Headers
    $curlArgs += @("-H", "Accept: application/json")
    
    # Session cookie handling
    if ($UseSession) {
        $curlArgs += @("-b", $cookieFile, "-c", $cookieFile)
    }
    
    # Body handling
    if ($Body) {
        $tempBodyFile = [System.IO.Path]::GetTempFileName()
        $BodyJson = $Body | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($tempBodyFile, $BodyJson)
        $curlArgs += @("-H", "Content-Type: application/json", "-d", "@$tempBodyFile")
    }
    
    $curlArgs += $Url
    
    # Run curl
    $statusCodeStr = & curl.exe @curlArgs
    $statusCode = [int]$statusCodeStr.Trim()
    
    # Read response body
    $content = Get-Content -Raw -Path $tempOutFile -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        $content = ""
    }
    
    # Cleanup temp files
    Remove-Item $tempOutFile -Force
    if ($tempBodyFile) {
        Remove-Item $tempBodyFile -Force
    }
    
    if ($statusCode -eq $ExpectedStatus) {
        Write-Host "[PASS] $Method $Url (Status: $statusCode, Expected: $ExpectedStatus)" -ForegroundColor Green
        return [PSCustomObject]@{ StatusCode = $statusCode; Content = $content }
    } else {
        Write-Host "[FAIL] $Method $Url (Status: $statusCode, Expected: $ExpectedStatus)" -ForegroundColor Red
        Write-Host "Response content: $content" -ForegroundColor Yellow
        # Cleanup cookies before exiting
        if (Test-Path $cookieFile) { Remove-Item $cookieFile -Force }
        exit 1
    }
}

# 1. Verify normal access mode initially
Write-Host "`n1. Setting portal state to 'normal' directly in database..." -ForegroundColor Yellow
C:\xampp\php\php.exe -r "require 'backend/db.php'; `$stmt = `$pdo->prepare('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?'); `$stmt->execute(['access_mode', 'normal', 'normal']);"

Write-Host "Checking that movies.php is publicly accessible..." -ForegroundColor Yellow
$resNormal = Test-Request -Url "$baseUrl/movies.php" -ExpectedStatus 200

# 2. Log in as admin and capture session cookies
Write-Host "`n2. Logging in as admin..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@antestreias.pt"
    password = "Password123!"
}
$loginRes = Test-Request -Url "$baseUrl/login.php" -Method "POST" -Body $loginPayload -UseSession $true -ExpectedStatus 200
$loginJson = $loginRes.Content | ConvertFrom-Json
if (-not $loginJson.success) {
    Write-Host "Admin login failed: $($loginJson.message)" -ForegroundColor Red
    if (Test-Path $cookieFile) { Remove-Item $cookieFile -Force }
    exit 1
}
Write-Host "Admin login succeeded!" -ForegroundColor Green

# 3. Change portal state to 'maintenance'
Write-Host "`n3. Setting portal state to 'maintenance' directly in database..." -ForegroundColor Yellow
C:\xampp\php\php.exe -r "require 'backend/db.php'; `$stmt = `$pdo->prepare('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?'); `$stmt->execute(['access_mode', 'maintenance', 'maintenance']);"

# 4. Verify anonymous requests to general pages are blocked with 503
Write-Host "`n4. Testing anonymous request to movies.php under maintenance mode..." -ForegroundColor Yellow
$resBlock = Test-Request -Url "$baseUrl/movies.php" -ExpectedStatus 503
$blockJson = $resBlock.Content | ConvertFrom-Json
if ($blockJson.access_mode -ne "maintenance") {
    Write-Host "Failed: expected access_mode = maintenance in error response." -ForegroundColor Red
    if (Test-Path $cookieFile) { Remove-Item $cookieFile -Force }
    exit 1
}
Write-Host "Anonymous request was correctly blocked with 503." -ForegroundColor Green

# 5. Verify admin requests are exempted and succeed
Write-Host "`n5. Testing authenticated admin request to movies.php..." -ForegroundColor Yellow
$resAdmin = Test-Request -Url "$baseUrl/movies.php" -UseSession $true -ExpectedStatus 200
Write-Host "Admin request was correctly allowed (HTTP 200)." -ForegroundColor Green

# 6. Verify public configuration files are allowed anonymous access
Write-Host "`n6. Testing anonymous request to admin_appearance.php (public config)..." -ForegroundColor Yellow
$resConfig = Test-Request -Url "$baseUrl/admin_appearance.php" -ExpectedStatus 200
Write-Host "Public configuration endpoint allowed anonymous access (HTTP 200)." -ForegroundColor Green

# 7. Change portal state to 'coming_soon'
Write-Host "`n7. Setting portal state to 'coming_soon' directly in database..." -ForegroundColor Yellow
C:\xampp\php\php.exe -r "require 'backend/db.php'; `$stmt = `$pdo->prepare('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?'); `$stmt->execute(['access_mode', 'coming_soon', 'coming_soon']);"

# 8. Verify anonymous requests are blocked with 503 under coming_soon
Write-Host "`n8. Testing anonymous request to movies.php under coming_soon mode..." -ForegroundColor Yellow
$resBlockCS = Test-Request -Url "$baseUrl/movies.php" -ExpectedStatus 503
$blockJsonCS = $resBlockCS.Content | ConvertFrom-Json
if ($blockJsonCS.access_mode -ne "coming_soon") {
    Write-Host "Failed: expected access_mode = coming_soon in error response." -ForegroundColor Red
    if (Test-Path $cookieFile) { Remove-Item $cookieFile -Force }
    exit 1
}
Write-Host "Anonymous request was correctly blocked with 503 under Coming Soon mode." -ForegroundColor Green

# 9. Restore normal portal state
Write-Host "`n9. Restoring portal state to 'normal' directly in database..." -ForegroundColor Yellow
C:\xampp\php\php.exe -r "require 'backend/db.php'; `$stmt = `$pdo->prepare('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?'); `$stmt->execute(['access_mode', 'normal', 'normal']);"

# 10. Verify public access is restored
Write-Host "`n10. Testing anonymous request to movies.php..." -ForegroundColor Yellow
$resNormalFinal = Test-Request -Url "$baseUrl/movies.php" -ExpectedStatus 200
Write-Host "Public access successfully restored (HTTP 200)." -ForegroundColor Green

# Cleanup
if (Test-Path $cookieFile) {
    Remove-Item $cookieFile -Force
}

Write-Host "`n*** ALL TESTS PASSED SUCCESSFULLY! ***" -ForegroundColor Green
