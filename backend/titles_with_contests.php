<?php
require 'headers.php';
require 'db.php';

// Get titles that have at least one contest
// Include a flag indicating if at least one contest is still active
// Using NOW() instead of CURRENT_DATE to include time in the check
$query = "
    SELECT 
        t.id, t.name, t.name_en, t.poster, t.type, t.slug, t.tmdb_vote_average, t.local_vote_average,
        MAX(CASE WHEN c.end_date >= NOW() OR c.end_date IS NULL THEN 1 ELSE 0 END) as is_active
    FROM titles t
    INNER JOIN contests c ON t.id = c.title_id
    GROUP BY t.id
    ORDER BY is_active DESC, c.created_at DESC
";

$lang = $_GET['lang'] ?? 'pt';
$stmt = $pdo->query($query);
$titles = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($titles as &$t) {
    if ($lang === 'en' && !empty($t['name_en'])) {
        $t['name'] = $t['name_en'];
    }
}
unset($t);

echo json_encode($titles);
?>
