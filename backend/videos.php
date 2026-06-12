<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!empty($data['video_id'])) {
        $stmt = $pdo->prepare("UPDATE videos SET views = views + 1 WHERE id = ?");
        $stmt->execute([$data['video_id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (!empty($data['report_video_id'])) {
        $stmt = $pdo->prepare("UPDATE videos SET reports = reports + 1 WHERE id = ?");
        $stmt->execute([$data['report_video_id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid payload']);
    exit;
}

$title_id = $_GET['title_id'] ?? $_GET['movie_id'] ?? null;
if (!$title_id) { echo json_encode([]); exit; }

$stmt = $pdo->prepare("SELECT id, name, src, type, category FROM videos WHERE title_id = ? ORDER BY `order` ASC, created_at DESC");
$stmt->execute([$title_id]);
echo json_encode($stmt->fetchAll());
