<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $role = $stmt->fetch();
        if ($role) {
            $role['permissions'] = json_decode($role['permissions'], true);
        }
        echo json_encode($role);
    } else {
        $stmt = $pdo->query("SELECT id, name, COALESCE(display_name, name) as display_name, permissions FROM roles ORDER BY id ASC");
        $roles = $stmt->fetchAll();
        foreach ($roles as &$role) {
            $role['permissions'] = json_decode($role['permissions'] ?? '[]', true) ?: [];
        }
        echo json_encode($roles);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("INSERT INTO roles (name, display_name, permissions) VALUES (?, ?, ?)");
    $stmt->execute([
        $data['name'],
        $data['display_name'],
        json_encode($data['permissions'] ?? [])
    ]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $pdo->prepare("UPDATE roles SET display_name = ?, permissions = ? WHERE id = ?");
    $stmt->execute([
        $data['display_name'],
        json_encode($data['permissions'] ?? []),
        $data['id']
    ]);
    echo json_encode(["success" => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ? AND name != 'super_admin'");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
