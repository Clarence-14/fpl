<?php
/**
 * REST API endpoint to retrieve an FPL manager's squad and info by Team ID
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/fpl_service.php';

$teamId = isset($_GET['team_id']) ? intval($_GET['team_id']) : 0;
$gameweek = isset($_GET['gw']) ? intval($_GET['gw']) : 0;

if ($teamId <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid or missing manager Team ID'
    ]);
    exit;
}

try {
    // 1. Get manager general info
    $managerInfo = FPLService::getManagerInfo($teamId);
    if (!$managerInfo) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Manager or Team ID not found on FPL servers'
        ]);
        exit;
    }

    // 2. If no GW specified, determine current gameweek from bootstrap data
    if ($gameweek <= 0) {
        $enriched = FPLService::getEnrichedData();
        $gameweek = $enriched['current_gameweek'] ?? 1;
    }

    // 3. Get picks
    $picksData = FPLService::getManagerPicks($teamId, $gameweek);
    if (!$picksData && $gameweek > 1) {
        // Try previous gameweek if current gameweek picks are not yet locked/released
        $picksData = FPLService::getManagerPicks($teamId, $gameweek - 1);
        if ($picksData) {
            $gameweek = $gameweek - 1;
        }
    }

    echo json_encode([
        'success' => true,
        'manager' => [
            'id' => $managerInfo['id'] ?? $teamId,
            'player_name' => ($managerInfo['player_first_name'] ?? '') . ' ' . ($managerInfo['player_last_name'] ?? ''),
            'team_name' => $managerInfo['name'] ?? 'My Squad',
            'overall_rank' => $managerInfo['summary_overall_rank'] ?? null,
            'total_points' => $managerInfo['summary_overall_points'] ?? null,
            'event_points' => $managerInfo['summary_event_points'] ?? null,
        ],
        'gameweek' => $gameweek,
        'picks' => $picksData['picks'] ?? [],
        'entry_history' => $picksData['entry_history'] ?? null,
        'active_chip' => $picksData['active_chip'] ?? null
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
