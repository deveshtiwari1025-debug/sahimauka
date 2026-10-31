# Reads the stored GitHub credential (Windows Credential Manager) OFFLINE via
# CredRead and writes it to a temp file. Used because `git credential fill`
# hangs (GCM online validation). The temp file is deleted by the caller.
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredMan5 {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool CredReadW(string target, int type, int flags, out IntPtr credPtr);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
}
"@
$ptr = [IntPtr]::Zero
if (-not [CredMan5]::CredReadW("git:https://github.com", 1, 0, [ref]$ptr)) { exit 1 }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan5+CREDENTIAL])
$bytes = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bytes, 0, $bytes.Length)
[CredMan5]::CredFree($ptr)
[IO.File]::WriteAllText("$env:TEMP\gh_token_now.txt", [Text.Encoding]::UTF8.GetString($bytes).Trim())
Write-Output "token-exported:$($bytes.Length)"
