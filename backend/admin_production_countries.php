<?php
header('Content-Type: application/json');
require 'headers.php';
require 'db.php';

$stmt = $pdo->query("SELECT * FROM production_countries ORDER BY display_name ASC");
echo json_encode($stmt->fetchAll());
?>
