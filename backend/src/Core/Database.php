<?php
declare(strict_types=1);

namespace AM2050\Core;

use PDO;
use Throwable;

final class Database
{
    private PDO $pdo;

    public function __construct()
    {
        $databaseUrl = trim((string) Env::get('DATABASE_URL', ''));
        if ($databaseUrl !== '') {
            $parsed = parse_url($databaseUrl);
            $host = $parsed['host'] ?? Env::get('DB_HOST');
            $port = isset($parsed['port']) ? (string)$parsed['port'] : Env::get('DB_PORT', '3306');
            $user = isset($parsed['user']) ? urldecode($parsed['user']) : Env::get('DB_USER');
            $pass = isset($parsed['pass']) ? urldecode($parsed['pass']) : Env::get('DB_PASS');
            $dbName = isset($parsed['path']) ? ltrim($parsed['path'], '/') : Env::get('DB_NAME');
        } else {
            $host = Env::get('DB_HOST');
            $port = Env::get('DB_PORT', '3306');
            $user = Env::get('DB_USER');
            $pass = Env::get('DB_PASS');
            $dbName = Env::get('DB_NAME');
        }

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbName);
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
        ];
        $sslCaPath = trim((string) Env::get('DB_SSL_CA_PATH', ''));
        $rawCaInput = trim((string) Env::get('DB_SSL_CA_BASE64', ''));
        if ($sslCaPath === '' && $rawCaInput !== '') {
            $pemContent = '';
            if (str_contains($rawCaInput, 'BEGIN CERTIFICATE')) {
                $pemContent = $rawCaInput;
            } else {
                // Strip all whitespace, quotes, and invalid characters
                $cleaned = preg_replace('/[^A-Za-z0-9+\/=_]/', '', $rawCaInput);
                $decoded = base64_decode((string)$cleaned, false);
                $pemContent = ($decoded !== false && $decoded !== '') ? $decoded : $rawCaInput;
            }
            if ($pemContent !== '') {
                $sslCaPath = sys_get_temp_dir() . '/am2050-aiven-ca.pem';
                if (file_put_contents($sslCaPath, $pemContent, LOCK_EX) !== false) {
                    @chmod($sslCaPath, 0600);
                } else {
                    $sslCaPath = '';
                }
            }
        }
        if ($sslCaPath !== '' && is_readable($sslCaPath)) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCaPath;
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[constant('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')] = true;
            }
        }
        $this->pdo = new PDO($dsn, $user, $pass, $options);
    }

    public function pdo(): PDO { return $this->pdo; }

    public function transaction(callable $callback): mixed
    {
        $this->pdo->beginTransaction();
        try {
            $result = $callback($this->pdo);
            $this->pdo->commit();
            return $result;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }
}
