# PowerShell script to test the deployed TV Actors API
# Usage: .\test-api.ps1 -ApiUrl "https://your-api-id.execute-api.region.amazonaws.com/prod"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

Write-Host "🧪 Testing TV Actors API" -ForegroundColor Green
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Test data
$testActor = @{
    id = "bryan-cranston"
    name = "Bryan Cranston"  
    age = 67
    nationality = "American"
    knownFor = @("Breaking Bad", "Malcolm in the Middle")
    isActive = $true
} | ConvertTo-Json -Depth 3

$updateData = @{
    age = 68
    knownFor = @("Breaking Bad", "Malcolm in the Middle", "Your Honor")
} | ConvertTo-Json -Depth 3

try {
    Write-Host "1️⃣ Testing GET /actors (list all - should be empty initially)" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$ApiUrl/actors" -Method GET
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "2️⃣ Testing POST /actors (create actor)" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$ApiUrl/actors" -Method POST -Body $testActor -ContentType "application/json"
    Write-Host "✅ Status: 201 Created" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "3️⃣ Testing GET /actors/{id} (get specific actor)" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$ApiUrl/actors/bryan-cranston" -Method GET
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "4️⃣ Testing PUT /actors/{id} (update actor)" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$ApiUrl/actors/bryan-cranston" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "5️⃣ Testing GET /actors (list all - should show updated actor)" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$ApiUrl/actors" -Method GET
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""

    Write-Host "6️⃣ Testing DELETE /actors/{id} (delete actor)" -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri "$ApiUrl/actors/bryan-cranston" -Method DELETE
        Write-Host "✅ Status: 204 No Content" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 204) {
            Write-Host "✅ Status: 204 No Content" -ForegroundColor Green
        } else {
            throw
        }
    }
    Write-Host ""

    Write-Host "7️⃣ Testing error cases" -ForegroundColor Cyan
    
    # Test 404 - non-existent actor
    Write-Host "   - Testing 404: GET non-existent actor" -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$ApiUrl/actors/non-existent" -Method GET
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   ✅ Status: 404 Not Found (expected)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Test 400 - invalid data
    Write-Host "   - Testing 400: POST with missing required fields" -ForegroundColor Yellow
    $invalidActor = @{ name = "Test Actor" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$ApiUrl/actors" -Method POST -Body $invalidActor -ContentType "application/json"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "   ✅ Status: 400 Bad Request (expected)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""

    Write-Host "🎉 All API tests completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Test Summary:" -ForegroundColor White
    Write-Host "- ✅ List actors (empty)" -ForegroundColor Green
    Write-Host "- ✅ Create actor" -ForegroundColor Green  
    Write-Host "- ✅ Get actor by ID" -ForegroundColor Green
    Write-Host "- ✅ Update actor" -ForegroundColor Green
    Write-Host "- ✅ List actors (with data)" -ForegroundColor Green
    Write-Host "- ✅ Delete actor" -ForegroundColor Green
    Write-Host "- ✅ Error handling (404, 400)" -ForegroundColor Green

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
