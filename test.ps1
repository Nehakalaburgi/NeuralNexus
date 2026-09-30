# 1. Fetch current database state
$state = Invoke-RestMethod -Uri "http://localhost:5000/api/state" -Method Get

$medEmergency = $state.incidents \vert{} Where-Object {$_.title -like "*Medical Emergency*" } | Select-Object -First 1
$amb01 = $state.resources \vert{} Where-Object {$_.callsign -eq "Ambulance 01" } | Select-Object -First 1
$amb02 = $state.resources \vert{} Where-Object {$_.callsign -eq "Ambulance 02" } | Select-Object -First 1

Write-Host "Found Incident ID: $($medEmergency._id)" -ForegroundColor Cyan
Write-Host "Found Amb 01 ID:   $($amb01._id)" -ForegroundColor Cyan
Write-Host "Found Amb 02 ID:   $($amb02._id)" -ForegroundColor Cyan

# 2. Assign Ambulance 02 to Medical Emergency
Write-Host "`n--- Dispatching Ambulance 02 ---" -ForegroundColor Yellow
$assignPayload = @{
  incidentId = $medEmergency._id
  proposedResourceId = $amb02._id
  reason = "Nearest unit"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/validate-and-assign" -Method Post -ContentType "application/json" -Body $assignPayload

# 3. Simulate Disruption (Ambulance 02 OUT_OF_SERVICE)
Write-Host "`n--- Taking Ambulance 02 OUT_OF_SERVICE ---" -ForegroundColor Yellow
$statusPayload = @{ status = "OUT_OF_SERVICE" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/resources/$($amb02._id)/status" -Method Patch -ContentType "application/json" -Body $statusPayload

# 4. Test Authority Sentinel (Attempt assigning disabled Ambulance 02)
Write-Host "`n--- Testing Authority Sentinel Rejection ---" -ForegroundColor Yellow
try {
  Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/validate-and-assign" -Method Post -ContentType "application/json" -Body $assignPayload
} catch {
  Write-Host "Sentinel successfully blocked assignment: $($_.Exception.Message)" -ForegroundColor Green
}

# 5. Approve Human Reallocation to Ambulance 01
Write-Host "`n--- Approving Reassignment to Ambulance 01 ---" -ForegroundColor Yellow
$approvalPayload = @{
  incidentId = $medEmergency._id
  proposedResourceId = $amb01._id
  rationale = "Ambulance 01 reassigned to restore coverage."
  approved = $true
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/assignments/approve" -Method Post -ContentType "application/json" -Body $approvalPayload
