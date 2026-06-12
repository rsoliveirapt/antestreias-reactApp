<?php
require 'headers.php';
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['active'])) {
        $stmt = $pdo->query("SELECT * FROM themes WHERE is_active = 1 LIMIT 1");
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM themes ORDER BY id ASC");
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action']) && $data['action'] === 'activate') {
        $pdo->exec("UPDATE themes SET is_active = 0");
        $stmt = $pdo->prepare("UPDATE themes SET is_active = 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['delete_id'])) {
        $stmt = $pdo->prepare("DELETE FROM themes WHERE id = ?");
        $stmt->execute([$data['delete_id']]);
        echo json_encode(['success' => true]);
        exit;
    }

    if (isset($data['id']) && $data['id'] > 0) {
        $stmt = $pdo->prepare("UPDATE themes SET 
            name = ?, font_family = ?, border_radius_buttons = ?, border_radius_inputs = ?, border_radius_panels = ?,
            color_navbar = ?, color_background = ?, color_background_alt = ?, color_foreground = ?,
            color_accent_light = ?, color_accent = ?, color_accent_dark = ?, color_text_on_accent = ?, color_chip = ?
            WHERE id = ?");
        $stmt->execute([
            $data['name'], $data['font_family'], $data['border_radius_buttons'], $data['border_radius_inputs'], $data['border_radius_panels'],
            $data['color_navbar'], $data['color_background'], $data['color_background_alt'], $data['color_foreground'],
            $data['color_accent_light'], $data['color_accent'], $data['color_accent_dark'], $data['color_text_on_accent'], $data['color_chip'],
            $data['id']
        ]);
        echo json_encode(['success' => true]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO themes (
            name, font_family, border_radius_buttons, border_radius_inputs, border_radius_panels,
            color_navbar, color_background, color_background_alt, color_foreground,
            color_accent_light, color_accent, color_accent_dark, color_text_on_accent, color_chip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'] ?? 'Novo Tema', 
            $data['font_family'] ?? 'Sistema', 
            $data['border_radius_buttons'] ?? 'Médio', 
            $data['border_radius_inputs'] ?? 'Médio', 
            $data['border_radius_panels'] ?? 'Médio',
            $data['color_navbar'] ?? '#111111', 
            $data['color_background'] ?? '#000000', 
            $data['color_background_alt'] ?? '#111111', 
            $data['color_foreground'] ?? '#ffffff',
            $data['color_accent_light'] ?? '#ff4d4d', 
            $data['color_accent'] ?? '#e50914', 
            $data['color_accent_dark'] ?? '#b20710', 
            $data['color_text_on_accent'] ?? '#ffffff', 
            $data['color_chip'] ?? '#222222'
        ]);
        echo json_encode(['success' => true]);
    }
}
?>
