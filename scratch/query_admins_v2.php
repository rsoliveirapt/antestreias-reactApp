<?php
require 'backend/db.php';
$stmt = $pdo->query("SELECT email, username, role FROM users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
