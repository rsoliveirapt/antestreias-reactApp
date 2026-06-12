<?php
require 'db.php';
$stmt = $pdo->query("SELECT name, value FROM settings WHERE name LIKE '%email%' OR name LIKE '%mail%'");
print_r($stmt->fetchAll());
unlink(__FILE__);
