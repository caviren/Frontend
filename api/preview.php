<?php
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  http_response_code(405);
  header("Content-Type: application/json; charset=UTF-8");
  echo json_encode(array("live" => false));
  exit;
}

$dataPath = __DIR__ . "/preview-data.json";
$record = json_decode(@file_get_contents($dataPath), true);
if (!is_array($record)) {
  http_response_code(500);
  header("Content-Type: application/json; charset=UTF-8");
  echo json_encode(array("live" => false));
  exit;
}

function preview_payload($record, $seq) {
  $record["live"] = true;
  $record["seq"] = $seq;
  $record["asOf"] = gmdate("c");
  return json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

$stream = isset($_GET["stream"]) && $_GET["stream"] !== "" && $_GET["stream"] !== "0";

if (!$stream) {
  header("Content-Type: application/json; charset=UTF-8");
  echo preview_payload($record, 1);
  exit;
}

@set_time_limit(0);
header("Content-Type: text/event-stream; charset=UTF-8");
header("Connection: keep-alive");
header("X-Accel-Buffering: no");
while (ob_get_level() > 0) {
  ob_end_flush();
}

$started = time();
$seq = 0;
while (!connection_aborted() && (time() - $started) < 55) {
  $fresh = json_decode(@file_get_contents($dataPath), true);
  if (is_array($fresh)) $record = $fresh;
  $seq += 1;
  echo "data: " . preview_payload($record, $seq) . "\n\n";
  flush();
  sleep(2);
}
