<?php
header('Content-Type: application/json');
require 'headers.php';
session_start();
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = $_GET['search'] ?? '';
    $query = "SELECT r.*, t.name as title_name, t.poster as title_poster, u.username 
              FROM reviews r 
              LEFT JOIN titles t ON r.reviewable_id = t.id AND r.reviewable_type = 'title'
              LEFT JOIN users u ON r.user_id = u.id
              WHERE (t.name LIKE ? OR r.body LIKE ?)
              ORDER BY r.created_at DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute(["%$search%", "%$search%"]);
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title_id = $data['title_id'] ?? null;
    $body = $data['body'] ?? '';
    $body_en = $data['body_en'] ?? '';
    $score = $data['score'] ?? 0;
    $user_id = $_SESSION['user_id'] ?? 1; // Use logged in user if available
    
    if (!$title_id) { echo json_encode(['error' => 'No Title ID']); exit; }
    
    $stmt = $pdo->prepare("INSERT INTO reviews (reviewable_id, reviewable_type, body, body_en, score, user_id, created_at, updated_at) VALUES (?, 'title', ?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute([$title_id, $body, $body_en, $score, $user_id]);
    
    syncTitleRating($pdo, $title_id);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) { echo json_encode(['error' => 'No ID']); exit; }
    
    // Get reviewable_id before deleting
    $rev = $pdo->prepare("SELECT reviewable_id FROM reviews WHERE id = ?");
    $rev->execute([$id]);
    $title_id = $rev->fetchColumn();

    $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([$id]);

    if ($title_id) syncTitleRating($pdo, $title_id);
    echo json_encode(['success' => true]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $score = $data['score'] ?? null;
    $body = $data['body'] ?? null;
    $body_en = $data['body_en'] ?? null;
    
    if (!$id) { echo json_encode(['error' => 'No ID']); exit; }
    
    $stmt = $pdo->prepare("UPDATE reviews SET score = ?, body = ?, body_en = ? WHERE id = ?");
    $stmt->execute([$score, $body, $body_en, $id]);

    $rev = $pdo->prepare("SELECT reviewable_id FROM reviews WHERE id = ?");
    $rev->execute([$id]);
    $title_id = $rev->fetchColumn();
    if ($title_id) syncTitleRating($pdo, $title_id);

    echo json_encode(['success' => true]);
}

function syncTitleRating($pdo, $title_id) {
    $stmt = $pdo->prepare("SELECT AVG(score) FROM reviews WHERE reviewable_id = ? AND reviewable_type = 'title'");
    $stmt->execute([$title_id]);
    $avg = $stmt->fetchColumn() ?: 0;
    
    $upd = $pdo->prepare("UPDATE titles SET local_vote_average = ? WHERE id = ?");
    $upd->execute([$avg, $title_id]);
}
?>
