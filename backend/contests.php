<?php
require 'headers.php';
require 'db.php';
$title_id = $_GET['title_id'] ?? $_GET['movie_id'] ?? null;
if (!$title_id) { echo json_encode([]); exit; }

$stmt = $pdo->prepare("SELECT c.* FROM contests c WHERE c.title_id = ?");
$stmt->execute([$title_id]);
$contests = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($contests as &$c) {
    $stmtWinners = $pdo->prepare("SELECT name FROM contest_participations WHERE contest_id = ? AND is_winner = 1");
    $stmtWinners->execute([$c['id']]);
    $winners = $stmtWinners->fetchAll(PDO::FETCH_COLUMN);
    $c['winners'] = $winners;
    $c['has_winners'] = count($winners) > 0 ? 1 : 0;
}

echo json_encode($contests);
?>
