<?php
require_once 'error_handler.php';

// Load environment variables from .env file
function load_env() {
    $env_file = __DIR__ . '/.env';
    if (!file_exists($env_file)) {
        return;
    }
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (preg_match('/^"?(.*?)"?$/', $value, $matches)) {
                $value = $matches[1];
            }
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv("{$name}={$value}");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
load_env();

// CORS — allowed origins whitelist (add your production domain here)
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost',
    // 'https://antestreias.pt',       ← descomentar em produção
    // 'https://www.antestreias.pt',   ← descomentar em produção
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // No CORS header → browser blocks the request (secure by default)
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rate Limiting Logic
try {
    require_once 'db.php';
    
    // Create rate limits table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        is_auth TINYINT(1) DEFAULT 0,
        request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_ip_auth_time (ip_address, is_auth, request_time),
        KEY idx_ip_time (ip_address, request_time),
        KEY idx_time (request_time)
    )");

    // Garbage collection (10% chance) to clean records older than 15 minutes
    if (mt_rand(1, 100) <= 10) {
        $pdo->exec("DELETE FROM rate_limits WHERE request_time < NOW() - INTERVAL 15 MINUTE");
    }

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (strpos($ip, ',') !== false) {
        $ip = trim(explode(',', $ip)[0]);
    }

    $script_name = basename($_SERVER['SCRIPT_FILENAME']);
    $auth_routes = [
        'login.php',
        'register.php',
        'verify_email.php',
        'two_factor.php',
        'social_auth.php',
        'oauth_callback.php',
        'change_password.php',
        'forgot_password.php',
        'reset_password.php'
    ];
    $is_auth = in_array($script_name, $auth_routes) ? 1 : 0;

    // 1. Enforce authentication route limit: max 5 attempts per 15min
    if ($is_auth) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_address = ? AND is_auth = 1 AND request_time >= NOW() - INTERVAL 15 MINUTE");
        $stmt->execute([$ip]);
        $auth_attempts = $stmt->fetchColumn();
        if ($auth_attempts >= 5) {
            http_response_code(429);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Demasiadas tentativas de autenticação. Por favor, tente novamente após 15 minutos.'
            ]);
            exit;
        }
    }

    // 2. Enforce general rate limit: max 100 requests per 1min
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_address = ? AND request_time >= NOW() - INTERVAL 1 MINUTE");
    $stmt->execute([$ip]);
    $total_requests = $stmt->fetchColumn();
    if ($total_requests >= 100) {
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Limite de requisições excedido. Por favor, aguarde antes de tentar novamente.'
        ]);
        exit;
    }

    // Log this request
    $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_address, endpoint, is_auth) VALUES (?, ?, ?)");
    $stmt->execute([$ip, $script_name, $is_auth]);

} catch (Throwable $e) {
    // Fail-open to avoid breaking the API in case of DB issues
    error_log("Rate limiting error: " . $e->getMessage());
}

// --- Payload Size & Malformed JSON Validation ---
// 1. Reject oversized payloads: max 5MB (except for file upload script, which allows 20MB)
$max_payload_size = 5 * 1024 * 1024; // 5MB
$script_name = basename($_SERVER['SCRIPT_FILENAME']);
if ($script_name === 'upload.php') {
    $max_payload_size = 20 * 1024 * 1024; // 20MB for file uploads
}
$content_length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($content_length > $max_payload_size) {
    http_response_code(413);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Pedido demasiado grande (limite excedido).']);
    exit;
}

// 2. Reject malformed JSON payloads
$content_type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (stripos($content_type, 'application/json') !== false) {
    $raw_input = file_get_contents('php://input');
    if (!empty($raw_input)) {
        json_decode($raw_input);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Payload JSON malformado ou inválido.']);
            exit;
        }
    }
}

