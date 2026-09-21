<?php
declare(strict_types=1);

namespace AM2050\Support;

use PDO;
use Throwable;

final class IdGenerator
{
    public static function nextCode(PDO $pdo, string $sequenceKey, string $prefix, int $padding): string
    {
        $ownsTransaction = !$pdo->inTransaction();
        if ($ownsTransaction) {
            $pdo->beginTransaction();
        }
        try {
            $select = $pdo->prepare('SELECT value FROM id_sequences WHERE seq_key = :key FOR UPDATE');
            $select->execute(['key' => $sequenceKey]);
            $row = $select->fetch();
            $next = $row === false ? 1 : ((int) $row['value'] + 1);
            if ($row === false) {
                $insert = $pdo->prepare('INSERT INTO id_sequences (seq_key, value) VALUES (:key, :value)');
                $insert->execute(['key' => $sequenceKey, 'value' => $next]);
            } else {
                $update = $pdo->prepare('UPDATE id_sequences SET value = :value WHERE seq_key = :key');
                $update->execute(['key' => $sequenceKey, 'value' => $next]);
            }
            if ($ownsTransaction) {
                $pdo->commit();
            }
            return $prefix . str_pad((string) $next, $padding, '0', STR_PAD_LEFT);
        } catch (Throwable $error) {
            if ($ownsTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }
}
