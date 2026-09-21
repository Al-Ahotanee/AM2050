<?php
declare(strict_types=1);

use AM2050\Core\Database;
use AM2050\Core\Env;

require dirname(__DIR__) . '/vendor/autoload.php';

$root = dirname(__DIR__);
Env::load($root);
$pdo = (new Database())->pdo();
$pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
$applied = array_column($pdo->query('SELECT version FROM schema_migrations')->fetchAll(), 'version');
$files = glob($root . '/migrations/*.sql') ?: [];
sort($files, SORT_STRING);
foreach ($files as $file) {
    $version = basename($file);
    if (in_array($version, $applied, true)) {
        continue;
    }
    $sql = trim((string) file_get_contents($file));
    if ($sql === '') {
        continue;
    }
    try {
        $pdo->exec($sql);
        $statement = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
        $statement->execute(['version' => $version]);
        fwrite(STDOUT, "Applied {$version}\n");
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        fwrite(STDERR, "Migration failed at {$version}: {$error->getMessage()}\n");
        exit(1);
    }
}
fwrite(STDOUT, "Migrations are current.\n");
