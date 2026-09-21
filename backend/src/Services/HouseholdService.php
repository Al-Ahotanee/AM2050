<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Database;
use AM2050\Support\AuditLogger;
use AM2050\Support\IdGenerator;
use AM2050\Support\ScopeFilter;
use AM2050\Support\Ulids;
use AM2050\Validation\Validator;
use PDO;
use RuntimeException;

final class HouseholdService
{
    private const RULES = [
        'fatherName' => ['type' => 'string', 'max' => 200, 'nullable' => true], 'motherName' => ['type' => 'string', 'max' => 200, 'nullable' => true],
        'phoneNumber' => ['type' => 'string', 'max' => 20, 'nullable' => true], 'communityId' => ['type' => 'string', 'max' => 26, 'nullable' => true],
        'wardId' => ['type' => 'string', 'max' => 26, 'required' => true], 'gpsLat' => ['type' => 'number', 'nullable' => true], 'gpsLng' => ['type' => 'number', 'nullable' => true],
        'povertyStatus' => ['type' => 'string', 'in' => ['extreme_poor','poor','moderate','not_poor'], 'nullable' => true], 'householdType' => ['type' => 'string', 'max' => 50, 'nullable' => true], 'photoUrl' => ['type' => 'string', 'max' => 1500000, 'nullable' => true], 'registrationDetails'=>['type'=>'string','max'=>30000,'nullable'=>true],
    ];

    public function __construct(private readonly Database $database, private readonly AuditLogger $audit) {}

