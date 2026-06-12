<?php
require_once 'headers.php';
require_once 'db.php';
require_once 'functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'generate') {
    // 1. Gerar Secret Key (Base32)
    $secret = generateBase32Secret();
    
    // 2. Guardar temporariamente na sessão ou BD (mas sem confirmar)
    $stmt = $pdo->prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?");
    $stmt->execute([$secret, $user_id]);
    
    // 3. Obter username real para o Label
    $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $uData = $stmt->fetch();
    $username = $uData['username'] ?? 'Privado';
    
    $issuer = "Antestreias";
    $qrCodeUrl = "otpauth://totp/" . urlencode($username) . "?secret=" . $secret . "&issuer=" . urlencode($issuer);
    
    echo json_encode([
        'secret' => $secret,
        'qrCodeUrl' => $qrCodeUrl
    ]);
}

if ($action === 'confirm') {
    $data = json_decode(file_get_contents('php://input'), true);
    $code = $data['code'] ?? '';
    
    $stmt = $pdo->prepare("SELECT two_factor_secret FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user || !$user['two_factor_secret']) {
        echo json_encode(['error' => 'Secret não gerado']);
        exit;
    }
    
    if (verifyCode($user['two_factor_secret'], $code)) {
        // Sucesso! Confirmar 2FA
        $stmt = $pdo->prepare("UPDATE users SET two_factor_confirmed_at = NOW() WHERE id = ?");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Código inválido. Tenta novamente.']);
    }
}

if ($action === 'status') {
    $stmt = $pdo->prepare("SELECT two_factor_confirmed_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    echo json_encode(['enabled' => !empty($user['two_factor_confirmed_at'])]);
}

if ($action === 'disable') {
    $stmt = $pdo->prepare("UPDATE users SET two_factor_secret = NULL, two_factor_confirmed_at = NULL WHERE id = ?");
    $success = $stmt->execute([$user_id]);
    echo json_encode(['success' => $success]);
}

// --- Funções Auxiliares TOTP ---

function generateBase32Secret($length = 16) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = '';
    for ($i = 0; $i < $length; $i++) {
        $secret .= $chars[random_int(0, 31)];
    }
    return $secret;
}

function verifyCode($secret, $code) {
    $timeStep = floor(time() / 30);
    
    // Verificar janela de 1 passo para compensar atrasos no relógio
    for ($i = -1; $i <= 1; $i++) {
        if (calculateCode($secret, $timeStep + $i) === $code) {
            return true;
        }
    }
    return false;
}

function calculateCode($secret, $timeStep) {
    $secretKey = base32Decode($secret);
    $timeStepBinary = pack('N*', 0) . pack('N*', $timeStep);
    $hash = hash_hmac('sha1', $timeStepBinary, $secretKey, true);
    $offset = ord($hash[19]) & 0xf;
    $otp = (
        ((ord($hash[$offset+0]) & 0x7f) << 24) |
        ((ord($hash[$offset+1]) & 0xff) << 16) |
        ((ord($hash[$offset+2]) & 0xff) << 8) |
        (ord($hash[$offset+3]) & 0xff)
    ) % 1000000;
    
    return str_pad($otp, 6, '0', STR_PAD_LEFT);
}

function base32Decode($base32) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $map = array_flip(str_split($chars));
    $base32 = strtoupper($base32);
    $binary = '';
    $buffer = 0;
    $bufferSize = 0;
    
    foreach (str_split($base32) as $char) {
        if (!isset($map[$char])) continue;
        $buffer = ($buffer << 5) | $map[$char];
        $bufferSize += 5;
        if ($bufferSize >= 8) {
            $bufferSize -= 8;
            $binary .= chr(($buffer >> $bufferSize) & 0xff);
        }
    }
    return $binary;
}
