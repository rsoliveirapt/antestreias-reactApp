<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();
$follower_id = $_SESSION['user_id'] ?? null;

if (!$follower_id) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$following_id = $data['user_id'] ?? null;

if (!$following_id || $follower_id == $following_id) {
    echo json_encode(['error' => 'Invalid user']);
    exit;
}

// Check if currently following
$stmt = $pdo->prepare("SELECT 1 FROM user_followers WHERE follower_id = ? AND following_id = ?");
$stmt->execute([$follower_id, $following_id]);
$is_following = (bool)$stmt->fetch();

if ($is_following) {
    // Unfollow
    $deleteStmt = $pdo->prepare("DELETE FROM user_followers WHERE follower_id = ? AND following_id = ?");
    $deleteStmt->execute([$follower_id, $following_id]);
    echo json_encode(['success' => true, 'is_following' => false]);
} else {
    // Follow
    $insertStmt = $pdo->prepare("INSERT INTO user_followers (follower_id, following_id, created_at) VALUES (?, ?, NOW())");
    $insertStmt->execute([$follower_id, $following_id]);
    
    // Get follower info
    $fStmt = $pdo->prepare("SELECT username, first_name, last_name FROM users WHERE id = ?");
    $fStmt->execute([$follower_id]);
    $follower = $fStmt->fetch();
    $follower_name = trim($follower['first_name'] . ' ' . $follower['last_name']);
    if (empty($follower_name)) $follower_name = '@' . $follower['username'];
    
    // Get following user info
    $uStmt = $pdo->prepare("SELECT email, first_name, last_name, username FROM users WHERE id = ?");
    $uStmt->execute([$following_id]);
    $target = $uStmt->fetch();
    
    if ($target) {
        $target_name = trim($target['first_name'] . ' ' . $target['last_name']);
        if (empty($target_name)) $target_name = '@' . $target['username'];
        
        // Fetch template
        $tStmt = $pdo->prepare("SELECT subject, body FROM email_templates WHERE slug = 'new_follower'");
        $tStmt->execute();
        $template = $tStmt->fetch();
        
        if ($template) {
            $subject = $template['subject'];
            $body = $template['body'];
            
            // Replace placeholders
            $subject = str_replace(['{{name}}', '{{follower_name}}'], [$target_name, $follower_name], $subject);
            $body = str_replace(['{{name}}', '{{follower_name}}'], [$target_name, $follower_name], $body);
            
            send_email($pdo, $target['email'], $subject, $body);
        }
    }
    
    echo json_encode(['success' => true, 'is_following' => true]);
}
?>
