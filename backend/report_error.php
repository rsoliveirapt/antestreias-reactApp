<?php
require_once 'headers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing message']);
    exit;
}

$error_type = $input['error_type'] ?? 'Frontend Error';
$message = $input['message'];
$stack_trace = $input['stack_trace'] ?? '';
if (!empty($input['component_stack'])) {
    $stack_trace .= "\n\nComponent Stack:\n" . $input['component_stack'];
}
$url = $input['url'] ?? '';
$user_agent = $input['user_agent'] ?? '';

if (session_status() === PHP_SESSION_NONE) {
    try {
        @session_start();
    } catch (Throwable $e) {}
}
$user_id = $_SESSION['user_id'] ?? null;

// Report error via central alert system
report_system_error($error_type, $message, 'Frontend Component', 0, $stack_trace, [
    'url' => $url,
    'user_agent' => $user_agent,
    'user_id' => $user_id
]);

header('Content-Type: application/json');
echo json_encode(['success' => true]);
