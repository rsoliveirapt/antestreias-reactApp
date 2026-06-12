<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$query = "SELECT r.*, t.name as title_name, t.name_en as title_name_en, t.poster as title_poster, t.slug as title_slug, u.username, u.first_name, u.last_name, u.avatar
          FROM reviews r 
          LEFT JOIN titles t ON r.reviewable_id = t.id AND r.reviewable_type = 'title'
          LEFT JOIN users u ON r.user_id = u.id
          ORDER BY r.created_at DESC
          LIMIT 1";
$lang = $_GET['lang'] ?? 'pt';
$stmt = $pdo->prepare($query);
$stmt->execute();
$review = $stmt->fetch(PDO::FETCH_ASSOC);

if ($review) {
    if ($lang === 'en') {
        if (!empty($review['title_name_en'])) {
            $review['title_name'] = $review['title_name_en'];
        }
        if (!empty($review['body_en'])) {
            $review['body'] = $review['body_en'];
        }
    }
    echo json_encode($review);
} else {
    echo json_encode(null);
}
?>
