<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$id = $_GET['id'] ?? null;
$slug = $_GET['slug'] ?? null;

if ($id) {
    $stmt = $pdo->prepare("SELECT r.*, u.username, u.avatar, t.name as title_name, t.poster as title_poster, t.slug as title_slug, t.backdrop as title_backdrop 
                          FROM reviews r 
                          LEFT JOIN users u ON r.user_id = u.id 
                          LEFT JOIN titles t ON r.reviewable_id = t.id AND r.reviewable_type = 'title'
                          WHERE r.id = ?");
    $stmt->execute([$id]);
} else if ($slug) {
    $stmt = $pdo->prepare("SELECT r.*, u.username, u.avatar, t.name as title_name, t.poster as title_poster, t.slug as title_slug, t.backdrop as title_backdrop 
                          FROM reviews r 
                          LEFT JOIN users u ON r.user_id = u.id 
                          LEFT JOIN titles t ON r.reviewable_id = t.id AND r.reviewable_type = 'title'
                          WHERE t.slug = ?
                          ORDER BY r.created_at DESC LIMIT 1");
    $stmt->execute([$slug]);
} else {
    echo json_encode(['error' => 'No ID or Slug']); exit;
}
$review = $stmt->fetch();

if (!$review) { echo json_encode(['error' => 'Review not found']); exit; }

$lang = $_GET['lang'] ?? 'pt';
if ($lang === 'en' && !empty($review['body_en'])) {
    $review['body'] = $review['body_en'];
}

echo json_encode($review);
?>
