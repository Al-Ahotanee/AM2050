<?php
declare(strict_types=1);

namespace AM2050\Support;

use PDO;

final class AuditLogger
{
    public function __construct(private readonly PDO $pdo) {}

    public function record(?string $actorUserId, string $action, string $entityType, string $entityId, ?array $before = null, ?array $after = null): void
    {
        $statement = $this->pdo->prepare('INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, before_value, after_value) VALUES (:id, :actor, :action, :entityType, :entityId, :beforeValue, :afterValue)');
        $statement->execute([
            'id' => Ulids::make(), 'actor' => $actorUserId, 'action' => $action, 'entityType' => $entityType, 'entityId' => $entityId,
            'beforeValue' => $before === null ? null : json_encode($before, JSON_THROW_ON_ERROR),
            'afterValue' => $after === null ? null : json_encode($after, JSON_THROW_ON_ERROR),
        ]);
    }
}
