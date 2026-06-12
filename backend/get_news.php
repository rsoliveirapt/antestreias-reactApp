<?php
require 'headers.php';
require 'db.php';

$stmt = $pdo->query("SELECT * FROM news WHERE status = 'published' ORDER BY created_at DESC");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
