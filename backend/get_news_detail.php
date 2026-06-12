<?php
require 'headers.php';
require 'db.php';

$slug = $_GET['slug'] ?? null;

if (!$slug) {
    http_response_code(400);
    echo json_encode(['error' => 'Slug is required']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM news WHERE slug = ? AND status = 'published'");
$stmt->execute([$slug]);
$news = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$news) {
    http_response_code(404);
    echo json_encode(['error' => 'News not found']);
    exit;
}

echo json_encode($news);
?>
