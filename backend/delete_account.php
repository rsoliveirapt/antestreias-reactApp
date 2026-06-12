<?php
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $user_id = $_SESSION['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(['success' => false, 'error' => 'Não autorizado']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';

    if (empty($password)) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe é obrigatória']);
        exit;
    }

    // Verify password
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Delete user
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $success = $stmt->execute([$user_id]);

        if ($success) {
            // Clear session
            session_destroy();
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Erro ao eliminar conta da base de dados']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Palavra-passe incorreta']);
    }
}
