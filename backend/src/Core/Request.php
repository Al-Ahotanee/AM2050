<?php
declare(strict_types=1);

namespace AM2050\Core;

use InvalidArgumentException;

final class Request
{
    private array $attributes = [];
    private array $body;

    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        ?array $body = null,
    ) {
        $this->body = $body ?? $this->parseBody();
    }

    public static function fromGlobals(): self
    {
        $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        return new self($_SERVER['REQUEST_METHOD'] ?? 'GET', $uriPath, $_GET, array_change_key_case($headers, CASE_LOWER));
    }

    public function body(): array { return $this->body; }
    public function input(string $key, mixed $default = null): mixed { return $this->body[$key] ?? $default; }
    public function header(string $key): ?string { return $this->headers[strtolower($key)] ?? null; }
    public function set(string $key, mixed $value): void { $this->attributes[$key] = $value; }
    public function get(string $key, mixed $default = null): mixed { return $this->attributes[$key] ?? $default; }

    private function parseBody(): array
    {
        $raw = (string) file_get_contents('php://input');
        if ($raw === '') {
            return [];
        }
        $contentType = strtolower((string) ($this->header('content-type') ?? ''));
        if (str_starts_with($contentType, 'application/x-www-form-urlencoded')) {
            parse_str($raw, $parsed);
            if (!is_array($parsed)) {
                throw new InvalidArgumentException(json_encode(['body' => 'Form request body could not be read.'], JSON_THROW_ON_ERROR));
            }
            return $parsed;
        }
        try {
            $parsed = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new InvalidArgumentException(json_encode(['body' => 'Request body must be valid JSON.'], JSON_THROW_ON_ERROR));
        }
        if (!is_array($parsed)) {
            throw new InvalidArgumentException(json_encode(['body' => 'Request body must be a JSON object.'], JSON_THROW_ON_ERROR));
        }
        return $parsed;
    }
}