    public function list(array $auth, array $query): array
    {
        [$page, $limit, $offset] = Validator::page($query);
        $search = trim((string) ($query['search'] ?? ''));
        [$scopeSql, $scopeParams] = ScopeFilter::byWard($auth, 'h.ward_id');
        $where = ' WHERE 1 = 1' . $scopeSql;
        $params = $scopeParams;
        if ($search !== '') { $where .= ' AND (h.household_code LIKE :search OR h.father_name LIKE :search OR h.mother_name LIKE :search OR h.phone_number LIKE :search)'; $params['search'] = "%{$search}%"; }
        if (isset($query['ward_id'])) { $where .= ' AND h.ward_id = :ward_id'; $params['ward_id'] = (string) $query['ward_id']; }
        $pdo = $this->database->pdo();
        $count = $pdo->prepare('SELECT COUNT(*) FROM households h' . $where); $count->execute($params); $total = (int) $count->fetchColumn();
        $statement = $pdo->prepare('SELECT h.*, c.name AS community_name, w.name AS ward_name FROM households h LEFT JOIN communities c ON c.id = h.community_id INNER JOIN wards w ON w.id = h.ward_id' . $where . ' ORDER BY h.created_at DESC LIMIT :limit OFFSET :offset');
        foreach ($params as $key => $value) { $statement->bindValue(':' . $key, $value); }
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT); $statement->bindValue(':offset', $offset, PDO::PARAM_INT); $statement->execute();
        return ['data' => $statement->fetchAll(), 'page' => $page, 'limit' => $limit, 'total' => $total];
    }

    public function get(array $auth, string $id): array
    {
        [$scopeSql, $params] = ScopeFilter::byWard($auth, 'h.ward_id'); $params['id'] = $id;
        $statement = $this->database->pdo()->prepare('SELECT h.*, c.name AS community_name, w.name AS ward_name FROM households h LEFT JOIN communities c ON c.id = h.community_id INNER JOIN wards w ON w.id = h.ward_id WHERE h.id = :id' . $scopeSql);
        $statement->execute($params); $record = $statement->fetch();
        if ($record === false) throw new RuntimeException('Household not found.');
        return $record;
    }

    public function create(array $auth, array $input): array
    {
        $data = Validator::allow($input, self::RULES); if(!empty($data['photoUrl'])&&(!str_starts_with((string)$data['photoUrl'],'data:image/')||strlen((string)$data['photoUrl'])>1500000))throw new RuntimeException('Use a valid household photograph smaller than 1 MB.');
        $this->assertWardInScope($auth, $data['wardId']);
        return $this->database->transaction(function (PDO $pdo) use ($auth, $data): array {
            $id = Ulids::make(); $code = IdGenerator::nextCode($pdo, 'household', 'AM2050-HH-', 6);
            $statement = $pdo->prepare('INSERT INTO households (id, household_code, father_name, mother_name, phone_number, photo_url, registration_details, community_id, ward_id, gps_lat, gps_lng, poverty_status, household_type, registered_by) VALUES (:id, :code, :fatherName, :motherName, :phoneNumber, :photoUrl, :registrationDetails, :communityId, :wardId, :gpsLat, :gpsLng, :povertyStatus, :householdType, :registeredBy)');
            $statement->execute(['id' => $id, 'code' => $code, 'fatherName' => $data['fatherName'] ?? null, 'motherName' => $data['motherName'] ?? null, 'phoneNumber' => $data['phoneNumber'] ?? null, 'photoUrl' => $data['photoUrl'] ?? null, 'registrationDetails'=>$data['registrationDetails']??null, 'communityId' => $data['communityId'] ?? null, 'wardId' => $data['wardId'], 'gpsLat' => $data['gpsLat'] ?? null, 'gpsLng' => $data['gpsLng'] ?? null, 'povertyStatus' => $data['povertyStatus'] ?? null, 'householdType' => $data['householdType'] ?? null, 'registeredBy' => $auth['id']]);
            $record = $this->fetchById($pdo, $id); $this->audit->record($auth['id'], 'CREATE', 'household', $id, null, $record); return $record;
        });
    }

    public function update(array $auth, string $id, array $input): array
    {
        $before = $this->get($auth, $id); $data = Validator::allow($input, self::RULES, true); if(!empty($data['photoUrl'])&&(!str_starts_with((string)$data['photoUrl'],'data:image/')||strlen((string)$data['photoUrl'])>1500000))throw new RuntimeException('Use a valid household photograph smaller than 1 MB.');
        if (isset($data['wardId'])) $this->assertWardInScope($auth, $data['wardId']);
        if ($data === []) throw new RuntimeException('No supported fields were supplied.');
        return $this->database->transaction(function (PDO $pdo) use ($auth, $id, $data, $before): array {
            $map = ['fatherName' => 'father_name','motherName' => 'mother_name','phoneNumber' => 'phone_number','photoUrl'=>'photo_url','registrationDetails'=>'registration_details','communityId' => 'community_id','wardId' => 'ward_id','gpsLat' => 'gps_lat','gpsLng' => 'gps_lng','povertyStatus' => 'poverty_status','householdType' => 'household_type'];
            $sets = []; $params = ['id' => $id]; foreach ($data as $key => $value) { $sets[] = $map[$key] . ' = :' . $key; $params[$key] = $value; }
            $pdo->prepare('UPDATE households SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
            $record = $this->fetchById($pdo, $id); $this->audit->record($auth['id'], 'UPDATE', 'household', $id, $before, $record); return $record;
        });
    }

    private function assertWardInScope(array $auth, string $wardId): void
    {
        [$scopeSql, $params] = ScopeFilter::byWard($auth, 'id');
        if ($scopeSql === '') return;
        $params['ward'] = $wardId; $statement = $this->database->pdo()->prepare('SELECT id FROM wards WHERE id = :ward' . $scopeSql); $statement->execute($params);
        if ($statement->fetchColumn() === false) throw new RuntimeException('The selected ward is outside your assigned scope.');
    }

    private function fetchById(PDO $pdo, string $id): array
    {
        $statement = $pdo->prepare('SELECT * FROM households WHERE id = :id'); $statement->execute(['id' => $id]); return $statement->fetch() ?: throw new RuntimeException('Household could not be loaded.');
    }
}
