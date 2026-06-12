<?php
require 'headers.php';
require 'db.php';
require 'functions.php';

$apiKey = get_setting($pdo, 'tmdb.api_key');
if (empty($apiKey)) {
    $apiKey = getenv('TMDB_API_KEY');
}
$configLanguage = get_setting($pdo, 'tmdb.language', 'pt-PT');
$primaryLanguage = ($configLanguage === 'bilingual') ? 'pt-PT' : $configLanguage;

$data = json_decode(file_get_contents("php://input"), true);
$tmdb_id = $data['tmdb_id'] ?? null;
$type = $data['type'] ?? 'movie';

if (!$tmdb_id) {
    echo json_encode(['error' => 'No TMDB ID provided']);
    exit;
}

$uri = $type === 'series' ? 'tv' : 'movie';
// Append videos to response
$url = "https://api.themoviedb.org/3/{$uri}/{$tmdb_id}?api_key={$apiKey}&language={$primaryLanguage}&append_to_response=videos,credits,reviews";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
curl_close($ch);

if (!$response) {
    echo json_encode(['error' => 'Failed to fetch from TMDB']);
    exit;
}

$tmdbData = json_decode($response, true);
if (isset($tmdbData['success']) && $tmdbData['success'] === false) {
    echo json_encode(['error' => $tmdbData['status_message']]);
    exit;
}

$name = $type === 'series' ? ($tmdbData['name'] ?? '') : ($tmdbData['title'] ?? '');
$original_title = $type === 'series' ? ($tmdbData['original_name'] ?? '') : ($tmdbData['original_title'] ?? '');
$description = $tmdbData['overview'] ?? '';
$release_date = $type === 'series' ? ($tmdbData['first_air_date'] ?? null) : ($tmdbData['release_date'] ?? null);
$poster = !empty($tmdbData['poster_path']) ? "https://image.tmdb.org/t/p/w500{$tmdbData['poster_path']}" : '';
$backdrop = !empty($tmdbData['backdrop_path']) ? "https://image.tmdb.org/t/p/original{$tmdbData['backdrop_path']}" : '';
$is_series = $type === 'series' ? 1 : 0;
$tmdb_vote_average = $tmdbData['vote_average'] ?? 0;
$tmdb_vote_count = $tmdbData['vote_count'] ?? 0;
$popularity = $tmdbData['popularity'] ?? 0;
$tagline = $tmdbData['tagline'] ?? '';
$runtime = $type === 'series' ? ($tmdbData['episode_run_time'][0] ?? 0) : ($tmdbData['runtime'] ?? 0);
$budget = $tmdbData['budget'] ?? 0;
$revenue = $tmdbData['revenue'] ?? 0;
$imdb_id = $tmdbData['imdb_id'] ?? '';
$adult = !empty($tmdbData['adult']) ? 1 : 0;
$language = $tmdbData['original_language'] ?? 'en';

// Extract genres as comma-separated string
$genres = [];
if (!empty($tmdbData['genres'])) {
    foreach ($tmdbData['genres'] as $g) $genres[] = $g['name'];
}
$genre = implode(', ', $genres);

// Extract production countries
$countries = [];
if (!empty($tmdbData['production_countries'])) {
    foreach ($tmdbData['production_countries'] as $c) $countries[] = $c['iso_3166_1'];
}
$country = implode(', ', $countries);

