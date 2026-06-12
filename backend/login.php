<?php
require 'headers.php';
session_start();
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Preencha todos os campos.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, email, email_verified, password, role, permissions, avatar, first_name, last_name, two_factor_secret, two_factor_confirmed_at FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            require_once 'functions.php';
            $confirmEmail = get_setting($pdo, 'auth.confirm_email', 'false');
            if (($confirmEmail === 'true' || $confirmEmail === '1') && isset($user['email_verified']) && $user['email_verified'] == '0') {
                echo json_encode([
                    'success' => false,
                    'requires_email_verification' => true,
                    'email' => $user['email'],
                    'message' => 'Por favor, confirma o teu endereço de e-mail antes de iniciares sessão.'
                ]);
                exit;
            }

            // Check for 2FA
            if (!empty($user['two_factor_confirmed_at'])) {
                $code = $data['code'] ?? '';
                if (empty($code)) {
                    echo json_encode([
                        'success' => true,
                        'requires_2fa' => true
                    ]);
                    exit;
                }

                // Verify the 2FA code
                if (!verifyCode($user['two_factor_secret'], $code)) {
                    echo json_encode(['success' => false, 'message' => 'Código 2FA inválido.']);
                    exit;
                }
            }

            // Success! Start session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['username'] = $user['username'];

            // Force immediate registration in visitor_log for Dashboard history
            require_once 'functions.php';
            track_visitor($pdo);

            // Register session in database for "Active Sessions" menu
            try {
                $session_id = session_id();
                $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
                $ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
                
                $stmt = $pdo->prepare("INSERT INTO active_sessions (user_id, session_id, user_agent, ip_address, last_activity) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE last_activity = NOW(), user_agent = ?, ip_address = ?");
                $stmt->execute([$user['id'], $session_id, $user_agent, $ip_address, $user_agent, $ip_address]);
            } catch (Exception $e) {
                // Ignore if table structure is different, at least login works
            }
            
            // Populate permissions
            $user['permissions'] = get_user_permissions($pdo, $user['role'], $user['permissions']);
            
            // Remove sensitive fields
            unset($user['password']);
            unset($user['two_factor_secret']);
            
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'E-mail ou palavra-passe incorretos.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro interno do servidor.']);
    }
}

// Helper function (same as in two_factor.php)
function verifyCode($secret, $code) {
    $timeStep = floor(time() / 30);
    for ($i = -1; $i <= 1; $i++) {
        if (calculateCode($secret, $timeStep + $i) === $code) return true;
    }
    return false;
}

function calculateCode($secret, $timeStep) {
    $secretKey = base32Decode($secret);
    $timeStepBinary = pack('N*', 0) . pack('N*', $timeStep);
    $hash = hash_hmac('sha1', $timeStepBinary, $secretKey, true);
    $offset = ord($hash[19]) & 0xf;
    $otp = (((ord($hash[$offset+0]) & 0x7f) << 24) | ((ord($hash[$offset+1]) & 0xff) << 16) | ((ord($hash[$offset+2]) & 0xff) << 8) | (ord($hash[$offset+3]) & 0xff)) % 1000000;
    return str_pad($otp, 6, '0', STR_PAD_LEFT);
}

function base32Decode($base32) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $map = array_flip(str_split($chars));
    $base32 = strtoupper($base32);
    $binary = ''; $buffer = 0; $bufferSize = 0;
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
