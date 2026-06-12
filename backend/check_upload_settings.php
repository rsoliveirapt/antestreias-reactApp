<?php
require 'headers.php';
require 'db.php';
$stmt = $pdo->query("SELECT name, value FROM settings WHERE name LIKE 'storage.%'");
$settings = $stmt->fetchAll();
$max_upload = ini_get('upload_max_filesize');
echo json_encode(['settings' => $settings, 'max_upload' => $max_upload]);
?>
