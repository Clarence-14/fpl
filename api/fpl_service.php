<?php
/**
 * FPL Service
 * Handles data fetching from official Fantasy Premier League API,
 * caching to local storage, calculating analytics, smart scores,
 * fixture difficulty ratings (FDR), captaincy index, and differentials.
 */

class FPLService {
    private static $cacheDir = __DIR__ . '/../cache';
    private static $cacheTTL = 900; // 15 minutes TTL

    private static $endpoints = [
        'bootstrap' => 'https://fantasy.premierleague.com/api/bootstrap-static/',
        'fixtures'  => 'https://fantasy.premierleague.com/api/fixtures/',
    ];

    /**
     * Fetch JSON from URL with caching
     */
    public static function fetchWithCache($key, $url, $forceRefresh = false) {
        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0777, true);
        }

        $cacheFile = self::$cacheDir . '/' . $key . '.json';

        // Check if cached file is still valid
        if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < self::$cacheTTL)) {
            $content = file_get_contents($cacheFile);
            $json = json_decode($content, true);
            if ($json !== null) {
                return ['data' => $json, 'cached' => true, 'timestamp' => filemtime($cacheFile)];
            }
        }

        // Fetch fresh data via cURL
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Cache-Control: no-cache'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $json = json_decode($response, true);
            if ($json !== null) {
                file_put_contents($cacheFile, $response);
                return ['data' => $json, 'cached' => false, 'timestamp' => time()];
            }
        }

        // If cURL failed but we have an older cache, return that
        if (file_exists($cacheFile)) {
            $content = file_get_contents($cacheFile);
            $json = json_decode($content, true);
            if ($json !== null) {
                return ['data' => $json, 'cached' => true, 'timestamp' => filemtime($cacheFile), 'stale' => true];
            }
        }

        // If completely empty, return fallback realistic mock data
        return ['data' => self::getFallbackData($key), 'cached' => false, 'fallback' => true, 'timestamp' => time()];
    }

    /**
     * Get manager squad details given manager ID
     */
    public static function getManagerPicks($managerId, $gameweek) {
        $url = "https://fantasy.premierleague.com/api/entry/{$managerId}/event/{$gameweek}/picks/";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if ($data) return $data;
        }

        // Also fetch general manager info
        return null;
    }

    /**
     * Get manager summary information
     */
    public static function getManagerInfo($managerId) {
        $url = "https://fantasy.premierleague.com/api/entry/{$managerId}/";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            return json_decode($response, true);
        }
        return null;
    }

    /**
     * Process full enriched dataset for client app
     */
    public static function getEnrichedData($forceRefresh = false) {
        $bootstrapRes = self::fetchWithCache('bootstrap', self::$endpoints['bootstrap'], $forceRefresh);
        $fixturesRes  = self::fetchWithCache('fixtures', self::$endpoints['fixtures'], $forceRefresh);

        $bootstrap = $bootstrapRes['data'];
        $fixtures  = $fixturesRes['data'];

        // 1. Process Teams
        $teams = [];
        if (isset($bootstrap['teams'])) {
            foreach ($bootstrap['teams'] as $team) {
                $teams[$team['id']] = [
                    'id' => $team['id'],
                    'name' => $team['name'],
                    'short_name' => $team['short_name'],
                    'strength' => $team['strength'],
                    'strength_overall_home' => $team['strength_overall_home'],
                    'strength_overall_away' => $team['strength_overall_away'],
                    'strength_attack_home' => $team['strength_attack_home'],
                    'strength_attack_away' => $team['strength_attack_away'],
                    'strength_defence_home' => $team['strength_defence_home'],
                    'strength_defence_away' => $team['strength_defence_away'],
                    'fixtures' => [] // Will populate
                ];
            }
        }

        // 2. Process Gameweeks / Events
        $currentGW = 1;
        $nextGW = 1;
        $events = [];
        if (isset($bootstrap['events'])) {
            foreach ($bootstrap['events'] as $ev) {
                $events[] = [
                    'id' => $ev['id'],
                    'name' => $ev['name'],
                    'deadline_time' => $ev['deadline_time'],
                    'deadline_time_epoch' => strtotime($ev['deadline_time']),
                    'average_entry_score' => $ev['average_entry_score'],
                    'highest_score' => $ev['highest_score'],
                    'is_previous' => $ev['is_previous'],
                    'is_current' => $ev['is_current'],
                    'is_next' => $ev['is_next'],
                    'finished' => $ev['finished']
                ];
                if ($ev['is_current']) {
                    $currentGW = $ev['id'];
                }
                if ($ev['is_next']) {
                    $nextGW = $ev['id'];
                }
            }
        }

        // If season hasn't started or ended, make sure nextGW is valid
        if ($nextGW === 1 && $currentGW === 1 && !empty($events)) {
            foreach ($events as $ev) {
                if (!$ev['finished']) {
                    $nextGW = $ev['id'];
                    break;
                }
            }
        }

        // 3. Process Fixtures & Build Team Upcoming Schedule
        $upcomingFixtures = [];
        if (is_array($fixtures)) {
            foreach ($fixtures as $fix) {
                $event = $fix['event'];
                if ($event && $event >= $nextGW) {
                    $teamH = $fix['team_h'];
                    $teamA = $fix['team_a'];
                    $diffH = $fix['team_h_difficulty'];
                    $diffA = $fix['team_a_difficulty'];

                    if (isset($teams[$teamH])) {
                        $teams[$teamH]['fixtures'][] = [
                            'event' => $event,
                            'opponent_id' => $teamA,
                            'opponent_name' => $teams[$teamA]['short_name'] ?? 'OPP',
                            'is_home' => true,
                            'difficulty' => $diffH,
                            'kickoff_time' => $fix['kickoff_time']
                        ];
                    }

                    if (isset($teams[$teamA])) {
                        $teams[$teamA]['fixtures'][] = [
                            'event' => $event,
                            'opponent_id' => $teamH,
                            'opponent_name' => $teams[$teamH]['short_name'] ?? 'OPP',
                            'is_home' => false,
                            'difficulty' => $diffA,
                            'kickoff_time' => $fix['kickoff_time']
                        ];
                    }
                }
            }
        }

        // Calculate Next 3 & 5 Fixture Ease for each team
        $fdrSummary = [];
        foreach ($teams as $tId => &$tData) {
            usort($tData['fixtures'], function($a, $b) {
                return $a['event'] - $b['event'];
            });

            $next3 = array_slice($tData['fixtures'], 0, 3);
            $next5 = array_slice($tData['fixtures'], 0, 5);

            $diffSum3 = 0;
            foreach ($next3 as $f) $diffSum3 += $f['difficulty'];
            $avg3 = count($next3) > 0 ? round($diffSum3 / count($next3), 2) : 3.0;

            $diffSum5 = 0;
            foreach ($next5 as $f) $diffSum5 += $f['difficulty'];
            $avg5 = count($next5) > 0 ? round($diffSum5 / count($next5), 2) : 3.0;

            $tData['avg_fdr_3'] = $avg3;
            $tData['avg_fdr_5'] = $avg5;

            $fdrSummary[] = [
                'team_id' => $tId,
                'team_name' => $tData['name'],
                'short_name' => $tData['short_name'],
                'avg_fdr_3' => $avg3,
                'avg_fdr_5' => $avg5,
                'next_fixtures' => $next5
            ];
        }
        unset($tData);

        // Sort FDR Summary by easiest next 3 fixtures (ascending difficulty)
        usort($fdrSummary, function($a, $b) {
            if ($a['avg_fdr_3'] == $b['avg_fdr_3']) {
                return $a['avg_fdr_5'] <=> $b['avg_fdr_5'];
            }
            return $a['avg_fdr_3'] <=> $b['avg_fdr_3'];
        });

        // 4. Process Players (Elements)
        $positionMap = [1 => 'GKP', 2 => 'DEF', 3 => 'MID', 4 => 'FWD'];
        $players = [];
        $captains = [];
        $differentials = [];
        $transfersIn = [];
        $transfersOut = [];

        if (isset($bootstrap['elements'])) {
            foreach ($bootstrap['elements'] as $el) {
                $tId = $el['team'];
                $team = $teams[$tId] ?? null;
                $pos = $positionMap[$el['element_type']] ?? 'MID';
                $price = $el['now_cost'] / 10.0;
                $form = (float)$el['form'];
                $selectedBy = (float)$el['selected_by_percent'];
                $totalPoints = (int)$el['total_points'];
                $minutes = (int)$el['minutes'];
                $ppg = (float)$el['points_per_game'];

                // Expected stats
                $xG = isset($el['expected_goals']) ? (float)$el['expected_goals'] : 0.0;
                $xA = isset($el['expected_assists']) ? (float)$el['expected_assists'] : 0.0;
                $xGI = isset($el['expected_goal_involvements']) ? (float)$el['expected_goal_involvements'] : ($xG + $xA);
                $xGC = isset($el['expected_goals_conceded']) ? (float)$el['expected_goals_conceded'] : 0.0;

                // 90s played
                $nineties = max(0.1, $minutes / 90.0);
                $xGI90 = round($xGI / $nineties, 2);

                $ict = (float)$el['ict_index'];
                $avgFdr3 = $team ? $team['avg_fdr_3'] : 3.0;
                $avgFdr5 = $team ? $team['avg_fdr_5'] : 3.0;
                $nextOpponent = !empty($team['fixtures']) ? $team['fixtures'][0] : null;

                // Smart Buy Score (SBS) [0 - 100]
                // 1. Form Score: (form / 10) * 30 (cap form at 10)
                $formComponent = min(30, max(0, ($form / 10.0) * 30));

                // 2. Fixture Ease Score (easier fixtures -> higher score): (5.0 - avgFdr3) / 4.0 * 25
                $fdrComponent = max(0, min(25, ((5.0 - $avgFdr3) / 4.0) * 25));

                // 3. Expected Threat / xGI:
                $expectedComponent = min(25, max(0, ($xGI90 / 0.8) * 25));

                // 4. Value / Reliability: (points per million + minutes reliability)
                $minutesRatio = min(1.0, $minutes / max(90, ($currentGW * 90 * 0.75)));
                $valueRatio = min(1.0, ($totalPoints / max(1, $price)) / 15.0);
                $valueComponent = ($minutesRatio * 10) + ($valueRatio * 10);

                // Penalty for injury / unavailability
                $statusPenalty = 1.0;
                if ($el['status'] === 'i' || $el['status'] === 's') $statusPenalty = 0.05;
                elseif ($el['status'] === 'd') $statusPenalty = 0.5;
                elseif ($el['status'] === 'u') $statusPenalty = 0.0;

                $smartBuyScore = round(($formComponent + $fdrComponent + $expectedComponent + $valueComponent) * $statusPenalty, 1);

                // Captaincy Score (0 - 100)
                // Form (35%), Fixture Ease (30%), xGI (25%), Home Bonus (10%)
                $nextFDR = $nextOpponent ? $nextOpponent['difficulty'] : 3;
                $isHome = $nextOpponent ? $nextOpponent['is_home'] : false;
                $homeBonus = $isHome ? 10 : 0;
                $capFdrScore = max(0, (5 - $nextFDR) / 4.0 * 30);
                $capFormScore = min(35, ($form / 10.0) * 35);
                $capXgiScore = min(25, ($xGI90 / 0.9) * 25);
                $captaincyScore = round(($capFormScore + $capFdrScore + $capXgiScore + $homeBonus) * $statusPenalty, 1);

                $playerObj = [
                    'id' => $el['id'],
                    'web_name' => $el['web_name'],
                    'first_name' => $el['first_name'],
                    'second_name' => $el['second_name'],
                    'team_id' => $tId,
                    'team_name' => $team['name'] ?? '',
                    'team_short' => $team['short_name'] ?? '',
                    'element_type' => $el['element_type'],
                    'position' => $pos,
                    'price' => $price,
                    'cost_change_event' => $el['cost_change_event'] / 10.0,
                    'cost_change_start' => $el['cost_change_start'] / 10.0,
                    'status' => $el['status'],
                    'news' => $el['news'],
                    'chance_of_playing' => $el['chance_of_playing_next_round'],
                    'total_points' => $totalPoints,
                    'event_points' => $el['event_points'],
                    'points_per_game' => $ppg,
                    'form' => $form,
                    'value_form' => (float)$el['value_form'],
                    'value_season' => (float)$el['value_season'],
                    'selected_by_percent' => $selectedBy,
                    'minutes' => $minutes,
                    'goals_scored' => (int)$el['goals_scored'],
                    'assists' => (int)$el['assists'],
                    'clean_sheets' => (int)$el['clean_sheets'],
                    'goals_conceded' => (int)$el['goals_conceded'],
                    'bonus' => (int)$el['bonus'],
                    'bps' => (int)$el['bps'],
                    'influence' => (float)$el['influence'],
                    'creativity' => (float)$el['creativity'],
                    'threat' => (float)$el['threat'],
                    'ict_index' => $ict,
                    'expected_goals' => $xG,
                    'expected_assists' => $xA,
                    'expected_goal_involvements' => $xGI,
                    'expected_goals_conceded' => $xGC,
                    'xgi_per_90' => $xGI90,
                    'transfers_in_event' => (int)$el['transfers_in_event'],
                    'transfers_out_event' => (int)$el['transfers_out_event'],
                    'net_transfers_event' => (int)($el['transfers_in_event'] - $el['transfers_out_event']),
                    'avg_fdr_3' => $avgFdr3,
                    'avg_fdr_5' => $avgFdr5,
                    'next_opponent' => $nextOpponent,
                    'smart_buy_score' => $smartBuyScore,
                    'captaincy_score' => $captaincyScore,
                    'photo' => "https://resources.premierleague.com/premierleague/photos/players/110x140/p" . str_replace('.jpg', '.png', $el['code'])
                ];

                $players[] = $playerObj;

                // Top Captain Candidates (High captaincy score, midfielders & forwards prioritized)
                if ($captaincyScore >= 45 && ($pos === 'MID' || $pos === 'FWD' || $pos === 'DEF') && $el['status'] === 'a') {
                    $captains[] = $playerObj;
                }

                // Differentials (< 10% ownership, good form or xGI, favorable fixture)
                if ($selectedBy < 10.0 && $selectedBy > 0.5 && $el['status'] === 'a' && ($form >= 3.5 || $xGI90 >= 0.35) && $avgFdr3 <= 3.4) {
                    $differentials[] = $playerObj;
                }
            }
        }

        // Sort Captains by Captaincy Score
        usort($captains, function($a, $b) {
            return $b['captaincy_score'] <=> $a['captaincy_score'];
        });
        $captains = array_slice($captains, 0, 6);

        // Sort Differentials by Smart Buy Score
        usort($differentials, function($a, $b) {
            return $b['smart_buy_score'] <=> $a['smart_buy_score'];
        });
        $differentials = array_slice($differentials, 0, 8);

        // Sort Transfers In & Out
        $transfersIn = $players;
        usort($transfersIn, function($a, $b) {
            return $b['transfers_in_event'] <=> $a['transfers_in_event'];
        });
        $transfersIn = array_slice($transfersIn, 0, 5);

        $transfersOut = $players;
        usort($transfersOut, function($a, $b) {
            return $b['transfers_out_event'] <=> $a['transfers_out_event'];
        });
        $transfersOut = array_slice($transfersOut, 0, 5);

        return [
            'success' => true,
            'cached' => $bootstrapRes['cached'] ?? false,
            'last_updated' => date('Y-m-d H:i:s', $bootstrapRes['timestamp'] ?? time()),
            'current_gameweek' => $currentGW,
            'next_gameweek' => $nextGW,
            'gameweeks' => $events,
            'teams' => array_values($teams),
            'fdr_ticker' => $fdrSummary,
            'players' => $players,
            'captains' => $captains,
            'differentials' => $differentials,
            'top_transfers_in' => $transfersIn,
            'top_transfers_out' => $transfersOut
        ];
    }

    /**
     * Fallback mock data generator in case FPL servers are unreachable
     */
    private static function getFallbackData($key) {
        if ($key === 'bootstrap') {
            return [
                'events' => [
                    ['id' => 1, 'name' => 'Gameweek 1', 'deadline_time' => date('Y-m-d\TH:i:s\Z', strtotime('+3 days')), 'average_entry_score' => 64, 'highest_score' => 125, 'is_previous' => false, 'is_current' => true, 'is_next' => false, 'finished' => false],
                    ['id' => 2, 'name' => 'Gameweek 2', 'deadline_time' => date('Y-m-d\TH:i:s\Z', strtotime('+10 days')), 'average_entry_score' => 0, 'highest_score' => 0, 'is_previous' => false, 'is_current' => false, 'is_next' => true, 'finished' => false]
                ],
                'teams' => [
                    ['id' => 1, 'name' => 'Arsenal', 'short_name' => 'ARS', 'strength' => 5, 'strength_overall_home' => 1350, 'strength_overall_away' => 1360, 'strength_attack_home' => 1340, 'strength_attack_away' => 1350, 'strength_defence_home' => 1360, 'strength_defence_away' => 1370],
                    ['id' => 2, 'name' => 'Aston Villa', 'short_name' => 'AVL', 'strength' => 4, 'strength_overall_home' => 1210, 'strength_overall_away' => 1230, 'strength_attack_home' => 1220, 'strength_attack_away' => 1240, 'strength_defence_home' => 1200, 'strength_defence_away' => 1220],
                    ['id' => 3, 'name' => 'Chelsea', 'short_name' => 'CHE', 'strength' => 4, 'strength_overall_home' => 1220, 'strength_overall_away' => 1240, 'strength_attack_home' => 1230, 'strength_attack_away' => 1250, 'strength_defence_home' => 1210, 'strength_defence_away' => 1230],
                    ['id' => 4, 'name' => 'Liverpool', 'short_name' => 'LIV', 'strength' => 5, 'strength_overall_home' => 1340, 'strength_overall_away' => 1350, 'strength_attack_home' => 1350, 'strength_attack_away' => 1360, 'strength_defence_home' => 1330, 'strength_defence_away' => 1340],
                    ['id' => 5, 'name' => 'Manchester City', 'short_name' => 'MCI', 'strength' => 5, 'strength_overall_home' => 1360, 'strength_overall_away' => 1370, 'strength_attack_home' => 1370, 'strength_attack_away' => 1380, 'strength_defence_home' => 1350, 'strength_defence_away' => 1360],
                    ['id' => 6, 'name' => 'Newcastle', 'short_name' => 'NEW', 'strength' => 4, 'strength_overall_home' => 1200, 'strength_overall_away' => 1210, 'strength_attack_home' => 1210, 'strength_attack_away' => 1220, 'strength_defence_home' => 1190, 'strength_defence_away' => 1200],
                    ['id' => 7, 'name' => 'Tottenham', 'short_name' => 'TOT', 'strength' => 4, 'strength_overall_home' => 1210, 'strength_overall_away' => 1220, 'strength_attack_home' => 1230, 'strength_attack_away' => 1240, 'strength_defence_home' => 1190, 'strength_defence_away' => 1200]
                ],
                'elements' => [
                    ['id' => 1, 'web_name' => 'Haaland', 'first_name' => 'Erling', 'second_name' => 'Haaland', 'team' => 5, 'element_type' => 4, 'now_cost' => 152, 'cost_change_event' => 1, 'cost_change_start' => 2, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 75, 'event_points' => 13, 'points_per_game' => '9.4', 'form' => '9.8', 'value_form' => '0.6', 'value_season' => '4.9', 'selected_by_percent' => '68.5', 'minutes' => 720, 'goals_scored' => 10, 'assists' => 1, 'clean_sheets' => 3, 'goals_conceded' => 8, 'bonus' => 15, 'bps' => 310, 'influence' => '420.0', 'creativity' => '110.0', 'threat' => '540.0', 'ict_index' => '107.0', 'expected_goals' => '8.92', 'expected_assists' => '1.14', 'expected_goal_involvements' => '10.06', 'expected_goals_conceded' => '7.80', 'transfers_in_event' => 185000, 'transfers_out_event' => 12000, 'code' => '223094.jpg'],
                    ['id' => 2, 'web_name' => 'Salah', 'first_name' => 'Mohamed', 'second_name' => 'Salah', 'team' => 4, 'element_type' => 3, 'now_cost' => 127, 'cost_change_event' => 1, 'cost_change_start' => 2, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 72, 'event_points' => 12, 'points_per_game' => '9.0', 'form' => '8.6', 'value_form' => '0.7', 'value_season' => '5.7', 'selected_by_percent' => '48.2', 'minutes' => 710, 'goals_scored' => 6, 'assists' => 5, 'clean_sheets' => 4, 'goals_conceded' => 5, 'bonus' => 12, 'bps' => 290, 'influence' => '390.0', 'creativity' => '280.0', 'threat' => '460.0', 'ict_index' => '113.0', 'expected_goals' => '5.40', 'expected_assists' => '3.80', 'expected_goal_involvements' => '9.20', 'expected_goals_conceded' => '6.10', 'transfers_in_event' => 142000, 'transfers_out_event' => 18000, 'code' => '118748.jpg'],
                    ['id' => 3, 'web_name' => 'Saka', 'first_name' => 'Bukayo', 'second_name' => 'Saka', 'team' => 1, 'element_type' => 3, 'now_cost' => 101, 'cost_change_event' => 0, 'cost_change_start' => 1, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 58, 'event_points' => 9, 'points_per_game' => '7.2', 'form' => '7.4', 'value_form' => '0.7', 'value_season' => '5.7', 'selected_by_percent' => '33.8', 'minutes' => 680, 'goals_scored' => 3, 'assists' => 7, 'clean_sheets' => 3, 'goals_conceded' => 6, 'bonus' => 10, 'bps' => 250, 'influence' => '330.0', 'creativity' => '320.0', 'threat' => '340.0', 'ict_index' => '99.0', 'expected_goals' => '3.10', 'expected_assists' => '4.50', 'expected_goal_involvements' => '7.60', 'expected_goals_conceded' => '6.20', 'transfers_in_event' => 98000, 'transfers_out_event' => 14000, 'code' => '223340.jpg'],
                    ['id' => 4, 'web_name' => 'Palmer', 'first_name' => 'Cole', 'second_name' => 'Palmer', 'team' => 3, 'element_type' => 3, 'now_cost' => 108, 'cost_change_event' => 2, 'cost_change_start' => 3, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 65, 'event_points' => 15, 'points_per_game' => '8.1', 'form' => '9.2', 'value_form' => '0.9', 'value_season' => '6.0', 'selected_by_percent' => '52.1', 'minutes' => 700, 'goals_scored' => 6, 'assists' => 5, 'clean_sheets' => 2, 'goals_conceded' => 9, 'bonus' => 14, 'bps' => 280, 'influence' => '380.0', 'creativity' => '290.0', 'threat' => '410.0', 'ict_index' => '108.0', 'expected_goals' => '4.80', 'expected_assists' => '3.90', 'expected_goal_involvements' => '8.70', 'expected_goals_conceded' => '8.50', 'transfers_in_event' => 210000, 'transfers_out_event' => 11000, 'code' => '244855.jpg'],
                    ['id' => 5, 'web_name' => 'Gabriel', 'first_name' => 'Gabriel', 'second_name' => 'dos Santos', 'team' => 1, 'element_type' => 2, 'now_cost' => 62, 'cost_change_event' => 1, 'cost_change_start' => 2, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 46, 'event_points' => 8, 'points_per_game' => '5.8', 'form' => '6.2', 'value_form' => '1.0', 'value_season' => '7.4', 'selected_by_percent' => '25.6', 'minutes' => 720, 'goals_scored' => 2, 'assists' => 0, 'clean_sheets' => 4, 'goals_conceded' => 6, 'bonus' => 8, 'bps' => 210, 'influence' => '240.0', 'creativity' => '30.0', 'threat' => '180.0', 'ict_index' => '45.0', 'expected_goals' => '1.45', 'expected_assists' => '0.10', 'expected_goal_involvements' => '1.55', 'expected_goals_conceded' => '6.20', 'transfers_in_event' => 85000, 'transfers_out_event' => 9000, 'code' => '226597.jpg'],
                    ['id' => 6, 'web_name' => 'Raya', 'first_name' => 'David', 'second_name' => 'Raya Martin', 'team' => 1, 'element_type' => 1, 'now_cost' => 56, 'cost_change_event' => 1, 'cost_change_start' => 1, 'status' => 'a', 'news' => '', 'chance_of_playing_next_round' => 100, 'total_points' => 44, 'event_points' => 7, 'points_per_game' => '5.5', 'form' => '5.8', 'value_form' => '1.0', 'value_season' => '7.9', 'selected_by_percent' => '32.1', 'minutes' => 720, 'goals_scored' => 0, 'assists' => 0, 'clean_sheets' => 4, 'goals_conceded' => 6, 'bonus' => 6, 'bps' => 195, 'influence' => '210.0', 'creativity' => '0.0', 'threat' => '0.0', 'ict_index' => '21.0', 'expected_goals' => '0.00', 'expected_assists' => '0.00', 'expected_goal_involvements' => '0.00', 'expected_goals_conceded' => '6.20', 'transfers_in_event' => 62000, 'transfers_out_event' => 8000, 'code' => '154561.jpg']
                ]
            ];
        }

        if ($key === 'fixtures') {
            return [
                ['id' => 1, 'event' => 1, 'team_h' => 1, 'team_a' => 6, 'team_h_difficulty' => 3, 'team_a_difficulty' => 4, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+3 days'))],
                ['id' => 2, 'event' => 1, 'team_h' => 5, 'team_a' => 2, 'team_h_difficulty' => 2, 'team_a_difficulty' => 5, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+3 days'))],
                ['id' => 3, 'event' => 1, 'team_h' => 4, 'team_a' => 3, 'team_h_difficulty' => 3, 'team_a_difficulty' => 4, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+4 days'))],
                ['id' => 4, 'event' => 2, 'team_h' => 2, 'team_a' => 1, 'team_h_difficulty' => 4, 'team_a_difficulty' => 3, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+10 days'))],
                ['id' => 5, 'event' => 2, 'team_h' => 3, 'team_a' => 5, 'team_h_difficulty' => 5, 'team_a_difficulty' => 3, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+10 days'))],
                ['id' => 6, 'event' => 2, 'team_h' => 6, 'team_a' => 4, 'team_h_difficulty' => 4, 'team_a_difficulty' => 3, 'kickoff_time' => date('Y-m-d\TH:i:s\Z', strtotime('+11 days'))]
            ];
        }

        return [];
    }
}
