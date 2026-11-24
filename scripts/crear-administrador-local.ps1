$ErrorActionPreference = "Stop"

$firstSecure = Read-Host "Contraseña temporal para administrador" -AsSecureString
$secondSecure = Read-Host "Confirma la contraseña temporal" -AsSecureString
$firstPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($firstSecure)
$secondPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secondSecure)

try {
    $first = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPointer)
    $second = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPointer)

    if ($first -cne $second) {
        throw "Las contraseñas no coinciden. No se realizaron cambios."
    }
    if ($first.Length -lt 12 -or $first.Length -gt 128) {
        throw "La contraseña debe tener entre 12 y 128 caracteres."
    }

    $env:NH_ADMIN_PASSWORD = $first
    $bootstrapScript = Join-Path $PSScriptRoot "bootstrap-administrador-local.cjs"
    & node --env-file=.env $bootstrapScript
    if ($LASTEXITCODE -ne 0) {
        throw "El inicializador de la cuenta terminó con error."
    }
}
finally {
    Remove-Item Env:NH_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    if ($firstPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPointer)
    }
    if ($secondPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPointer)
    }
    $first = $null
    $second = $null
}
