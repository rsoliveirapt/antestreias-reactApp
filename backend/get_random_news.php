<?php
require 'headers.php';
require 'db.php';

$current_slug = $_GET['exclude'] ?? '';

$stmt = $pdo->prepare("SELECT slug FROM news WHERE status = 'published' AND slug != ? ORDER BY RAND() LIMIT 1");
$stmt->execute([$current_slug]);
$news = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$news) {
    // If no other news, just get any published
    $stmt = $pdo->query("SELECT slug FROM news WHERE status = 'published' LIMIT 1");
    $news = $stmt->fetch(PDO::FETCH_ASSOC);
}

echo json_encode($news);
?>
