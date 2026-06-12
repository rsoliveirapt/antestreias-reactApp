<?php
require 'headers.php';
require 'db.php';
require_once 'functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? 'verify';
    $email = trim($data['email'] ?? '');

    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'E-mail não fornecido.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, first_name, email_verified, verification_token FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Utilizador não encontrado.']);
            exit;
        }

        if ($user['email_verified'] == 1) {
            echo json_encode(['success' => true, 'already_verified' => true, 'message' => 'O teu e-mail já se encontra validado!']);
            exit;
        }

        if ($action === 'verify') {
            $code = trim($data['code'] ?? '');
            if (empty($code)) {
                echo json_encode(['success' => false, 'message' => 'Introduz o código de verificação.']);
                exit;
            }

            if ($user['verification_token'] === $code) {
                $stmtUp = $pdo->prepare("UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?");
                $stmtUp->execute([$user['id']]);
                echo json_encode(['success' => true, 'message' => 'E-mail validado com sucesso! Já podes iniciar sessão.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Código de verificação incorreto.']);
            }
        } elseif ($action === 'resend') {
            $newToken = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
            $stmtUp = $pdo->prepare("UPDATE users SET verification_token = ? WHERE id = ?");
            $stmtUp->execute([$newToken, $user['id']]);

            // Obter template de email
            $stmtTpl = $pdo->prepare("SELECT subject, body FROM email_templates WHERE slug = 'verify_email'");
            $stmtTpl->execute();
            $tpl = $stmtTpl->fetch(PDO::FETCH_ASSOC);
            
            $subject = $tpl ? $tpl['subject'] : 'Confirma o teu e-mail - Antestreias';
            $body = $tpl ? $tpl['body'] : '<p>Olá {{name}},</p><p>O teu novo código de verificação é: <strong>{{code}}</strong></p>';
            
            $displayName = !empty($user['first_name']) ? $user['first_name'] : $user['username'];
            $body = str_replace(['{{name}}', '{{code}}'], [$displayName, $newToken], $body);
            
            send_email($pdo, $email, $subject, $body);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Novo código de verificação enviado para o teu e-mail!'
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro interno do servidor.']);
    }
}
