<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'headers.php';

try {
    require 'db.php';
    require 'functions.php';

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $group = $_GET['group'] ?? '';
        if ($group) {
            $stmt = $pdo->prepare("SELECT name, value FROM settings WHERE name LIKE ?");
            $stmt->execute([$group . '.%']);
        } else {
            $stmt = $pdo->query("SELECT name, value FROM settings");
        }
        
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['name']] = $row['value'];
        }
        
        // Filter out sensitive settings if not admin
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $is_admin = false;
        if (isset($_SESSION['user_id'])) {
            try {
                $stmt_admin = $pdo->prepare("SELECT role, permissions, suspended FROM users WHERE id = ?");
                $stmt_admin->execute([$_SESSION['user_id']]);
                $user_admin = $stmt_admin->fetch(PDO::FETCH_ASSOC);
                if ($user_admin && !$user_admin['suspended']) {
                    $perms = get_user_permissions($pdo, $user_admin['role'], $user_admin['permissions']);
                    if (in_array('access_admin', $perms)) {
                        $is_admin = true;
                    }
                }
            } catch (Throwable $e_admin) {
                // ignore
            }
        }

        if (!$is_admin) {
            foreach ($settings as $key => $val) {
                $key_lower = strtolower($key);
                if ($key_lower === 'realtime.pusher_key') {
                    continue;
                }
                if (strpos($key_lower, 'client_id') !== false || strpos($key_lower, 'app_id') !== false) {
                    continue;
                }
                if (
                    strpos($key_lower, 'password') !== false ||
                    strpos($key_lower, 'secret') !== false ||
                    strpos($key_lower, 'api_key') !== false ||
                    strpos($key_lower, 'smtp') !== false ||
                    strpos($key_lower, 'mail.from_address') !== false ||
                    strpos($key_lower, 'mail.from_name') !== false ||
                    strpos($key_lower, 'stripe') !== false ||
                    strpos($key_lower, 'paypal') !== false
                ) {
                    unset($settings[$key]);
                }
            }
        }

        echo json_encode($settings);
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        
        if (!$data) {
            echo json_encode(['success' => false, 'error' => 'Dados inválidos ou vazios.']);
            exit;
        }

        foreach ($data as $name => $value) {
            // Garantir que name e value são strings para evitar erros de tipo
            $sName = (string)$name;
            $sValue = (string)$value;
            
            $stmt = $pdo->prepare("INSERT INTO settings (name, value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()");
            $stmt->execute([$sName, $sValue, $sValue]);
        }
        echo json_encode(['success' => true]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
