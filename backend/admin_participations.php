<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $contest_id = $_GET['contest_id'] ?? null;
    
    if (!$contest_id) {
        echo json_encode(['success' => false, 'error' => 'Contest ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM contest_participations WHERE contest_id = ? ORDER BY is_winner DESC, created_at DESC");
    $stmt->execute([$contest_id]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    $contest_id = $data['contest_id'] ?? null;

    if ($action === 'raffle' && $contest_id) {
        $count = (int)($data['count'] ?? 1);
        
        // Reset winners for this contest first
        $stmt = $pdo->prepare("UPDATE contest_participations SET is_winner = FALSE WHERE contest_id = ?");
        $stmt->execute([$contest_id]);
        
        // Pick new random winners
        // MySQL ORDER BY RAND() LIMIT ?
        $stmt = $pdo->prepare("UPDATE contest_participations SET is_winner = TRUE WHERE contest_id = ? ORDER BY RAND() LIMIT ?");
        $stmt->execute([$contest_id, $count]);
        
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'toggle_winner' && isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE contest_participations SET is_winner = !is_winner WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        exit;
    }
}
?>
