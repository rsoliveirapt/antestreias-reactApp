<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM seo_settings ORDER BY id ASC");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['delete_id'])) {
        $stmt = $pdo->prepare("DELETE FROM seo_settings WHERE id = ?");
        $stmt->execute([$data['delete_id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['id']) && $data['id'] > 0) {
        $stmt = $pdo->prepare("UPDATE seo_settings SET page_label = ?, title_template = ?, description_template = ?, raw_code = ? WHERE id = ?");
        $stmt->execute([$data['page_label'], $data['title_template'], $data['description_template'], $data['raw_code'], $data['id']]);
        echo json_encode(['success' => true]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO seo_settings (page_type, page_label, title_template, description_template, raw_code) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['page_type'], $data['page_label'], $data['title_template'], $data['description_template'], $data['raw_code']]);
        echo json_encode(['success' => true]);
    }
}
?>
