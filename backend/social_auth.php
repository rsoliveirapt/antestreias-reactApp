<?php
require 'headers.php';
session_start();
require 'db.php';
require_once 'functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $provider = $data['provider'] ?? '';
    
    if (empty($provider)) {
        echo json_encode(['success' => false, 'message' => 'Provedor de login inválido.']);
        exit;
    }

    // Dados de perfil fornecidos pelo fluxo OAuth ou simulados para demonstração imediata
    $email = !empty($data['email']) ? trim($data['email']) : 'utilizador.' . $provider . '@gmail.com';
    $name = !empty($data['name']) ? trim($data['name']) : ucfirst($provider) . ' User';
    $avatar = !empty($data['avatar']) ? trim($data['avatar']) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200';
    $username = !empty($data['username']) ? trim(str_replace('@', '', $data['username'])) : strtolower($provider) . '_user_' . rand(1000, 9999);

    try {
        // Verificar se o utilizador já existe pelo email
        $stmt = $pdo->prepare("SELECT id, username, email, password, role, permissions, avatar, first_name, last_name, two_factor_secret, two_factor_confirmed_at FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            // Criar novo utilizador associado à rede social
            $defaultRole = get_setting($pdo, 'auth.default_role', 'Utilizador');
            $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
            $parts = explode(' ', $name);
            $firstName = $parts[0];
            $lastName = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : '';

            $stmtInsert = $pdo->prepare("INSERT INTO users (username, email, password, first_name, last_name, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmtInsert->execute([$username, $email, $randomPassword, $firstName, $lastName, $defaultRole, $avatar]);
            
            $userId = $pdo->lastInsertId();

            // Buscar o utilizador recém-criado
            $stmtSelect = $pdo->prepare("SELECT id, username, email, password, role, permissions, avatar, first_name, last_name, two_factor_secret, two_factor_confirmed_at FROM users WHERE id = ?");
            $stmtSelect->execute([$userId]);
            $user = $stmtSelect->fetch(PDO::FETCH_ASSOC);
        } else {
            // Se já existir mas não tiver avatar ou for avatar padrão, atualiza com o da rede social
            if (empty($user['avatar']) || strpos($user['avatar'], 'ui-avatars.com') !== false) {
                $stmtUpdate = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmtUpdate->execute([$avatar, $user['id']]);
                $user['avatar'] = $avatar;
            }
        }

        // Iniciar sessão
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['username'] = $user['username'];

        // Track visitor
        track_visitor($pdo);

        // Registar sessão ativa
        try {
            $session_id = session_id();
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            
            $stmtAct = $pdo->prepare("INSERT INTO active_sessions (user_id, session_id, user_agent, ip_address, last_activity) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE last_activity = NOW(), user_agent = ?, ip_address = ?");
            $stmtAct->execute([$user['id'], $session_id, $user_agent, $ip_address, $user_agent, $ip_address]);
        } catch (Exception $e) {}

        // Populate permissions
        $user['permissions'] = get_user_permissions($pdo, $user['role'], $user['permissions']);

        unset($user['password']);
        unset($user['two_factor_secret']);

        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro na autenticação social: ' . $e->getMessage()]);
    }
}
