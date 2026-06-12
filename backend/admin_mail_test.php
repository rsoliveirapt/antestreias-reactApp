<?php
require_once 'headers.php';
require_once 'db.php';
require_once 'functions.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    exit;
}

$to = $data['to'] ?? $data['from_address']; 
$subject = $data['subject'] ?? "E-mail de Teste - Antestreias";
$message = $data['message'] ?? "Este é um e-mail de teste para verificar as definições de saída do site Antestreias.<br><br>Se recebeu este e-mail, as suas configurações estão corretas!";

// Use the new send_email function with overrides to test BEFORE saving
// We use a global to capture the error since send_email returns boolean
global $last_mail_error;
$success = send_email($pdo, $to, $subject, $message, $data);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Falha no envio: ' . ($last_mail_error ?? 'Erro desconhecido. Verifique as credenciais.')]);
}


