<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Database;
use AM2050\Support\AuditLogger;
use AM2050\Support\Ulids;
use PDO;

final class SyncService
{
    public function __construct(private readonly Database $database, private readonly HouseholdService $households, private readonly ChildService $children, private readonly AuditLogger $audit) {}

    public function batch(array $auth, array $records): array
    {
        if (count($records) > 500) { throw new \RuntimeException('Sync batches cannot exceed 500 records.'); }
        $outcomes = [];
        foreach ($records as $record) {
            $outcomes[] = $this->process($auth, $record);
        }
        return $outcomes;
    }

    private function process(array $auth, array $record): array
    {
        $tempId = (string) ($record['tempId'] ?? ''); $entity = (string) ($record['entity'] ?? ''); $action = (string) ($record['operation'] ?? ''); $payload = $record['payload'] ?? null;
        if (!preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/', $tempId) || !in_array($entity, ['household', 'child', 'attendance', 'enrollment'], true) || !in_array($action, ['create', 'update'], true) || !is_array($payload)) {
            return ['tempId' => $tempId, 'status' => 'error', 'message' => 'Sync record has an invalid shape.'];
        }
        $pdo = $this->database->pdo();
        $prior = $pdo->prepare('SELECT server_id, generated_code FROM synced_temp_ids WHERE temp_id = :tempId'); $prior->execute(['tempId' => $tempId]); $existing = $prior->fetch();
        if ($existing !== false) return ['tempId' => $tempId, 'status' => 'already_synced', 'serverId' => $existing['server_id'], 'code' => $existing['generated_code']];
        try {
            $result = match ($entity) {
                'household' => $action === 'create' ? $this->households->create($auth, $this->householdPayload($payload)) : throw new \RuntimeException('Offline household updates require a server record mapping.'),
                'child' => $action === 'create' ? $this->children->create($auth, $this->childPayload($payload)) : throw new \RuntimeException('Offline child updates require a server record mapping.'),
                default => throw new \RuntimeException("Offline {$entity} sync is not yet configured."),
            };
            $code = $entity === 'household' ? $result['household_code'] : $result['child_unique_id'];
            $pdo->prepare('INSERT INTO synced_temp_ids (temp_id, entity_type, server_id, generated_code) VALUES (:tempId, :entity, :serverId, :code)')->execute(['tempId' => $tempId, 'entity' => $entity, 'serverId' => $result['id'], 'code' => $code]);
            $pdo->prepare('INSERT INTO sync_queue (id, entity_type, entity_id, temp_id, action, payload, status, processed_at) VALUES (:id, :entity, :entityId, :tempId, :action, :payload, :status, NOW())')->execute(['id' => Ulids::make(), 'entity' => $entity, 'entityId' => $result['id'], 'tempId' => $tempId, 'action' => $action, 'payload' => json_encode($payload, JSON_THROW_ON_ERROR), 'status' => 'processed']);
            return ['tempId' => $tempId, 'status' => 'synced', 'serverId' => $result['id'], 'code' => $code];
        } catch (\Throwable $error) {
            $this->createConflictFlag($auth, $entity, $tempId, $payload, $error->getMessage());
            return ['tempId' => $tempId, 'status' => 'conflict', 'message' => 'The field record needs supervisor review.'];
        }
    }

    private function createConflictFlag(array $auth, string $entity, string $tempId, array $payload, string $message): void
    {
        $wardId = $payload['wardId'] ?? $payload['ward_id'] ?? null;
        $this->database->pdo()->prepare('INSERT INTO compliance_flags (id, flag_type, entity_type, entity_id, ward_id, sla_due_date) VALUES (:id, :flag, :entity, :entityId, :ward, DATE_ADD(CURDATE(), INTERVAL 7 DAY))')->execute(['id' => Ulids::make(), 'flag' => 'sync_conflict', 'entity' => $entity, 'entityId' => $tempId, 'ward' => $wardId]);
        $this->audit->record($auth['id'], 'SYNC_CONFLICT', $entity, $tempId, null, ['reason' => $message]);
    }

    private function householdPayload(array $payload): array
    {
        return ['fatherName' => $payload['fatherName'] ?? $payload['headName'] ?? null, 'motherName' => $payload['motherName'] ?? null, 'phoneNumber' => $payload['phoneNumber'] ?? $payload['guardianPhone'] ?? null, 'communityId' => $payload['communityId'] ?? null, 'wardId' => $this->resolveWard($payload['wardId'] ?? $payload['ward'] ?? null), 'gpsLat' => $payload['gpsLat'] ?? null, 'gpsLng' => $payload['gpsLng'] ?? null, 'povertyStatus' => $payload['povertyStatus'] ?? null, 'householdType' => $payload['householdType'] ?? null];
    }

    private function childPayload(array $payload): array
    {
        $disability = strtolower((string) ($payload['disabilityStatus'] ?? 'none')); $disability = match ($disability) { 'none reported', 'not assessed', 'none' => 'none', 'mobility support needed', 'physical' => 'physical', 'vision support needed', 'visual' => 'visual', 'hearing support needed', 'hearing' => 'hearing', 'learning support needed', 'cognitive' => 'cognitive', 'multiple' => 'multiple', default => 'none' };
        return ['firstName' => $payload['firstName'] ?? null, 'lastName' => $payload['lastName'] ?? $payload['surname'] ?? null, 'gender' => strtolower((string) ($payload['gender'] ?? '')), 'dateOfBirth' => $payload['dateOfBirth'] ?? null, 'estimatedAge' => $payload['estimatedAge'] ?? null, 'photoUrl' => $payload['photoUrl'] ?? null, 'householdId' => $this->resolveHousehold($payload['householdId'] ?? null), 'guardianPhone' => $payload['guardianPhone'] ?? null, 'wardId' => $this->resolveWard($payload['wardId'] ?? $payload['ward'] ?? null), 'disabilityStatus' => $disability, 'almajiriStatus' => ($payload['isAlmajiri'] ?? false) ? 'almajiri' : ($payload['almajiriStatus'] ?? 'not_almajiri'), 'childStatus' => $payload['childStatus'] ?? 'active'];
    }

    private function resolveWard(?string $value): ?string { if ($value === null || $value === '') return null; if (preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/', $value)) return $value; $stmt = $this->database->pdo()->prepare('SELECT id FROM wards WHERE name = :name LIMIT 1'); $stmt->execute(['name' => $value]); return $stmt->fetchColumn() ?: null; }
    private function resolveHousehold(?string $value): ?string { if ($value === null || $value === '') return null; if (preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/', $value)) { $stmt = $this->database->pdo()->prepare('SELECT server_id FROM synced_temp_ids WHERE temp_id = :id LIMIT 1'); $stmt->execute(['id' => $value]); return $stmt->fetchColumn() ?: $value; } return null; }
}
