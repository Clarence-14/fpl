<?php
/**
 * REST API endpoint to retrieve processed FPL data
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/fpl_service.php';

try {
    $forceRefresh = isset($_GET['force_refresh']) && $_GET['force_refresh'] === '1';
    $data = FPLService::getEnrichedData($forceRefresh);
    echo json_encode($data, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
