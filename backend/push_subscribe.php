<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/db.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['subscription']) || !isset($input['subscription']['endpoint'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid subscription data']);
    exit;
}

$sub = $input['subscription'];
$endpoint = $sub['endpoint'];
$p256dh = $sub['keys']['p256dh'] ?? '';
$auth = $sub['keys']['auth'] ?? '';

// Retrieve user_id from session if present
$userId = $_SESSION['user_id'] ?? null;

try {
    // Check if subscription already exists to avoid duplication
    $stmt = $pdo->prepare("SELECT id FROM push_subscriptions WHERE endpoint = ?");
    $stmt->execute([$endpoint]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmt = $pdo->prepare("UPDATE push_subscriptions SET user_id = ?, keys_p256dh = ?, keys_auth = ? WHERE endpoint = ?");
        $stmt->execute([$userId, $p256dh, $auth, $endpoint]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $endpoint, $p256dh, $auth]);
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
