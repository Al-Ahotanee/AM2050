<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Env;
use AM2050\Support\Ulids;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;
use RuntimeException;

final class AuthService
{
    public function __construct(private readonly PDO $pdo) {}

    public function login(string $phone, string $password): array
    {
        $statement = $this->pdo->prepare('SELECT * FROM users WHERE phone = :phone LIMIT 1');
        $statement->execute(['phone' => $phone]);
        $user = $statement->fetch();
        if ($user === false || !(bool) $user['is_active']) {
            throw new RuntimeException('Invalid credentials.');
        }
        if ($user['locked_until'] !== null && strtotime($user['locked_until']) > time()) {
            throw new RuntimeException('Account is temporarily locked. Please try again later.');
        }
        if (!password_verify($password, $user['password_hash'])) {
            $failures = ((int) $user['failed_login_count']) + 1;
            $lockUntil = $failures >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
            $update = $this->pdo->prepare('UPDATE users SET failed_login_count = :failures, locked_until = :lockedUntil WHERE id = :id');
            $update->execute(['failures' => $failures >= 5 ? 0 : $failures, 'lockedUntil' => $lockUntil, 'id' => $user['id']]);
            throw new RuntimeException('Invalid credentials.');
        }
        $this->pdo->prepare('UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login = NOW() WHERE id = :id')->execute(['id' => $user['id']]);
        return $this->issueTokens($user);
    }

    public function refresh(string $refreshToken): array
    {
        [$userId] = $this->parseRefreshCookie($refreshToken);
        $statement = $this->pdo->prepare('SELECT rt.*, u.* FROM refresh_tokens rt INNER JOIN users u ON u.id = rt.user_id WHERE rt.user_id = :userId AND rt.expires_at > NOW() AND u.is_active = 1');
        $statement->execute(['userId' => $userId]);
        $tokens = $statement->fetchAll();
        foreach ($tokens as $row) {
            if (password_verify($refreshToken, $row['token_hash'])) {
                $this->pdo->prepare('DELETE FROM refresh_tokens WHERE id = :id')->execute(['id' => $row['id']]);
                return $this->issueTokens($row);
            }
        }
        $this->pdo->prepare('DELETE FROM refresh_tokens WHERE user_id = :userId')->execute(['userId' => $userId]);
        throw new RuntimeException('Refresh token is invalid or expired.');
    }

    public function logout(string $refreshToken): void
    {
        [$userId] = $this->parseRefreshCookie($refreshToken);
        $statement = $this->pdo->prepare('SELECT id, token_hash FROM refresh_tokens WHERE user_id = :userId');
        $statement->execute(['userId' => $userId]);
        $tokens = $statement->fetchAll();
        foreach ($tokens as $token) {
            if (password_verify($refreshToken, $token['token_hash'])) {
                $this->pdo->prepare('DELETE FROM refresh_tokens WHERE id = :id')->execute(['id' => $token['id']]);
                return;
            }
        }
    }

    public function verifyAccessToken(string $token): array
    {
        $claims = (array) JWT::decode($token, new Key((string) Env::get('JWT_SECRET'), 'HS256'));
        if (($claims['iss'] ?? null) !== Env::get('JWT_ISSUER', 'am2050-api') || ($claims['aud'] ?? null) !== Env::get('JWT_AUDIENCE', 'am2050-web')) {
            throw new RuntimeException('Invalid token audience.');
        }
        $statement = $this->pdo->prepare('SELECT id, name, role, phone, email, assigned_scope_type, assigned_scope_id, is_active FROM users WHERE id = :id');
        $statement->execute(['id' => $claims['sub']]);
        $user = $statement->fetch();
        if ($user === false || !(bool) $user['is_active']) {
            throw new RuntimeException('User account is inactive.');
        }
        return $user;
    }

    private function issueTokens(array $user): array
    {
        $now = time();
        $accessExpires = $now + (int) Env::get('ACCESS_TOKEN_TTL_SECONDS', '900');
        $accessToken = JWT::encode([
            'iss' => Env::get('JWT_ISSUER', 'am2050-api'), 'aud' => Env::get('JWT_AUDIENCE', 'am2050-web'), 'iat' => $now, 'exp' => $accessExpires,
            'sub' => $user['id'], 'role' => $user['role'],
        ], (string) Env::get('JWT_SECRET'), 'HS256');
        $rawRefresh = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $cookieToken = $user['id'] . '.' . $rawRefresh;
        $expiresAt = date('Y-m-d H:i:s', $now + (int) Env::get('REFRESH_TOKEN_TTL_SECONDS', '604800'));
        // A single active browser session prevents an unbounded token history from forcing
        // refresh() to run expensive bcrypt verification against every historical token.
        $this->pdo->prepare('DELETE FROM refresh_tokens WHERE user_id = :userId')->execute(['userId' => $user['id']]);
        $insert = $this->pdo->prepare('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (:id, :userId, :hash, :expiresAt)');
        $insert->execute(['id' => Ulids::make(), 'userId' => $user['id'], 'hash' => password_hash($cookieToken, PASSWORD_BCRYPT), 'expiresAt' => $expiresAt]);
        return ['accessToken' => $accessToken, 'accessExpiresAt' => $accessExpires, 'refreshToken' => $cookieToken, 'user' => $this->publicUser($user)];
    }

    public static function publicUser(array $user): array
    {
        return array_intersect_key($user, array_flip(['id', 'name', 'role', 'phone', 'email', 'assigned_scope_type', 'assigned_scope_id']));
    }

    private function parseRefreshCookie(string $refreshToken): array
    {
        $parts = explode('.', $refreshToken, 2);
        if (count($parts) !== 2 || !preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/', $parts[0]) || strlen($parts[1]) < 32) {
            throw new RuntimeException('Refresh token is invalid or expired.');
        }
        return $parts;
    }
}
