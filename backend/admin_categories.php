<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM genres WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
    } else {
        $search = $_GET['search'] ?? '';
        $query = "SELECT * FROM genres";
        $params = [];
        if ($search) {
            $query .= " WHERE name LIKE ? OR display_name LIKE ?";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $query .= " ORDER BY display_name ASC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO genres (name, display_name, display_name_en) VALUES (?, ?, ?)");
    $stmt->execute([$data['name'], $data['display_name'], $data['display_name_en'] ?? $data['display_name']]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE genres SET name = ?, display_name = ?, display_name_en = ? WHERE id = ?");
    $stmt->execute([$data['name'], $data['display_name'], $data['display_name_en'] ?? $data['display_name'], $data['id']]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM genre_title WHERE genre_id = ?");
        $stmt->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM genres WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}
?>
