<?php
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'functions.php';
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if registration is enabled
    $registrationEnabled = get_setting($pdo, 'auth.registration_enabled', '1');
    $disableRegistration = get_setting($pdo, 'auth.disable_registration', 'false');
    if ($registrationEnabled === '0' || $disableRegistration === 'true' || $disableRegistration === '1') {
        echo json_encode(['success' => false, 'error' => 'Os registos de novos utilizadores estão desativados de momento.']);
        exit;
    }

    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');

    // Validações básicas
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Preenche todos os campos obrigatórios.']);
        exit;
    }

    // Validação de requisitos de password
    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe deve ter pelo menos 8 caracteres.']);
        exit;
    }
    if (!preg_match('/[A-Z]/', $password)) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos uma letra maiúscula.']);
        exit;
    }
    if (!preg_match('/[a-z]/', $password)) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos uma letra minúscula.']);
        exit;
    }
    if (!preg_match('/[0-9]/', $password)) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos um número.']);
        exit;
    }
    if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
        echo json_encode(['success' => false, 'error' => 'A palavra-passe deve conter pelo menos um caractere especial (ex: !@#$%^&*).']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'Email inválido.']);
        exit;
    }

    // Palavras proibidas no username
    $forbidden_words = [
        'admin', 'administrator', 'administrador', 'moderator', 'moderador', 
        'support', 'suporte', 'staff', 'root', 'antestreias', 'antestreia',
        'caralho', 'fodas', 'foda-se', 'puta', 'merda', 'cabrão', 'cabrao', 
        'paneleiro', 'foder', 'shit', 'fuck', 'asshole', 'bitch'
    ];
    $username_lower = mb_strtolower($username, 'UTF-8');
    foreach ($forbidden_words as $word) {
        if (strpos($username_lower, $word) !== false) {
            echo json_encode(['success' => false, 'error' => 'O nome de utilizador contém termos proibidos ou reservados por razões de moderação.']);
            exit;
        }
    }

    try {
        // Obter IP do utilizador
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';

        // Se não for localhost, validar limite de 1 conta por IP
        if (!empty($ip) && $ip !== '127.0.0.1' && $ip !== '::1' && $ip !== 'localhost') {
            $stmtIp = $pdo->prepare("SELECT id FROM users WHERE registration_ip = ?");
            $stmtIp->execute([$ip]);
            if ($stmtIp->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Apenas é permitida a criação de 1 conta por endereço IP de forma a evitar abusos.']);
                exit;
            }
        }

        // Verificar se já existe utilizador ou email
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'O nome de utilizador ou email já estão em uso.']);
            exit;
        }

        // Garantir que as colunas existem
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 1 AFTER email");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64) DEFAULT NULL AFTER email_verified");
        
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45) DEFAULT NULL AFTER remember_token");
        } catch (PDOException $e) {
            try {
                $stmtCol = $pdo->query("SHOW COLUMNS FROM users LIKE 'registration_ip'");
                if (!$stmtCol->fetch()) {
                    $pdo->exec("ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) DEFAULT NULL AFTER remember_token");
                }
            } catch (PDOException $ex) {}
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $defaultRole = get_setting($pdo, 'auth.default_role', 'Utilizador');
        
        $confirmEmail = get_setting($pdo, 'auth.confirm_email', 'false');
        $requiresVerification = ($confirmEmail === 'true' || $confirmEmail === '1');
        
        $emailVerified = $requiresVerification ? 0 : 1;
        $verificationToken = $requiresVerification ? str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT) : null;
        
        $stmt = $pdo->prepare("INSERT INTO users (username, email, email_verified, verification_token, password, first_name, last_name, role, registration_ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $success = $stmt->execute([$username, $email, $emailVerified, $verificationToken, $hashedPassword, $first_name, $last_name, $defaultRole, $ip]);

        if ($success) {
            if ($requiresVerification) {
                // Obter template de email
                $stmtTpl = $pdo->prepare("SELECT subject, body FROM email_templates WHERE slug = 'verify_email'");
                $stmtTpl->execute();
                $tpl = $stmtTpl->fetch(PDO::FETCH_ASSOC);
                
                $subject = $tpl ? $tpl['subject'] : 'Confirma o teu e-mail - Antestreias';
                $body = $tpl ? $tpl['body'] : '<p>Olá {{name}},</p><p>O teu código de verificação é: <strong>{{code}}</strong></p>';
                
                $displayName = !empty($first_name) ? $first_name : $username;
                $body = str_replace(['{{name}}', '{{code}}'], [$displayName, $verificationToken], $body);
                
                send_email($pdo, $email, $subject, $body);
                
                echo json_encode([
                    'success' => true, 
                    'requires_verification' => true,
                    'email' => $email,
                    'message' => 'Conta criada com sucesso! Enviámos um código de verificação para o teu e-mail.'
                ]);
            } else {
                echo json_encode(['success' => true, 'message' => 'Conta criada com sucesso! Podes fazer login agora.']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Erro ao criar conta.']);
        }

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Erro de base de dados: ' . $e->getMessage()]);
    }
}
