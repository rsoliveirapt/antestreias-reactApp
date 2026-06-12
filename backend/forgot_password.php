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
$email = trim($data['email'] ?? '');

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'O endereço de e-mail é obrigatório']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Endereço de e-mail inválido']);
    exit;
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, username, first_name FROM users WHERE email = ? AND suspended = 0");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Generate secure token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Save token to DB
        $stmtUpdate = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
        $stmtUpdate->execute([$token, $expires, $user['id']]);

        // Get template of email
        $stmtTpl = $pdo->prepare("SELECT subject, body FROM email_templates WHERE slug = 'password_reset'");
        $stmtTpl->execute();
        $tpl = $stmtTpl->fetch(PDO::FETCH_ASSOC);
        
        $subject = $tpl ? $tpl['subject'] : 'Recuperação de Palavra-Passe - Antestreias';
        $body = $tpl ? $tpl['body'] : '<p>Olá {{name}},</p><p>Para repor a tua palavra-passe, clica no link: <a href="{{reset_link}}">Repor Palavra-Passe</a></p>';
        
        // Determine the frontend base URL dynamically (using HTTP_ORIGIN or HTTP_REFERER, or fallback)
        $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? 'http://localhost:5173';
        // Clean trailing slash from origin
        $origin = rtrim($origin, '/');
        
        // If referer is page, e.g. http://localhost:5173/login, extract base
        $parsedUrl = parse_url($origin);
        $baseUrl = ($parsedUrl['scheme'] ?? 'http') . '://' . ($parsedUrl['host'] ?? 'localhost') . (!empty($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '');

        $resetLink = $baseUrl . "/reset-password?token=" . $token;

        $displayName = !empty($user['first_name']) ? $user['first_name'] : $user['username'];
        
        // Build email body replacing placeholders
        $body = str_replace(
            ['{{name}}', '{{reset_link}}'],
            [$displayName, $resetLink],
            $body
        );

        // Send email
        send_email($pdo, $email, $subject, $body);
    }

    // Always respond with success to prevent user enumeration
    echo json_encode([
        'success' => true,
        'message' => 'Se o e-mail introduzido estiver registado, receberás instruções para repor a palavra-passe em breve.'
    ]);

} catch (Throwable $e) {
    error_log("Forgot password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno do servidor. Por favor, tente novamente mais tarde.']);
}
