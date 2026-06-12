<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM news_sources ORDER BY name ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['name']) || !isset($data['url'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and URL are required']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO news_sources (name, url, selector_container, selector_title, selector_body, selector_image, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['name'],
        $data['url'],
        $data['selector_container'] ?? null,
        $data['selector_title'] ?? null,
        $data['selector_body'] ?? null,
        $data['selector_image'] ?? null,
        $data['is_active'] ?? 1
    ]);
    echo json_encode(['id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE news_sources SET name=?, url=?, selector_container=?, selector_title=?, selector_body=?, selector_image=?, is_active=? WHERE id=?");
    $stmt->execute([
        $data['name'],
        $data['url'],
        $data['selector_container'] ?? null,
        $data['selector_title'] ?? null,
        $data['selector_body'] ?? null,
        $data['selector_image'] ?? null,
        $data['is_active'] ?? 1,
        $data['id']
    ]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM news_sources WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>
