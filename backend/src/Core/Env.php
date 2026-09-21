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
        $hasDatabaseUrl = (self::get('DATABASE_URL') !== null && self::get('DATABASE_URL') !== '');
        if (!$hasDatabaseUrl) {
            foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'] as $key) {
                if (self::get($key) === null || self::get($key) === '') {
                    throw new RuntimeException("Missing required environment variable: {$key}");
                }
            }
        }
        if (self::get('JWT_SECRET') === null || self::get('JWT_SECRET') === '') {
            throw new RuntimeException('Missing required environment variable: JWT_SECRET');
        }
        if (strlen((string) self::get('JWT_SECRET')) < 32) {
            throw new RuntimeException('JWT_SECRET must contain at least 32 characters.');
        }
        date_default_timezone_set(self::get('APP_TIMEZONE', 'Africa/Lagos'));
    }

    /**
     * Lighter variant used by the migration runner: only DB credentials are required.
     * JWT_SECRET is not needed to run SQL migrations.
     */
    public static function loadForMigration(string $root): void
    {
        if (is_file($root . '/.env')) {
            Dotenv::createImmutable($root)->safeLoad();
        }
        $hasDatabaseUrl = (self::get('DATABASE_URL') !== null && self::get('DATABASE_URL') !== '');
        if (!$hasDatabaseUrl) {
            foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'] as $key) {
                if (self::get($key) === null || self::get($key) === '') {
                    throw new RuntimeException("Missing required environment variable: {$key}");
                }
            }
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
