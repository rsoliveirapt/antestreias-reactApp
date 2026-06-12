<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';
require_once 'functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$token = trim($data['token'] ?? '');
$password = $data['password'] ?? '';

if (empty($token) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Preencha todos os campos obrigatórios.']);
    exit;
}

// Password strength validation
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A palavra-passe deve ter pelo menos 8 caracteres.']);
    exit;
}
if (!preg_match('/[A-Z]/', $password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos uma letra maiúscula.']);
    exit;
}
if (!preg_match('/[a-z]/', $password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos uma letra minúscula.']);
    exit;
}
if (!preg_match('/[0-9]/', $password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos um número.']);
    exit;
}
if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos um caractere especial (ex: !@#$%^&*).']);
    exit;
}

try {
    // Check if token exists and is not expired
    $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() AND suspended = 0");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'O token de recuperação é inválido ou já expirou. Por favor, solicite uma nova recuperação.']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Update password and clear token columns
    $stmtUpdate = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?");
    $success = $stmtUpdate->execute([$hashedPassword, $user['id']]);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'A tua palavra-passe foi redefinida com sucesso. Já podes iniciar sessão com a nova credencial.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erro ao guardar a nova palavra-passe na base de dados.']);
    }

} catch (Throwable $e) {
    error_log("Reset password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno do servidor. Por favor, tente novamente mais tarde.']);
}
