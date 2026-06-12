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

$data = json_decode(file_get_contents('php://input'), true);

$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

if (empty($current_password) || empty($new_password)) {
    echo json_encode(['error' => 'Preenche todos os campos']);
    exit;
}

if ($new_password !== $confirm_password) {
    echo json_encode(['error' => 'As novas palavras-passe não coincidem']);
    exit;
}

// 1. Verificar password atual
$stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user || !password_verify($current_password, $user['password'])) {
    echo json_encode(['error' => 'A palavra-passe atual está incorreta']);
    exit;
}

// 2. Atualizar para a nova
$hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
$success = $stmt->execute([$hashed_password, $user_id]);

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Palavra-passe atualizada com sucesso']);
} else {
    echo json_encode(['error' => 'Erro ao atualizar a base de dados']);
}
