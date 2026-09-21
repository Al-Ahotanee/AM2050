<?php
declare(strict_types=1);

namespace AM2050\Core;

final class Response
{
    public static function success(mixed $data, int $status = 200): never
    {
        self::send(['success' => true, 'data' => $data], $status);
    }

    public static function paginate(array $data, int $page, int $limit, int $total): never
    {
        self::send(['success' => true, 'data' => $data, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / max(1, $limit))]]);
    }

    public static function error(string $message, int $status = 400, ?array $details = null): never
    {
        $payload = ['success' => false, 'error' => $message];
        if ($details !== null) {
            $payload['details'] = $details;
        }
        self::send($payload, $status);
    }

    public static function send(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        exit;
    }
}
