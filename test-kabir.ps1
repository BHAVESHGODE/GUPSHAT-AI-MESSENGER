$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$BASE = "http://127.0.0.1:5004"

# Signup + Login
$rand = Get-Random -Minimum 1000 -Maximum 9999
$sBody = '{"fullName":"Kabir Tester","username":"ktest' + $rand + '","email":"ktest' + $rand + '@test.com","password":"password123","gender":"male"}'
Invoke-WebRequest -Uri "$BASE/api/auth/signup" -Method POST -ContentType "application/json" -Body $sBody -UseBasicParsing -TimeoutSec 10 -WebSession $session | Out-Null
$lBody = '{"username":"ktest' + $rand + '","password":"password123"}'
Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -ContentType "application/json" -Body $lBody -UseBasicParsing -TimeoutSec 10 -WebSession $session | Out-Null

function Test-Kabir {
    param([string]$Scenario, [string]$Prompt)
    Write-Output "`n--- SCENARIO: $Scenario ---"
    Write-Output "User: $Prompt"
    try {
        $body = '{"prompt":"' + ($Prompt -replace '"','\"') + '","characterId":"kabir"}'
        $r = Invoke-WebRequest -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 60 -WebSession $session
        $json = $r.Content | ConvertFrom-Json
        Write-Output "Kabir:"
        foreach ($msg in $json.responses) {
            Write-Output "  -> $msg"
        }
        $allText = $json.responses -join " "
        $isFallback = $allText -match "I hear you brother|Take a deep breath|Tell me more about|I hear you regarding"
        Write-Output "[Fallback: $isFallback]"
    } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
    }
}

Write-Output "============================================"
Write-Output "  KABIR AI RESPONSE QUALITY TEST"
Write-Output "============================================"

Test-Kabir "Sad/Lonely" "aaj bahut akela lag raha hai yaar, koi hai bhi ki nahi mere liye"
Test-Kabir "Breakup" "meri girlfriend ne chhod diya yaar 3 saal ka relationship tha"
Test-Kabir "Career stress" "placement nahi lag rahi, sabke lag rahi hai sirf meri nahi, parents ko kya bolunga"
Test-Kabir "Happy moment" "bhai aaj meri job lag gayi!!! dream company!!!"
Test-Kabir "Philosophical" "kya life ka koi matlab hai ya bas chalte raho:"
Test-Kabir "Funny/Casual" "bhaibest biryani kahan milti hai delhi mein"
Test-Kabir "Mental health" "raat ko neend nahi aati, overthink karta rehta hu har cheez ke baare mein"
Test-Kabir "Flirty" "ek ladki se baat ho rahi hai par pata nahi kya sochti hai wo mere baare mein"
Test-Kabir "Anger/Frustration" "yaar meri family wale meri sunte hi nahi, sab mujhe control karna chahte hain"
Test-Kabir "Deep bonding" "tu hai na bhai... kaafi hai. bas tu rehna chahiye"