// --- Global Input Sanitization Utility ---
if (!function_exists('sanitize_value')) {
    function sanitize_value($value, $key = '') {
        if (is_array($value)) {
            $result = [];
            foreach ($value as $k => $v) {
                $result[$k] = sanitize_value($v, $k);
            }
            return $result;
        }
        if (is_string($value)) {
            // Exclude raw values from HTML-escaping to prevent database/auth corruption
            $raw_keys = [
                'avatar', 'poster', 'backdrop', 'url', 'source_url', 'src', 'href',
                'code', 'token', 'email', 'permissions', 'password', 'two_factor_secret'
            ];
            if (in_array(strtolower($key), $raw_keys)) {
                return trim(str_replace(chr(0), '', $value)); // Strip null bytes, keep raw
            }

            // Rich HTML text content fields (allow tags, strip dangerous XSS patterns)
            $allowed_keys = ['content', 'body', 'html', 'description', 'message'];
            if (in_array(strtolower($key), $allowed_keys)) {
                $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', "", $value);
                $value = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', "", $value);
                $value = preg_replace('/on\w+\s*=\s*".*?"/is', "", $value);
                $value = preg_replace('/on\w+\s*=\s*\'.*?\'/is', "", $value);
                $value = preg_replace('/javascript:[^\s]*/is', "", $value);
                return trim(str_replace(chr(0), '', $value));
            }

            // Default: Escape HTML entities
            return htmlspecialchars(trim($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        return $value;
    }
}

// Sanitize global input variables
$_GET = sanitize_value($_GET);
$_POST = sanitize_value($_POST);
$_COOKIE = sanitize_value($_COOKIE);

// Custom stream wrapper to intercept and sanitize raw php://input (JSON requests)
if (!class_exists('SanitizedPhpStream')) {
    class SanitizedPhpStream {
        public $context;
        private $position = 0;
        private $data = '';

        public function stream_open($path, $mode, $options, &$opened_path) {
            if ($path !== 'php://input') {
                return false;
            }

            // Temporarily restore default wrapper to fetch raw stream
            stream_wrapper_restore('php');
            $this->data = file_get_contents('php://input');
            stream_wrapper_unregister('php');
            stream_wrapper_register('php', __CLASS__);

            // Sanitize decoded JSON payload
            $decoded = json_decode($this->data, true);
            if ($decoded !== null && json_last_error() === JSON_ERROR_NONE) {
                $sanitized = sanitize_value($decoded);
                $this->data = json_encode($sanitized);
            }

            $this->position = 0;
            return true;
        }

        public function stream_read($count) {
            $ret = substr($this->data, $this->position, $count);
            $this->position += strlen($ret);
            return $ret;
        }

        public function stream_eof() {
            return $this->position >= strlen($this->data);
        }

        public function stream_stat() {
            return array();
        }
    }
}
stream_wrapper_unregister('php');
stream_wrapper_register('php', 'SanitizedPhpStream');

// Disable error display to prevent breaking JSON/headers
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Security validation for admin routes
$script_name = basename($_SERVER['SCRIPT_FILENAME']);
if (strpos($script_name, 'admin_') === 0 || strpos($script_name, 'tmdb_') === 0 || strpos($script_name, 'news_') === 0 || $script_name === 'upload.php' || $script_name === 'clear_cache.php') {
    // Allow public GET requests to admin_appearance.php, admin_themes.php, and admin_settings.php (filtered settings)
    if ((($script_name === 'admin_appearance.php' || $script_name === 'admin_themes.php' || $script_name === 'admin_settings.php') && $_SERVER['REQUEST_METHOD'] === 'GET')) {
        // Skip auth check
    } else {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autenticado']);
            exit;
        }
        
        try {
            require_once 'db.php';
            require_once 'functions.php';
            
            $stmt = $pdo->prepare("SELECT role, permissions, suspended FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user_data || $user_data['suspended']) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso proibido.']);
                exit;
            }
            
            $perms = get_user_permissions($pdo, $user_data['role'], $user_data['permissions']);
            if (!in_array('access_admin', $perms)) {
                http_response_code(403);
                echo json_encode(['error' => 'Acesso proibido. Sem permissões administrativas.']);
                exit;
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro na validação de segurança.']);
            exit;
        }
    }
}

