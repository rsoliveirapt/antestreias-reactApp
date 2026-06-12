<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$query = "SELECT DISTINCT t.id, t.name, t.name_en, t.slug, t.poster, t.backdrop, t.tmdb_vote_average,
          (SELECT id FROM reviews WHERE reviewable_id = t.id AND reviewable_type = 'title' ORDER BY created_at DESC LIMIT 1) as latest_review_id,
          (SELECT body FROM reviews WHERE reviewable_id = t.id AND reviewable_type = 'title' ORDER BY created_at DESC LIMIT 1) as latest_review_body,
          (SELECT body_en FROM reviews WHERE reviewable_id = t.id AND reviewable_type = 'title' ORDER BY created_at DESC LIMIT 1) as latest_review_body_en,
          (SELECT AVG(score) FROM reviews WHERE reviewable_id = t.id AND reviewable_type = 'title') as local_score,
          (SELECT COUNT(*) FROM reviews WHERE reviewable_id = t.id AND reviewable_type = 'title') as review_count
          FROM titles t
          JOIN reviews r ON t.id = r.reviewable_id AND r.reviewable_type = 'title'
          ORDER BY r.created_at DESC";
$lang = $_GET['lang'] ?? 'pt';
$stmt = $pdo->query($query);
$titles = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($titles as &$t) {
    if ($lang === 'en') {
        if (!empty($t['name_en'])) {
            $t['name'] = $t['name_en'];
        }
        if (!empty($t['latest_review_body_en'])) {
            $t['latest_review_body'] = $t['latest_review_body_en'];
        }
    }
}
unset($t);

echo json_encode($titles);
?>
