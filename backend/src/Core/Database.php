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
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', Env::get('DB_HOST'), Env::get('DB_PORT', '3306'), Env::get('DB_NAME'));
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
        ];
        $sslCaPath = trim((string) Env::get('DB_SSL_CA_PATH', ''));
        $sslCaBase64 = trim((string) Env::get('DB_SSL_CA_BASE64', ''));
        if ($sslCaPath === '' && $sslCaBase64 !== '') {
            $decoded = base64_decode($sslCaBase64, true);
            if ($decoded === false || $decoded === '') {
                throw new \RuntimeException('DB_SSL_CA_BASE64 is not a valid certificate payload.');
            }
            $sslCaPath = sys_get_temp_dir() . '/am2050-aiven-ca.pem';
            if (file_put_contents($sslCaPath, $decoded, LOCK_EX) === false) {
                throw new \RuntimeException('Unable to prepare the database CA certificate.');
            }
            @chmod($sslCaPath, 0600);
        }
        if (Env::bool('DB_SSL_REQUIRED', false) && ($sslCaPath === '' || !is_readable($sslCaPath))) {
            throw new \RuntimeException('DB_SSL_REQUIRED=true requires a readable DB_SSL_CA_PATH or DB_SSL_CA_BASE64 certificate.');
        }
        if ($sslCaPath !== '') {
            if (!is_readable($sslCaPath)) {
                throw new \RuntimeException('The configured DB SSL CA certificate is not readable.');
            }
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCaPath;
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[constant('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')] = true;
            }
        }
        $this->pdo = new PDO($dsn, Env::get('DB_USER'), Env::get('DB_PASS'), $options);
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
