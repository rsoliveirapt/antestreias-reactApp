<?php
require 'headers.php';
require 'db.php';
require 'functions.php';
header('Content-Type: application/json');

$apiKey = get_setting($pdo, 'tmdb.api_key');
if (empty($apiKey)) {
    $apiKey = getenv('TMDB_API_KEY');
}
$language = get_setting($pdo, 'tmdb.language', 'pt-PT');
$q = $_GET['q'] ?? '';
$type = $_GET['type'] ?? 'movie';

$uri = $type === 'series' ? 'tv' : 'movie';

// If user typed just a number, assume it's a TMDB ID
if (is_numeric($q)) {
    $url = "https://api.themoviedb.org/3/{$uri}/{$q}?api_key={$apiKey}&language={$language}";
} else {
    $url = "https://api.themoviedb.org/3/search/{$uri}?api_key={$apiKey}&language={$language}&query=" . urlencode($q);
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fixes local SSL cert issues
$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(['error' => 'CURL Error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

// If it was an ID search, we wrap it in a 'results' array so the frontend still works exactly the same
if (is_numeric($q)) {
    $data = json_decode($response, true);
    if (isset($data['id'])) {
        echo json_encode(['results' => [$data]]);
    } else {
        echo json_encode(['results' => []]);
    }
} else {
    echo $response;
}
?>
