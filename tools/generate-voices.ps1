$ErrorActionPreference = 'Stop'
$voiceRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/voices'
$voiceManifest = Get-Content -LiteralPath (Join-Path $voiceRoot 'manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
if ($voiceManifest.engine -notmatch 'Windows SAPI') { throw 'This is the legacy SAPI generator. Use tools/generate-voicevox.py for v1.6 voices.' }
foreach ($voiceProfileProperty in $voiceManifest.profiles.PSObject.Properties) {
  $voiceCharacter = $voiceProfileProperty.Name
  $voiceProfile = $voiceProfileProperty.Value
  $voiceSynth = New-Object -ComObject SAPI.SpVoice
  $voiceToken = New-Object -ComObject SAPI.SpObjectToken
  $voiceToken.SetId(('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_jaJP_' + $voiceProfile.voice + 'M'), '', $false)
  $voiceSynth.Voice = $voiceToken
  $voiceSynth.Rate = $voiceProfile.rate
  $voiceSynth.Volume = 100
  foreach ($voiceLine in $voiceProfile.lines.PSObject.Properties) {
    $voiceOutput = Join-Path $voiceRoot ($voiceCharacter + '-' + $voiceLine.Name + '.wav')
    $voiceStream = New-Object -ComObject SAPI.SpFileStream
    $voiceStream.Format.Type = 22 # PCM, 22.05 kHz, mono, 16-bit
    try {
      $voiceStream.Open($voiceOutput, 3, $false)
      $voiceSynth.AudioOutputStream = $voiceStream
      $voiceXml = '<pitch absmiddle="' + $voiceProfile.pitch + '">' + [System.Security.SecurityElement]::Escape($voiceLine.Value) + '</pitch>'
      [void]$voiceSynth.Speak($voiceXml, 8) # SVSFIsXML, synchronous, file output only
    } finally { $voiceStream.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($voiceStream) }
  }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($voiceSynth)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($voiceToken)
  Write-Output ($voiceCharacter + ': ' + $voiceProfile.lines.PSObject.Properties.Name.Count + ' clips generated')
}
