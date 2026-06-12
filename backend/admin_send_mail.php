<?php
require_once 'headers.php';
require_once 'db.php';
require_once 'functions.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['message'])) {
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

$to = $data['to'];
$subject = $data['subject'];
$message = $data['message'];
$user_id = $data['user_id'] ?? null;

$success = send_email($pdo, $to, $subject, $message);

if ($success) {
    if ($user_id) {
        log_activity($pdo, $_SESSION['user_id'] ?? 0, 'user', 'Enviou e-mail para utilizador ID ' . $user_id, $user_id);
    }
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Falha ao enviar e-mail. Verifique as configurações de saída.']);
}
