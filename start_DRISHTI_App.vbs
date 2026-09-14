Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Launch FastAPI Backend silently in background (0 = hidden window)
WshShell.Run "cmd /c cd /d """ & strPath & "\backend"" && python -m uvicorn main:app --host 127.0.0.1 --port 8008 --reload", 0, False

' 2. Wait 2.5 seconds for FastAPI server to initialize
WScript.Sleep 2500

' 3. Launch React Frontend silently in background (0 = hidden window)
WshShell.Run "cmd /c cd /d """ & strPath & "\frontend"" && npm run dev -- --host 127.0.0.1 --port 5173", 0, False

' 4. Wait 2 seconds for Vite dev server
WScript.Sleep 2000

' 5. Open default web browser at http://127.0.0.1:5173
WshShell.Run "http://127.0.0.1:5173"
