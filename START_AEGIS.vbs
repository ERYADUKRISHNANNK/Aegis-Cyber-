Set objShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Start Backend
objShell.Run "cmd /k cd /d """ & strPath & "backend"" && npm run dev", 1, False
WScript.Sleep 5000

' Start Frontend
objShell.Run "cmd /k cd /d """ & strPath & "frontend"" && npm run dev", 1, False
WScript.Sleep 4000

' Open browser
objShell.Run "http://localhost:3000"

MsgBox "Aegis is running!" & vbNewLine & vbNewLine & _
       "On this PC:    http://localhost:3000" & vbNewLine & _
       "On your phone: http://192.168.1.5:3000" & vbNewLine & vbNewLine & _
       "Login: admin / admin", 64, "Aegis Cyber Platform"