// Extract certification from release_dates (needs separate call for movies)
$certification = '';
if ($type !== 'series') {
    $certUrl = "https://api.themoviedb.org/3/movie/{$tmdb_id}/release_dates?api_key={$apiKey}";
    $certCh = curl_init();
    curl_setopt($certCh, CURLOPT_URL, $certUrl);
    curl_setopt($certCh, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($certCh, CURLOPT_SSL_VERIFYPEER, false);
    $certResponse = curl_exec($certCh);
    curl_close($certCh);
    if ($certResponse) {
        $certData = json_decode($certResponse, true);
        if (!empty($certData['results'])) {
            // Try PT first, then US
            foreach (['PT', 'US'] as $cc) {
                foreach ($certData['results'] as $r) {
                    if ($r['iso_3166_1'] === $cc && !empty($r['release_dates'])) {
                        foreach ($r['release_dates'] as $rd) {
                            if (!empty($rd['certification'])) {
                                $certification = $rd['certification'];
                                break 3;
                            }
                        }
                    }
                }
            }
        }
    }
}

// Secondary fetch in English
$name_en = '';
$description_en = '';
$tagline_en = '';

if ($configLanguage === 'bilingual') {
    $secUrl = "https://api.themoviedb.org/3/{$uri}/{$tmdb_id}?api_key={$apiKey}&language=en-US";
    $secCh = curl_init();
    curl_setopt($secCh, CURLOPT_URL, $secUrl);
    curl_setopt($secCh, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($secCh, CURLOPT_SSL_VERIFYPEER, false);
    $secResponse = curl_exec($secCh);
    curl_close($secCh);
    if ($secResponse) {
        $secData = json_decode($secResponse, true);
        if ($secData && !isset($secData['status_code'])) {
            $name_en = $type === 'series' ? ($secData['name'] ?? '') : ($secData['title'] ?? '');
            $description_en = $secData['overview'] ?? '';
            $tagline_en = $secData['tagline'] ?? '';
        }
    }
} elseif (stripos($configLanguage, 'en') === 0) {
    $name_en = $name;
    $description_en = $description;
    $tagline_en = $tagline;
}

// Slug
$slug = create_slug($name);

// Check if already exists
$check = $pdo->prepare("SELECT id FROM titles WHERE tmdb_id = ? AND is_series = ?");
$check->execute([$tmdb_id, $is_series]);
$existing_id = $check->fetchColumn();

if ($existing_id) {
    $local_id = $existing_id;
    $stmt = $pdo->prepare("UPDATE titles SET 
        name = ?, original_title = ?, description = ?, release_date = ?, poster = ?, backdrop = ?,
        tmdb_vote_average = ?, tmdb_vote_count = ?, popularity = ?, tagline = ?, runtime = ?,
        budget = ?, revenue = ?, imdb_id = ?, genre = ?, country = ?, language = ?,
        certification = ?, adult = ?, slug = ?, fully_synced = 1, updated_at = NOW(),
        name_en = ?, description_en = ?, tagline_en = ?
        WHERE id = ?");
    $stmt->execute([
        $name, $original_title, $description, $release_date, $poster, $backdrop,
        $tmdb_vote_average, $tmdb_vote_count, $popularity, $tagline, $runtime,
        $budget, $revenue, $imdb_id, $genre, $country, $language,
        $certification, $adult, $slug, 
        $name_en, $description_en, $tagline_en,
        $local_id
    ]);
} else {
    $stmt = $pdo->prepare("INSERT INTO titles (name, original_title, slug, description, release_date, poster, backdrop, type, is_series, tmdb_id, tmdb_vote_average, tmdb_vote_count, popularity, tagline, runtime, budget, revenue, imdb_id, genre, country, language, certification, adult, fully_synced, created_at, updated_at, name_en, description_en, tagline_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), ?, ?, ?)");
    $stmt->execute([$name, $original_title, $slug, $description, $release_date, $poster, $backdrop, $type, $is_series, $tmdb_id, $tmdb_vote_average, $tmdb_vote_count, $popularity, $tagline, $runtime, $budget, $revenue, $imdb_id, $genre, $country, $language, $certification, $adult, $name_en, $description_en, $tagline_en]);
    $local_id = $pdo->lastInsertId();
}

// Sync Videos
$videosToSync = $tmdbData['videos']['results'] ?? [];

// If no videos found in local language, try fetching them in English/Global
if (empty($videosToSync)) {
    $vUrl = "https://api.themoviedb.org/3/{$uri}/{$tmdb_id}/videos?api_key={$apiKey}";
    $vCh = curl_init();
    curl_setopt($vCh, CURLOPT_URL, $vUrl);
    curl_setopt($vCh, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($vCh, CURLOPT_SSL_VERIFYPEER, false);
    $vRes = curl_exec($vCh);
    curl_close($vCh);
    if ($vRes) {
        $vData = json_decode($vRes, true);
        $videosToSync = $vData['results'] ?? [];
    }
}

if (!empty($videosToSync)) {
    foreach (array_slice($videosToSync, 0, 5) as $video) {
        if ($video['site'] === 'YouTube') {
            $src = $video['key'];
            $vName = $video['name'];
            $vType = 'embed';
            $vCategory = strtolower($video['type']);
            
            $vCheck = $pdo->prepare("SELECT id FROM videos WHERE title_id = ? AND src = ?");
            $vCheck->execute([$local_id, $src]);
            if (!$vCheck->fetch()) {
                $vInsert = $pdo->prepare("INSERT INTO videos (name, src, type, title_id, category, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $vInsert->execute([$vName, $src, $vType, $local_id, $vCategory, 'tmdb']);
            }
        }
    }
}

// Sync Genres into genre_title pivot
if (!empty($tmdbData['genres'])) {
    $pdo->prepare("DELETE FROM genre_title WHERE title_id = ?")->execute([$local_id]);
    foreach ($tmdbData['genres'] as $g) {
        // Find or create genre
        $gCheck = $pdo->prepare("SELECT id FROM genres WHERE name = ?");
        $gCheck->execute([$g['name']]);
        $gId = $gCheck->fetchColumn();
        if (!$gId) {
            $pdo->prepare("INSERT INTO genres (name, display_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())")->execute([$g['name'], $g['name']]);
            $gId = $pdo->lastInsertId();
        }
        $pdo->prepare("INSERT INTO genre_title (genre_id, title_id) VALUES (?, ?)")->execute([$gId, $local_id]);
    }
}

// Sync Production Countries
if (!empty($tmdbData['production_countries'])) {
    $pdo->prepare("DELETE FROM country_title WHERE title_id = ?")->execute([$local_id]);
    foreach ($tmdbData['production_countries'] as $c) {
        $cCheck = $pdo->prepare("SELECT id FROM production_countries WHERE name = ?");
        $cCheck->execute([$c['iso_3166_1']]);
        $cId = $cCheck->fetchColumn();
        if (!$cId) {
            $pdo->prepare("INSERT INTO production_countries (name, display_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())")->execute([$c['iso_3166_1'], $c['name']]);
            $cId = $pdo->lastInsertId();
        }
        $pdo->prepare("INSERT INTO country_title (production_country_id, title_id) VALUES (?, ?)")->execute([$cId, $local_id]);
    }
}

// Sync Cast & Crew
if (!empty($tmdbData['credits'])) {
    // Remove old credits for this title
    $pdo->prepare("DELETE FROM creditables WHERE creditable_id = ? AND creditable_type = 'title'")->execute([$local_id]);

    // Cast (actors)
    if (!empty($tmdbData['credits']['cast'])) {
        foreach (array_slice($tmdbData['credits']['cast'], 0, 30) as $actor) {
            $personId = syncPerson($pdo, $actor, $apiKey);
            $pdo->prepare("INSERT INTO creditables (person_id, creditable_id, creditable_type, `character`, `order`, department, job) VALUES (?, ?, 'title', ?, ?, 'Acting', 'Actor')")
                ->execute([$personId, $local_id, $actor['character'] ?? '', $actor['order'] ?? 0]);
        }
    }

    // Crew (directors, writers, etc.)
    if (!empty($tmdbData['credits']['crew'])) {
        $seenCrew = [];
        foreach ($tmdbData['credits']['crew'] as $member) {
            $key = ($member['id'] ?? 0) . '-' . ($member['job'] ?? '');
            if (isset($seenCrew[$key])) continue;
            $seenCrew[$key] = true;
            // Only import key crew roles
            $importJobs = [
                'Director', 'Writer', 'Screenplay', 'Producer', 'Executive Producer', 
                'Director of Photography', 'Original Music Composer', 'Editor',
                'Co-Producer', 'Assistant Director', 'Art Direction', 'Costume Design'
            ];
            if (!in_array($member['job'] ?? '', $importJobs)) continue;
            $personId = syncPerson($pdo, $member, $apiKey);
            $pdo->prepare("INSERT INTO creditables (person_id, creditable_id, creditable_type, `character`, `order`, department, job) VALUES (?, ?, 'title', '', 0, ?, ?)")
                ->execute([$personId, $local_id, $member['department'] ?? '', $member['job'] ?? '']);
        }
    }
}

// Sync Reviews from TMDB removed as per user request


echo json_encode(['success' => true, 'id' => $local_id]);

// Helper: find or create a person from TMDB data
function syncPerson($pdo, $tmdbPerson, $apiKey) {
    $tmdbPersonId = $tmdbPerson['id'] ?? 0;
    $pCheck = $pdo->prepare("SELECT id FROM people WHERE tmdb_id = ?");
    $pCheck->execute([$tmdbPersonId]);
    $personId = $pCheck->fetchColumn();
    if (!$personId) {
        $photo = !empty($tmdbPerson['profile_path']) ? "https://image.tmdb.org/t/p/w185{$tmdbPerson['profile_path']}" : '';
        $slug = create_slug($tmdbPerson['name'] ?? 'Unknown');
        $pdo->prepare("INSERT INTO people (name, slug, poster, tmdb_id, known_for, gender, popularity, fully_synced, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())")
            ->execute([
                $tmdbPerson['name'] ?? 'Unknown',
                $slug,
                $photo,
                $tmdbPersonId,
                $tmdbPerson['known_for_department'] ?? '',
                $tmdbPerson['gender'] ?? 0,
                $tmdbPerson['popularity'] ?? 0
            ]);
        $personId = $pdo->lastInsertId();
    }
    return $personId;
}
