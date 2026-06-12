<?php
require 'backend/db.php';
$hash = password_hash('Password123!', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@antestreias.pt'");
$stmt->execute([$hash]);
echo "Password updated successfully.\n";
