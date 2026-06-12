<?php
require 'headers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        echo json_encode(['success' => false, 'error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['file'];
    $targetDir = "../uploads/appearance/";
    
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    $originalName = basename($file['name']);
    $cleanName = preg_replace("/[^a-zA-Z0-9._-]/", "_", $originalName);
    $fileName = time() . '_' . $cleanName;
    $targetFilePath = $targetDir . $fileName;
    $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);

    // Allow certain file formats
    $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'svg', 'ico', 'webp');
    if (in_array(strtolower($fileType), $allowTypes)) {
        if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
            // Return the URL relative to the API location or absolute
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/antestreias/v2/uploads/appearance/";
            echo json_encode(['success' => true, 'url' => $baseUrl . $fileName]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    }
}
