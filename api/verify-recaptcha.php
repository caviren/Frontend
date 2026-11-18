<?php
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(array("success" => false));
  exit;
}

$configPath = dirname(__DIR__) . "/private/recaptcha.php";
if (!is_file($configPath)) {
  http_response_code(500);
  echo json_encode(array("success" => false));
  exit;
}

$config = include $configPath;
$raw = file_get_contents("php://input");
$body = json_decode($raw, true);
$token = is_array($body) && isset($body["token"]) ? $body["token"] : "";

if (!is_string($token) || $token === "" || !isset($config["secret"])) {
  http_response_code(400);
  echo json_encode(array("success" => false));
  exit;
}

$payload = http_build_query(array(
  "secret" => $config["secret"],
  "response" => $token,
  "remoteip" => isset($_SERVER["REMOTE_ADDR"]) ? $_SERVER["REMOTE_ADDR"] : ""
));

$context = stream_context_create(array(
  "http" => array(
    "method" => "POST",
    "header" => "Content-Type: application/x-www-form-urlencoded\r\n",
    "content" => $payload,
    "timeout" => 8
  )
));

$result = @file_get_contents("https://www.google.com/recaptcha/api/siteverify", false, $context);
if ($result === false) {
  http_response_code(502);
  echo json_encode(array("success" => false));
  exit;
}

echo $result;
