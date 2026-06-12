<?php
require 'headers.php';
header('Content-Type: application/json');

// This script simulates clearing the cache or clears a specific folder if it exists.
$cache_dir = '../storage/cache';

function deleteDir($dirPath) {
    if (!is_dir($dirPath)) return;
    if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
        $dirPath .= '/';
    }
    $files = glob($dirPath . '*', GLOB_MARK);
    foreach ($files as $file) {
        if (is_dir($file)) {
            deleteDir($file);
        } else {
            unlink($file);
        }
    }
}

usleep(800000); 

if (is_dir($cache_dir)) {
    deleteDir($cache_dir);
}

echo json_encode(['success' => true, 'message' => 'Cache limpa com sucesso!']);
?>
