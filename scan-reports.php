<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Reports 디렉토리 경로
$reportsDir = 'Reports';

// 재귀적으로 디렉토리를 스캔하여 HTML 파일 찾기
function scanReportsDirectory($dir) {
    $files = [];
    
    if (is_dir($dir)) {
        $items = scandir($dir);
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $path = $dir . '/' . $item;
            
            if (is_dir($path)) {
                // 하위 디렉토리 재귀 스캔
                $subFiles = scanReportsDirectory($path);
                $files = array_merge($files, $subFiles);
            } else if (pathinfo($path, PATHINFO_EXTENSION) === 'html') {
                // HTML 파일인 경우 추가
                // 날짜 형식 확인 (YYYY-MM-DD.html)
                $filename = pathinfo($path, PATHINFO_FILENAME);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $filename)) {
                    $files[] = $path;
                }
            }
        }
    }
    
    return $files;
}

// 파일 목록 가져오기
$reportFiles = scanReportsDirectory($reportsDir);

// 날짜 기준으로 정렬 (최신순)
usort($reportFiles, function($a, $b) {
    $dateA = pathinfo($a, PATHINFO_FILENAME);
    $dateB = pathinfo($b, PATHINFO_FILENAME);
    return strcmp($dateB, $dateA);
});

// JSON으로 출력
echo json_encode([
    'success' => true,
    'files' => $reportFiles,
    'count' => count($reportFiles)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>