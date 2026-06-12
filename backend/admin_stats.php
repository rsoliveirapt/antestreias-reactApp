<?php
require 'headers.php';
require 'db.php';
require 'functions.php';
require '../../vendor/autoload.php';

// Track the admin's own activity when viewing stats
track_visitor($pdo);

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;

$propertyId = get_setting($pdo, 'analytics.property_id');
$serviceAccountJson = get_setting($pdo, 'analytics.service_account_json');

if (!$propertyId || !$serviceAccountJson) {
    echo json_encode(getLocalStats($pdo));
    exit;
}

try {
    $keyFile = 'ga_key_' . uniqid() . '.json';
    file_put_contents($keyFile, $serviceAccountJson);
    $client = new BetaAnalyticsDataClient(['credentials' => $keyFile]);
    $property = 'properties/' . $propertyId;

    $stats = [];

    // 1. OVERVIEW & TOTALS
    $response = $client->runReport([
        'property' => $property,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'metrics' => [
            new Metric(['name' => 'activeUsers']),
            new Metric(['name' => 'screenPageViews']),
            new Metric(['name' => 'sessions']),
            new Metric(['name' => 'engagedSessions']),
        ],
    ]);
    $row = $response->getRows()[0] ?? null;
    $stats['totals'] = [
        'users' => $row ? (int)$row->getMetricValues()[0]->getValue() : 0,
        'plays' => $row ? (int)$row->getMetricValues()[1]->getValue() : 0,
        'engagement' => $row ? (int)$row->getMetricValues()[3]->getValue() : 0,
        'comments' => 0,
    ];

    // 2. AUDIENCE: Countries
    $response = $client->runReport([
        'property' => $property,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'dimensions' => [new Dimension(['name' => 'country'])],
        'metrics' => [new Metric(['name' => 'activeUsers'])],
        'orderBys' => [new OrderBy(['metric' => new OrderBy\MetricOrderBy(['metric_name' => 'activeUsers']), 'desc' => true])],
        'limit' => 5
    ]);
    $stats['countries'] = array_map(fn($r) => ['name' => $r->getDimensionValues()[0]->getValue(), 'value' => (int)$r->getMetricValues()[0]->getValue()], iterator_to_array($response->getRows()));

    // 3. TRAFFIC SOURCES
    $response = $client->runReport([
        'property' => $property,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'dimensions' => [new Dimension(['name' => 'sessionSource'])],
        'metrics' => [new Metric(['name' => 'sessions'])],
        'orderBys' => [new OrderBy(['metric' => new OrderBy\MetricOrderBy(['metric_name' => 'sessions']), 'desc' => true])],
        'limit' => 5
    ]);
    $stats['sources'] = array_map(fn($r) => ['name' => $r->getDimensionValues()[0]->getValue(), 'value' => (int)$r->getMetricValues()[0]->getValue()], iterator_to_array($response->getRows()));

    // 4. TECHNOLOGY (Browsers)
    $response = $client->runReport([
        'property' => $property,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'dimensions' => [new Dimension(['name' => 'browser'])],
        'metrics' => [new Metric(['name' => 'activeUsers'])],
        'limit' => 5
    ]);
    $stats['browsers'] = array_map(fn($r) => ['name' => $r->getDimensionValues()[0]->getValue(), 'value' => (int)$r->getMetricValues()[0]->getValue()], iterator_to_array($response->getRows()));

    // 5. BEHAVIOR: Top Pages
    $response = $client->runReport([
        'property' => $property,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'dimensions' => [new Dimension(['name' => 'pageTitle']), new Dimension(['name' => 'pagePath'])],
        'metrics' => [new Metric(['name' => 'screenPageViews'])],
        'orderBys' => [new OrderBy(['metric' => new OrderBy\MetricOrderBy(['metric_name' => 'screenPageViews']), 'desc' => true])],
        'limit' => 10
    ]);
    $stats['top_pages'] = array_map(fn($r) => [
        'title' => $r->getDimensionValues()[0]->getValue(),
        'path' => $r->getDimensionValues()[1]->getValue(),
        'views' => (int)$r->getMetricValues()[0]->getValue()
    ], iterator_to_array($response->getRows()));

    // 6. REAL-TIME (Active Users last 30 mins)
    $realtime = $client->runRealtimeReport([
        'property' => $property,
        'metrics' => [new Metric(['name' => 'activeUsers'])],
    ]);
    $stats['realtime_users'] = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)")->fetchColumn();

    // Add local visitor tracking even when GA4 is active
    $stats['realtime_visitors'] = (int)$pdo->query("SELECT COUNT(*) FROM visitor_log WHERE user_id IS NULL AND last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)")->fetchColumn();

    // 7. LOCAL DATA: Top Contests (Clicks)
    $stats['top_contests'] = $pdo->query("SELECT name, clicks FROM contests WHERE clicks > 0 ORDER BY clicks DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    // 8. LOCAL DATA: Recent Activity
    $stats['recent_activity'] = $pdo->query("
        SELECT item_type, action, created_at 
        FROM activity_log 
        ORDER BY created_at DESC 
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 9. LOCAL DATA: Detailed Visitor History
    $stats['visitor_history'] = $pdo->query("
        SELECT v.ip_address, MAX(v.last_activity) as last_activity, 
               MAX(u.username) as username, MAX(u.avatar) as avatar, MAX(u.role) as role
        FROM visitor_log v
        LEFT JOIN users u ON v.user_id = u.id
        GROUP BY v.ip_address
        ORDER BY last_activity DESC 
        LIMIT 50
    ")->fetchAll(PDO::FETCH_ASSOC);

    if (file_exists($keyFile)) unlink($keyFile);
    echo json_encode($stats);

} catch (Exception $e) {
    if (isset($keyFile) && file_exists($keyFile)) unlink($keyFile);
    echo json_encode(getLocalStats($pdo, $e->getMessage()));
}

function getLocalStats($pdo, $error = null) {
    // Count logged in users (active in last 15 mins)
    $activeUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)")->fetchColumn();
    
    // Count anonymous visitors (active in last 15 mins)
    $activeVisitors = $pdo->query("
        SELECT COUNT(DISTINCT ip_address) 
        FROM visitor_log 
        WHERE user_id IS NULL 
        AND last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        AND ip_address NOT IN (
            SELECT DISTINCT ip_address FROM visitor_log WHERE user_id IS NOT NULL AND last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        )
    ")->fetchColumn();

    return [
        'error' => $error,
        'totals' => [
            'users' => (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
            'plays' => (int)$pdo->query("SELECT COUNT(*) FROM video_plays")->fetchColumn(),
            'comments' => 0,
            'engagement' => 0
        ],
        'top_contests' => $pdo->query("SELECT name, clicks FROM contests WHERE clicks > 0 ORDER BY clicks DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC),
        'recent_activity' => $pdo->query("SELECT item_type, action, created_at FROM activity_log ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC),
        'visitor_history' => $pdo->query("
            SELECT v.ip_address, MAX(v.last_activity) as last_activity, 
                   MAX(u.username) as username, MAX(u.avatar) as avatar, MAX(u.role) as role
            FROM visitor_log v
            LEFT JOIN users u ON v.user_id = u.id
            GROUP BY v.ip_address
            ORDER BY last_activity DESC 
            LIMIT 50
        ")->fetchAll(PDO::FETCH_ASSOC),
        'realtime_users' => (int)$activeUsers,
        'realtime_visitors' => (int)$activeVisitors,
        'countries' => [], 'sources' => [], 'browsers' => [], 'top_pages' => []
    ];
}
