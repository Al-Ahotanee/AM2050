<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Database;
use AM2050\Support\AuditLogger;
use AM2050\Support\Ulids;
use PDO;
use RuntimeException;

final class GeographyService
{
    private const CONFIG = [
        'states' => ['table' => 'states', 'entity' => 'state', 'parent' => null, 'fields' => ['name', 'code']],
        'lgas' => ['table' => 'lgas', 'entity' => 'lga', 'parent' => 'state_id', 'fields' => ['name', 'state_id']],
        'wards' => ['table' => 'wards', 'entity' => 'ward', 'parent' => 'lga_id', 'fields' => ['name', 'lga_id']],
        'communities' => ['table' => 'communities', 'entity' => 'community', 'parent' => 'ward_id', 'fields' => ['name', 'ward_id']],
    ];
    private const CHILDREN = ['states' => ['lgas', 'state_id'], 'lgas' => ['wards', 'lga_id'], 'wards' => ['communities', 'ward_id']];

    public function __construct(private readonly Database $database, private readonly AuditLogger $audit) {}

    public function list(string $resource, array $query): array
    {
        $config = $this->config($resource); $sql = 'SELECT * FROM ' . $config['table']; $where = []; $params = [];
        if (($query['includeInactive'] ?? '') !== '1') $where[] = 'is_active=1';
        if ($config['parent'] !== null && isset($query[$config['parent']])) { $where[] = $config['parent'] . '=:parent'; $params['parent'] = $query[$config['parent']]; }
        if ($where !== []) $sql .= ' WHERE ' . implode(' AND ', $where); $sql .= ' ORDER BY name';
        $statement = $this->database->pdo()->prepare($sql); $statement->execute($params); return $statement->fetchAll();
    }

    public function create(array $auth, string $resource, array $input): array
    {
        $config = $this->config($resource); $data = $this->validated($config, $input, false); $this->assertParent($config['parent'], $data);
        $id = Ulids::make(); $columns = array_merge(['id'], array_keys($data)); $placeholders = array_map(static fn(string $field): string => ':' . $field, $columns);
        $this->database->pdo()->prepare('INSERT INTO ' . $config['table'] . ' (' . implode(',', $columns) . ') VALUES (' . implode(',', $placeholders) . ')')->execute(['id' => $id, ...$data]);
        $record = $this->record($config, $id); $this->audit->record($auth['id'], 'CREATE', $config['entity'], $id, null, $record); return $record;
    }

    public function update(array $auth, string $resource, string $id, array $input): array
    {
        $config = $this->config($resource); $before = $this->record($config, $id); $data = $this->validated($config, $input, true); if ($data === []) throw new RuntimeException('No supported geography fields were supplied.');
        $this->assertParent($config['parent'], $data); $sets = []; foreach ($data as $field => $_) $sets[] = $field . '=:' . $field;
        $this->database->pdo()->prepare('UPDATE ' . $config['table'] . ' SET ' . implode(',', $sets) . ' WHERE id=:id')->execute([...$data, 'id' => $id]);
        $after = $this->record($config, $id); $this->audit->record($auth['id'], 'UPDATE', $config['entity'], $id, $before, $after); return $after;
    }

    public function deactivate(array $auth, string $resource, string $id): array
    {
        $config = $this->config($resource); $before = $this->record($config, $id); if (!(bool) $before['is_active']) return $before;
        if (isset(self::CHILDREN[$resource])) { [$childTable, $foreign] = self::CHILDREN[$resource]; $check = $this->database->pdo()->prepare('SELECT COUNT(*) FROM ' . $childTable . ' WHERE ' . $foreign . '=:id AND is_active=1'); $check->execute(['id' => $id]); if ((int) $check->fetchColumn() > 0) throw new RuntimeException('Reassign or deactivate active child geography records before deactivating this record.'); }
        $this->database->pdo()->prepare('UPDATE ' . $config['table'] . ' SET is_active=0 WHERE id=:id')->execute(['id' => $id]); $after = $this->record($config, $id); $this->audit->record($auth['id'], 'DEACTIVATE', $config['entity'], $id, $before, $after); return $after;
    }

    private function validated(array $config, array $input, bool $partial): array { $data = []; foreach ($config['fields'] as $field) { if (!array_key_exists($field, $input)) { if (!$partial) throw new RuntimeException("{$field} is required."); continue; } if (!is_string($input[$field]) || trim($input[$field]) === '') throw new RuntimeException("{$field} is required."); $data[$field] = trim($input[$field]); } return $data; }
    private function assertParent(?string $parent, array $data): void { if ($parent === null || !isset($data[$parent])) return; $table = match ($parent) { 'state_id' => 'states', 'lga_id' => 'lgas', 'ward_id' => 'wards' }; $statement = $this->database->pdo()->prepare('SELECT id FROM ' . $table . ' WHERE id=:id AND is_active=1'); $statement->execute(['id' => $data[$parent]]); if (!$statement->fetchColumn()) throw new RuntimeException('The selected active parent geography record does not exist.'); }
    private function record(array $config, string $id): array { $statement = $this->database->pdo()->prepare('SELECT * FROM ' . $config['table'] . ' WHERE id=:id'); $statement->execute(['id' => $id]); return $statement->fetch() ?: throw new RuntimeException('Geography record not found.'); }
    private function config(string $resource): array { return self::CONFIG[$resource] ?? throw new RuntimeException('Unknown geography resource.'); }
}
