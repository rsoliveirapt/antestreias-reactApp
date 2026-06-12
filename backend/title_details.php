<?php
require 'headers.php';
require 'db.php';

$title_id = $_GET['title_id'] ?? $_GET['id'] ?? null;
if (!$title_id) { echo json_encode(['error' => 'No ID']); exit; }

// Cast
$castStmt = $pdo->prepare("SELECT c.id as credit_id, p.id as person_id, p.name, p.poster, p.slug, p.popularity, c.character, c.`order`, c.department, c.job 
    FROM creditables c JOIN people p ON c.person_id = p.id 
    WHERE c.creditable_id = ? AND c.creditable_type = 'title' AND c.department = 'Acting'
    ORDER BY c.`order` ASC");
$castStmt->execute([$title_id]);
$cast = $castStmt->fetchAll();

// Crew
$crewStmt = $pdo->prepare("SELECT c.id as credit_id, p.id as person_id, p.name, p.poster, p.slug, p.popularity, c.department, c.job 
    FROM creditables c JOIN people p ON c.person_id = p.id 
    WHERE c.creditable_id = ? AND c.creditable_type = 'title' AND c.department != 'Acting'
    ORDER BY c.department ASC");
$crewStmt->execute([$title_id]);
$crew = $crewStmt->fetchAll();

// Genres
$genreStmt = $pdo->prepare("SELECT g.id, g.name, g.display_name, g.display_name_en FROM genre_title gt JOIN genres g ON gt.genre_id = g.id WHERE gt.title_id = ?");
$genreStmt->execute([$title_id]);
$genres = $genreStmt->fetchAll();

// Countries
$countryStmt = $pdo->prepare("SELECT pc.id, pc.name, pc.display_name FROM country_title ct JOIN production_countries pc ON ct.production_country_id = pc.id WHERE ct.title_id = ?");
$countryStmt->execute([$title_id]);
$countries = $countryStmt->fetchAll();

// Reviews
$reviewStmt = $pdo->prepare("SELECT r.id, r.title, r.body, r.score, r.created_at, u.username, u.avatar 
    FROM reviews r LEFT JOIN users u ON r.user_id = u.id 
    WHERE r.reviewable_id = ? AND r.reviewable_type = 'title' ORDER BY r.created_at DESC LIMIT 20");
$reviewStmt->execute([$title_id]);
$reviews = $reviewStmt->fetchAll();

// Videos
$videoStmt = $pdo->prepare("SELECT id, name, src, category, type FROM videos WHERE title_id = ? ORDER BY created_at DESC");
$videoStmt->execute([$title_id]);
$videos = $videoStmt->fetchAll();

echo json_encode([
    'cast' => $cast,
    'crew' => $crew,
    'genres' => $genres,
    'countries' => $countries,
    'reviews' => $reviews,
    'videos' => $videos
]);
