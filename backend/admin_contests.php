<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

// Garantir que a coluna require_login existe na tabela contests
try {
    $pdo->exec("ALTER TABLE contests ADD COLUMN IF NOT EXISTS require_login TINYINT(1) DEFAULT 0 AFTER type");
} catch (PDOException $e) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM contests LIKE 'require_login'");
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE contests ADD COLUMN require_login TINYINT(1) DEFAULT 0 AFTER type");
        }
    } catch (PDOException $ex) {}
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $title_id = $_GET['title_id'] ?? null;
    if ($title_id) {
        $stmt = $pdo->prepare("SELECT c.*, EXISTS(SELECT 1 FROM contest_participations cp WHERE cp.contest_id = c.id AND cp.is_winner = 1) as has_winners FROM contests c WHERE title_id = ? ORDER BY created_at DESC");
        $stmt->execute([$title_id]);
    } else {
        $stmt = $pdo->query("SELECT c.*, t.name as title_name, t.poster as title_poster, t.slug as title_slug, EXISTS(SELECT 1 FROM contest_participations cp WHERE cp.contest_id = c.id AND cp.is_winner = 1) as has_winners FROM contests c LEFT JOIN titles t ON c.title_id = t.id ORDER BY c.created_at DESC");
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE contests SET 
            title_id=?, type=?, require_login=?, name=?, partner_logo=?, location=?, end_date=?, 
            tickets_count=?, details=?, link=?, rules_link=?, question=? 
            WHERE id=?");
        $stmt->execute([
            $data['title_id'], $data['type'], isset($data['require_login']) ? (int)$data['require_login'] : 0, $data['name'], $data['partner_logo'] ?? '', $data['location'] ?? '', 
            $data['end_date'] ?? null, $data['tickets_count'] ?? 0, $data['details'] ?? '', 
            $data['link'] ?? '', $data['rules_link'] ?? '', $data['question'] ?? '', $data['id']
        ]);
        echo json_encode(["success" => true]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO contests (
            title_id, type, require_login, name, partner_logo, location, end_date, 
            tickets_count, details, link, rules_link, question
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['title_id'], $data['type'], isset($data['require_login']) ? (int)$data['require_login'] : 0, $data['name'], $data['partner_logo'] ?? '', 
            $data['location'] ?? '', $data['end_date'] ?? null, $data['tickets_count'] ?? 0, 
            $data['details'] ?? '', $data['link'] ?? '', $data['rules_link'] ?? '', $data['question'] ?? ''
        ]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    }
    exit;
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM contests WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
    exit;
}
?>
