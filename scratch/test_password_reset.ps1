# Test Password Reset Feature End-to-End

$testEmail = "admin@antestreias.pt" # Replace with actual email if needed
$baseUrl = "http://localhost/antestreias/v2/api"

Write-Host "1. Testing forgot_password.php requesting reset..." -ForegroundColor Cyan
$forgotPayload = @{ email = $testEmail } | ConvertTo-Json
try {
    $forgotRes = Invoke-RestMethod -Uri "$baseUrl/forgot_password.php" -Method Post -Body $forgotPayload -ContentType "application/json"
    Write-Host "Response: $($forgotRes | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "Error during forgot password request: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Checking database for generated token..." -ForegroundColor Cyan
# Query the DB using XAMPP PHP
$queryCode = @'
<?php
require 'db.php';
$stmt = $pdo->prepare("SELECT reset_token, reset_token_expires FROM users WHERE email = 'admin@antestreias.pt'");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($user);
'@
$tempFile = "c:\xampp\htdocs\antestreias\v2\api\temp_query_token.php"
$queryCode | Out-File -FilePath $tempFile -Encoding utf8

$dbDataJson = C:\xampp\php\php.exe $tempFile
Remove-Item -Path $tempFile -Force

Write-Host "Database record: $dbDataJson" -ForegroundColor Gray
$dbData = $dbDataJson | ConvertFrom-Json
$token = $dbData.reset_token
$expires = $dbData.reset_token_expires

if ([string]::IsNullOrEmpty($token)) {
    Write-Host "No reset token found in database for email $testEmail." -ForegroundColor Red
    exit 1
}
Write-Host "Token generated: $token" -ForegroundColor Green
Write-Host "Expires at: $expires" -ForegroundColor Green

Write-Host "`n3. Testing reset_password.php using the token..." -ForegroundColor Cyan
$newPassword = "Password123!" # Meets requirements (length >= 8, upper, lower, digit, special)
$resetPayload = @{
    token = $token
    password = $newPassword
} | ConvertTo-Json

try {
    $resetRes = Invoke-RestMethod -Uri "$baseUrl/reset_password.php" -Method Post -Body $resetPayload -ContentType "application/json"
    Write-Host "Response: $($resetRes | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "Error during password reset request: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Confirming token is cleared in database..." -ForegroundColor Cyan
$queryCode2 = @'
<?php
require 'db.php';
$stmt = $pdo->prepare("SELECT reset_token, reset_token_expires FROM users WHERE email = 'admin@antestreias.pt'");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($user);
'@
$tempFile2 = "c:\xampp\htdocs\antestreias\v2\api\temp_query_token2.php"
$queryCode2 | Out-File -FilePath $tempFile2 -Encoding utf8

$dbDataJson2 = C:\xampp\php\php.exe $tempFile2
Remove-Item -Path $tempFile2 -Force

Write-Host "Database record after reset: $dbDataJson2" -ForegroundColor Gray
$dbData2 = $dbDataJson2 | ConvertFrom-Json

if (![string]::IsNullOrEmpty($dbData2.reset_token)) {
    Write-Host "Token was NOT cleared after reset!" -ForegroundColor Red
    exit 1
}
Write-Host "Token successfully cleared in database." -ForegroundColor Green
Write-Host "SUCCESS: Password Reset Flow completed and verified successfully." -ForegroundColor Green
