<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $settings = [
        'general.site_name' => get_setting($pdo, 'general.site_name', 'Antestreias'),
        'general.site_description' => get_setting($pdo, 'general.site_description', ''),
        'general.site_description_en' => get_setting($pdo, 'general.site_description_en', ''),
        'appearance.favicon' => get_setting($pdo, 'appearance.favicon', ''),
        'appearance.logo_light' => get_setting($pdo, 'appearance.logo_light', ''),
        'appearance.logo_dark' => get_setting($pdo, 'appearance.logo_dark', ''),
        'appearance.logo_mobile_light' => get_setting($pdo, 'appearance.logo_mobile_light', ''),
        'appearance.logo_mobile_dark' => get_setting($pdo, 'appearance.logo_mobile_dark', ''),
        'slider.enabled' => get_setting($pdo, 'slider.enabled', '1'),
        'slider.type' => get_setting($pdo, 'slider.type', 'latest'),
        'slider.autoplay' => get_setting($pdo, 'slider.autoplay', '1'),
        'slider.interval' => get_setting($pdo, 'slider.interval', '5000'),
        'slider.count' => get_setting($pdo, 'slider.count', '5'),
        'slider.manual_ids' => get_setting($pdo, 'slider.manual_ids', ''),
        'auth.registration_enabled' => get_setting($pdo, 'auth.registration_enabled', '1'),
        'mail.contest_participation_template' => get_setting($pdo, 'mail.contest_participation_template', "<p>Olá {{name}},</p><p>A tua participação no passatempo do filme <strong>{{movie}}</strong> ({{contest_name}}) foi registada com sucesso!</p><p><strong>Detalhes da Participação:</strong><br>Local: {{location}}<br>Resposta: {{answer}}</p><p>Boa sorte!<br>Equipa Antestreias</p>"),
        'access_mode' => get_setting($pdo, 'access_mode', 'normal'),
    ];
    echo json_encode($settings);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = JSON_decode(file_get_contents('php://input'), true);
    
    foreach ($data as $name => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?");
        $stmt->execute([$name, $value, $value]);
    }
    
    echo json_encode(['success' => true]);
}
