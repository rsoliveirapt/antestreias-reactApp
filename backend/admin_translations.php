<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Get localization lines or list of localizations
if ($method === 'GET') {
    if (isset($_GET['localization_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM localization_lines WHERE localization_id = ? ORDER BY id ASC");
        $stmt->execute([$_GET['localization_id']]);
        echo json_encode($stmt->fetchAll());
    } else if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM localizations WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM localizations ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Save lines
    if (isset($data['save_lines'])) {
        $locId = $data['localization_id'];
        $lines = $data['lines'];

        // Simple sync: delete old and insert new (or update if exists)
        // For simplicity here, we update/insert based on ID if provided, or Key
        foreach ($lines as $line) {
            if (isset($line['id']) && $line['id'] > 0) {
                $stmt = $pdo->prepare("UPDATE localization_lines SET `key` = ?, `value` = ? WHERE id = ?");
                $stmt->execute([$line['key'], $line['value'], $line['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO localization_lines (localization_id, `key`, `value`) VALUES (?, ?, ?)");
                $stmt->execute([$locId, $line['key'], $line['value']]);
            }
        }
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['delete_line'])) {
        $stmt = $pdo->prepare("DELETE FROM localization_lines WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['delete'])) {
        $stmt = $pdo->prepare("DELETE FROM localizations WHERE id = ?");
        $stmt->execute([$data['id']]);
        // Also delete lines
        $stmt = $pdo->prepare("DELETE FROM localization_lines WHERE localization_id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    $name = $data['name'];
    $language = $data['language'];

    $stmt = $pdo->prepare("INSERT INTO localizations (name, language, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
    $stmt->execute([$name, $language]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}
?>
