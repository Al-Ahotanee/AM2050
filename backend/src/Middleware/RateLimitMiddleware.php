<?php
declare(strict_types=1);

namespace AM2050\Middleware;

use AM2050\Core\Request;
use AM2050\Core\Response;
use PDO;

final class RateLimitMiddleware
{
    public function __construct(private readonly PDO $pdo)
    {
        $this->ensureTable();
    }

    public function check(Request $request, string $action = 'login', int $maxAttempts = 15, int $windowSeconds = 60): void
    {
        $ip = $this->clientIp();
        $key = "rl:{$action}:" . md5($ip);
        $now = time();

        $stmt = $this->pdo->prepare('SELECT attempts, reset_at FROM rate_limits WHERE key_name = :key');
        $stmt->execute(['key' => $key]);
        $record = $stmt->fetch();

        if ($record !== false && (int) $record['reset_at'] > $now) {
            if ((int) $record['attempts'] >= $maxAttempts) {
                $retryAfter = (int) $record['reset_at'] - $now;
                header("Retry-After: {$retryAfter}");
                Response::error('Too many requests. Please slow down and try again later.', 429);
            }

            $update = $this->pdo->prepare('UPDATE rate_limits SET attempts = attempts + 1 WHERE key_name = :key');
            $update->execute(['key' => $key]);
        } else {
            $resetAt = $now + $windowSeconds;
            $upsert = $this->pdo->prepare('INSERT INTO rate_limits (key_name, attempts, reset_at) VALUES (:key, 1, :reset) ON DUPLICATE KEY UPDATE attempts = 1, reset_at = VALUES(reset_at)');
            $upsert->execute(['key' => $key, 'reset' => $resetAt]);
        }
    }

    private function clientIp(): string
    {
        $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($forwarded !== '') {
            $parts = explode(',', $forwarded);
            return trim($parts[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    private function ensureTable(): void
    {
        try {
            $this->pdo->exec('CREATE TABLE IF NOT EXISTS rate_limits (
                key_name VARCHAR(191) PRIMARY KEY,
                attempts INT NOT NULL DEFAULT 1,
                reset_at INT NOT NULL,
                INDEX idx_rate_limits_reset (reset_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        } catch (\Throwable) {
            // Ignore if DB is initializing
        }
    }
}
