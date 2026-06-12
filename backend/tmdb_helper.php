<?php
require_once 'functions.php';
function fetchTMDB($endpoint, $params = []) {
    global $pdo;
    $apiKey = get_setting($pdo, 'tmdb.api_key');
    if (empty($apiKey)) {
        $apiKey = getenv('TMDB_API_KEY');
    }
    
    $query = http_build_query(array_merge(['api_key' => $apiKey], $params));
    $url = "https://api.themoviedb.org/3/{$endpoint}?{$query}";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

function sync_title_from_tmdb($pdo, $tmdb_id, $type) {
    $apiKey = get_setting($pdo, 'tmdb.api_key');
    if (empty($apiKey)) {
        $apiKey = getenv('TMDB_API_KEY');
    }
    $language = get_setting($pdo, 'tmdb.language', 'pt-PT');
    $primaryLanguage = ($language === 'bilingual') ? 'pt-PT' : $language;
    
    // Get local title ID
    $is_series = ($type === 'series' || $type === 'tv') ? 1 : 0;
    $stmt = $pdo->prepare("SELECT id FROM titles WHERE tmdb_id = ? AND is_series = ?");
    $stmt->execute([$tmdb_id, $is_series]);
    $local_id = $stmt->fetchColumn();
    
    if (!$local_id) return false;

    $uri = $type === 'series' ? 'tv' : 'movie';
    $url = "https://api.themoviedb.org/3/{$uri}/{$tmdb_id}?api_key={$apiKey}&language={$primaryLanguage}&append_to_response=videos";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    if (!$response) return false;

    $tmdbData = json_decode($response, true);
    if (isset($tmdbData['success']) && $tmdbData['success'] === false) return false;

    $name = $type === 'series' ? ($tmdbData['name'] ?? '') : ($tmdbData['title'] ?? '');
    $description = $tmdbData['overview'] ?? '';
    $tagline = $tmdbData['tagline'] ?? '';
    $release_date = $type === 'series' ? ($tmdbData['first_air_date'] ?? null) : ($tmdbData['release_date'] ?? null);
    $poster = !empty($tmdbData['poster_path']) ? "https://image.tmdb.org/t/p/w500{$tmdbData['poster_path']}" : '';
    $backdrop = !empty($tmdbData['backdrop_path']) ? "https://image.tmdb.org/t/p/original{$tmdbData['backdrop_path']}" : '';
    $tmdb_vote_average = $tmdbData['vote_average'] ?? 0;
    $popularity = $tmdbData['popularity'] ?? 0;

    // Secondary fetch in English
    $name_en = '';
    $description_en = '';
    $tagline_en = '';

    if ($language === 'bilingual') {
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
    } elseif (stripos($language, 'en') === 0) {
        $name_en = $name;
        $description_en = $description;
        $tagline_en = $tagline;
    }

    // Update Title
    $updateStmt = $pdo->prepare("UPDATE titles SET name = ?, description = ?, tagline = ?, release_date = ?, poster = ?, backdrop = ?, tmdb_vote_average = ?, popularity = ?, name_en = ?, description_en = ?, tagline_en = ?, fully_synced = 1, updated_at = NOW() WHERE id = ?");
    $updateStmt->execute([$name, $description, $tagline, $release_date, $poster, $backdrop, $tmdb_vote_average, $popularity, $name_en, $description_en, $tagline_en, $local_id]);
    
    // Sync Videos
    if (isset($tmdbData['videos']['results'])) {
        foreach ($tmdbData['videos']['results'] as $video) {
            if ($video['site'] === 'YouTube') {
                $videoKey = $video['key'];
                $fullSrc = "https://youtube.com/embed/" . $videoKey;
                $vName = $video['name'];
                $vType = 'embed';
                $vCategory = strtolower($video['type']);
                
                // Check if video already exists (check both full URL and just key to be safe)
                $vCheck = $pdo->prepare("SELECT id FROM videos WHERE title_id = ? AND (src = ? OR src LIKE ?)");
                $vCheck->execute([$local_id, $fullSrc, "%$videoKey%"]);
                if (!$vCheck->fetch()) {
                    $vInsert = $pdo->prepare("INSERT INTO videos (name, src, type, title_id, category, origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
                    $vInsert->execute([$vName, $fullSrc, $vType, $local_id, $vCategory, 'tmdb']);
                }
            }
        }
    }
    
    return true;
}
?>
