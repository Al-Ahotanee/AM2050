<?php
declare(strict_types=1);

namespace AM2050\Core;

use Dotenv\Dotenv;
use RuntimeException;

final class Env
{
    public static function load(string $root): void
    {
        if (is_file($root . '/.env')) {
            Dotenv::createImmutable($root)->safeLoad();
        }
        foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'JWT_SECRET'] as $key) {
            if (self::get($key) === null || self::get($key) === '') {
                throw new RuntimeException("Missing required environment variable: {$key}");
            }
        }
        if (strlen((string) self::get('JWT_SECRET')) < 32) {
            throw new RuntimeException('JWT_SECRET must contain at least 32 characters.');
        }
        date_default_timezone_set(self::get('APP_TIMEZONE', 'Africa/Lagos'));
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? getenv($key);
        return $value === false || $value === null ? $default : (string) $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        return filter_var(self::get($key, $default ? 'true' : 'false'), FILTER_VALIDATE_BOOL);
    }
}
