<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = $_GET['q'] ?? '';
    $email = $_GET['email'] ?? '';
    $date_from = $_GET['date_from'] ?? '';
    $date_to = $_GET['date_to'] ?? '';
    $role = $_GET['role'] ?? '';
    
    $query = "SELECT id, username as name, email, avatar, role as cargos, permissions, suspended as suspenso, last_activity as ultima_atividade, created_at as criado_em FROM users WHERE 1=1";
    $params = [];

    // ... (rest of GET remains similar, but permissions will be included in fetchAll)
    if ($search) {
        $query .= " AND (username LIKE :search OR email LIKE :search)";
        $params['search'] = "%$search%";
    }
    if ($email) {
        $query .= " AND email LIKE :email";
        $params['email'] = "%$email%";
    }
    if ($date_from) {
        $query .= " AND created_at >= :date_from";
        $params['date_from'] = $date_from . ' 00:00:00';
    }
    if ($date_to) {
        $query .= " AND created_at <= :date_to";
        $params['date_to'] = $date_to . ' 23:59:59';
    }
    if ($role) {
        $query .= " AND role = :role";
        $params['role'] = $role;
    }

    $query .= " ORDER BY created_at DESC";
    
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transform permissions JSON string to array for the frontend
        foreach ($users as &$user) {
            $user['permissions'] = $user['permissions'] ? json_decode($user['permissions'], true) : [];
        }
        
        echo json_encode($users);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : json_encode([]);

    if (!isset($data['action'])) {
        // Create
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, permissions, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $pass = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt->execute([$data['name'], $data['email'], $pass, $data['cargos'], $permissions]);
        echo json_encode(['success' => true]);
    } else if ($data['action'] === 'update') {
        if (!empty($data['password'])) {
            $pass = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, password = ?, role = ?, permissions = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['email'], $pass, $data['cargos'], $permissions, $data['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET username = ?, email = ?, role = ?, permissions = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['email'], $data['cargos'], $permissions, $data['id']]);
        }
        echo json_encode(['success' => true]);
    } else if ($data['action'] === 'toggle_status') {
        $stmt = $pdo->prepare("UPDATE users SET suspended = !suspended WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    } else if ($data['action'] === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    }
}
