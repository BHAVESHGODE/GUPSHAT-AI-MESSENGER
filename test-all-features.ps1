$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$BASE = "http://127.0.0.1:5004"
$results = @()

function Test-API {
    param([string]$Name, [string]$Method, [string]$Path, [string]$Body = $null, [int]$ExpectedStatus = 200, [int]$TimeoutSec = 30)
    $url = "$BASE$path"
    try {
        $params = @{
            Uri = $url; Method = $Method; UseBasicParsing = $true; TimeoutSec = $TimeoutSec; WebSession = $session
        }
        if ($Body) { $params.ContentType = "application/json"; $params.Body = [System.Text.Encoding]::UTF8.GetBytes($Body) }
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        $pass = $status -eq $ExpectedStatus
        $preview = if ($r.Content.Length -gt 200) { $r.Content.Substring(0, 200) + "..." } else { $r.Content }
        $script:results += [PSCustomObject]@{ Name=$Name; Status=$status; Pass=$pass; Preview=$preview }
        if ($pass) { Write-Output "PASS  $Name (HTTP $status)" } else { Write-Output "FAIL  $Name (expected $ExpectedStatus, got $status)" }
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        $pass = $code -eq $ExpectedStatus
        $detail = ""
        if ($_.Exception.Response) {
            try { $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $detail = $sr.ReadToEnd() } catch {}
            if ($detail.Length -gt 200) { $detail = $detail.Substring(0, 200) + "..." }
        }
        $script:results += [PSCustomObject]@{ Name=$Name; Status=$code; Pass=$pass; Preview=$detail }
        if ($pass) { Write-Output "PASS  $Name (HTTP $code - expected)" } else { Write-Output "FAIL  $Name (HTTP $code) - $detail" }
    }
}

$rand = Get-Random -Minimum 1000 -Maximum 9999
$username = "qatest$rand"
$email = "qa$rand@test.com"

Write-Output "`n===== 1. AUTH ====="
$signupBody = '{"fullName":"QA Tester","username":"' + $username + '","email":"' + $email + '","password":"password123","gender":"male"}'
Test-API "Signup" POST "/api/auth/signup" $signupBody 201

$loginBody = '{"username":"' + $username + '","password":"password123"}'
Test-API "Login" POST "/api/auth/login" $loginBody 200

Write-Output "`n===== 2. USERS ====="
Test-API "Get sidebar users" GET "/api/users/" $null 200

Write-Output "`n===== 3. PROFILE ====="
Test-API "Update profile" PUT "/api/users/profile" '{"fullName":"QA Tester Pro","bio":"Automated QA testing"}' 200

Write-Output "`n===== 4. AI CHARACTERS ====="
Test-API "List AI characters" GET "/api/ai/characters" $null 200

Write-Output "`n===== 5. AI CHAT ====="
Test-API "Chat with Kabir" POST "/api/ai/chat" '{"prompt":"Hi Kabir, how are you today?","characterId":"kabir"}' 200 60
Test-API "Chat with Sid" POST "/api/ai/chat" '{"prompt":"Hey Sid, got any jokes?","characterId":"sid"}' 200 60

Write-Output "`n===== 6. AI TRANSLATE ====="
Test-API "Translate to Spanish" POST "/api/ai/translate" '{"text":"Hello, how are you?","targetLanguage":"Spanish"}' 200 60

Write-Output "`n===== 7. AI SMART REPLIES ====="
Test-API "Smart replies" POST "/api/ai/smart-replies" '{"lastMessage":"Where are you?"}' 200

Write-Output "`n===== 8. MESSAGES - AI PIPELINE ====="
Test-API "Send msg to Kabir" POST "/api/messages/send/650000000000000000000001" '{"message":"Hey Kabir, feeling a bit down today"}' 201 60
Test-API "Get msgs from Kabir" GET "/api/messages/650000000000000000000001" $null 200

Write-Output "`n===== 9. MESSAGES - AI TARA ====="
Test-API "Send msg to Tara" POST "/api/messages/send/650000000000000000000002" '{"message":"Hey Tara!"}' 201 60

Write-Output "`n===== 10. GROUPS ====="
Test-API "Create group" POST "/api/groups/create" '{"groupName":"QA Test Group","participantIds":["650000000000000000000002"]}' 201
Test-API "Get my groups" GET "/api/groups/" $null 200

Write-Output "`n===== 11. CALLS ====="
Test-API "Log missed call" POST "/api/messages/call/650000000000000000000002" '{"callType":"audio","status":"missed","duration":0}' 201
Test-API "Get call history" GET "/api/messages/calls/650000000000000000000002" $null 200

Write-Output "`n===== 12. BLOCK/UNBLOCK ====="
Test-API "Block user" PUT "/api/users/block/650000000000000000000003" $null 200
Test-API "Unblock user" PUT "/api/users/block/650000000000000000000003" $null 200

Write-Output "`n===== 13. LOGOUT ====="
Test-API "Logout" POST "/api/auth/logout" $null 200
Test-API "Verify logged out (401)" GET "/api/users/" $null 401

Write-Output "`n========== RESULTS =========="
$passed = ($results | Where-Object { $_.Pass -eq $true }).Count
$failed = ($results | Where-Object { $_.Pass -eq $false }).Count
Write-Output "Total: $($results.Count) | Passed: $passed | Failed: $failed"
if ($failed -gt 0) {
    Write-Output "`nFAILED:"
    $results | Where-Object { $_.Pass -eq $false } | ForEach-Object { Write-Output "  $($_.Name): HTTP $($_.Status) | $($_.Preview)" }
}
