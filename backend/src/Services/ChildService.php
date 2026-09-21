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

final class ChildService
{
    private const RULES = [
        'firstName' => ['type' => 'string', 'max' => 150, 'required' => true], 'lastName' => ['type' => 'string', 'max' => 150, 'required' => true],
        'gender' => ['type' => 'string', 'in' => ['male','female'], 'required' => true], 'dateOfBirth' => ['type' => 'string', 'max' => 10, 'nullable' => true],
        'estimatedAge' => ['type' => 'number', 'nullable' => true], 'photoUrl' => ['type' => 'string', 'max' => 1500000, 'nullable' => true], 'registrationDetails' => ['type' => 'string', 'max' => 30000, 'nullable' => true], 'householdId' => ['type' => 'string', 'max' => 26, 'nullable' => true],
        'guardianPhone' => ['type' => 'string', 'max' => 20, 'nullable' => true], 'wardId' => ['type' => 'string', 'max' => 26, 'nullable' => true], 'communityId' => ['type' => 'string', 'max' => 26, 'nullable' => true], 'tsangayaId' => ['type' => 'string', 'max' => 26, 'nullable' => true],
        'disabilityStatus' => ['type' => 'string', 'in' => ['none','physical','visual','hearing','cognitive','multiple'], 'nullable' => true], 'almajiriStatus' => ['type' => 'string', 'in' => ['not_almajiri','almajiri'], 'nullable' => true],
        'childStatus' => ['type' => 'string', 'in' => ['active','deceased','relocated','untraceable'], 'nullable' => true],
    ];

    public function __construct(private readonly Database $database, private readonly AuditLogger $audit) {}

    public function list(array $auth, array $query): array
    {
        [$page, $limit, $offset] = Validator::page($query); $search = trim((string) ($query['search'] ?? ''));
        $wardExpr = 'COALESCE(h.ward_id, c.ward_id)'; [$scopeSql, $scopeParams] = $this->scopeForChildWard($auth, $wardExpr); $where = ' WHERE 1 = 1' . $scopeSql; $params = $scopeParams;
        if ($search !== '') { $where .= ' AND (c.child_unique_id LIKE :search OR c.first_name LIKE :search OR c.last_name LIKE :search OR c.guardian_phone LIKE :search)'; $params['search'] = "%{$search}%"; }
        if (isset($query['ward_id'])) { $where .= " AND {$wardExpr} = :ward_id"; $params['ward_id'] = (string) $query['ward_id']; }
        $from = ' FROM children c LEFT JOIN households h ON h.id = c.household_id LEFT JOIN almajiri_links al ON al.child_id=c.id AND al.current_status="active" LEFT JOIN tsangaya_schools ts ON ts.id=al.tsangaya_id LEFT JOIN wards w ON w.id = COALESCE(h.ward_id,ts.ward_id,c.ward_id) LEFT JOIN communities cm ON cm.id=COALESCE(h.community_id,ts.community_id) LEFT JOIN enrollments e ON e.child_id=c.id AND e.enrollment_status="active" LEFT JOIN schools s ON s.id=e.school_id LEFT JOIN school_classes sc ON sc.id=e.class_id'; $pdo = $this->database->pdo();
        $count = $pdo->prepare('SELECT COUNT(*)' . $from . $where); $count->execute($params); $total = (int) $count->fetchColumn();
        $statement = $pdo->prepare('SELECT c.*, h.household_code, h.father_name, h.mother_name, h.phone_number AS household_phone, ts.id AS tsangaya_id, ts.tsangaya_name, w.name AS ward_name, cm.name AS community_name, s.school_name AS active_school_name, sc.class_name AS active_class_name, sc.class_level AS active_class_level, COALESCE(h.ward_id,ts.ward_id,c.ward_id) AS effective_ward_id' . $from . $where . ' ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset');
        foreach ($params as $key => $value) { $statement->bindValue(':' . $key, $value); } $statement->bindValue(':limit', $limit, PDO::PARAM_INT); $statement->bindValue(':offset', $offset, PDO::PARAM_INT); $statement->execute();
        return ['data' => $statement->fetchAll(), 'page' => $page, 'limit' => $limit, 'total' => $total];
    }

    public function get(array $auth, string $id): array
    {
        $record = $this->fetchById($this->database->pdo(), $id); $wardId = $record['ward_id'];
        if ($wardId === null && $record['household_id'] !== null) { $stmt = $this->database->pdo()->prepare('SELECT ward_id FROM households WHERE id = :id'); $stmt->execute(['id' => $record['household_id']]); $wardId = $stmt->fetchColumn(); }
        $this->assertWardInScope($auth, (string) $wardId); return $record;
    }

    public function create(array $auth, array $input): array
    {
        $data = Validator::allow($input, self::RULES); if(!empty($data['photoUrl'])&&(!str_starts_with((string)$data['photoUrl'],'data:image/')||strlen((string)$data['photoUrl'])>1500000))throw new RuntimeException('Use a valid child photograph smaller than 1 MB.'); $isAlmajiri=($data['almajiriStatus']??'not_almajiri')==='almajiri';if($isAlmajiri){if(empty($data['wardId'])||empty($data['communityId'])||empty($data['tsangayaId']))throw new RuntimeException('Choose the ward, community, and Tsangaya school for an Almajiri child.');$this->assertTsangayaPlacement((string)$data['tsangayaId'],(string)$data['wardId'],(string)$data['communityId']);$data['householdId']=null;$wardId=(string)$data['wardId'];}else{$wardId=$this->householdWard($data['householdId']??null);if($wardId===null)throw new RuntimeException('Choose a household for a child who is not an Almajiri student.');}
        $this->assertWardInScope($auth, $wardId);
        return $this->database->transaction(function (PDO $pdo) use ($auth, $data, $wardId, $isAlmajiri): array {
            $id = Ulids::make(); $code = IdGenerator::nextCode($pdo, 'child', 'AM2050-CHILD-', 6);
            $statement = $pdo->prepare('INSERT INTO children (id, child_unique_id, attendance_qr_token, first_name, last_name, gender, date_of_birth, estimated_age, photo_url, registration_details, household_id, guardian_phone, ward_id, disability_status, almajiri_status, child_status, registered_by) VALUES (:id, :code, :qrToken, :firstName, :lastName, :gender, :dateOfBirth, :estimatedAge, :photoUrl, :registrationDetails, :householdId, :guardianPhone, :wardId, :disabilityStatus, :almajiriStatus, :childStatus, :registeredBy)');
            $statement->execute(['id' => $id, 'code' => $code, 'qrToken'=>$id, 'firstName' => $data['firstName'], 'lastName' => $data['lastName'], 'gender' => $data['gender'], 'dateOfBirth' => $data['dateOfBirth'] ?? null, 'estimatedAge' => $data['estimatedAge'] ?? null, 'photoUrl' => $data['photoUrl'] ?? null, 'registrationDetails'=>$data['registrationDetails']??null, 'householdId' => $data['householdId'] ?? null, 'guardianPhone' => $data['guardianPhone'] ?? null, 'wardId' => $data['wardId'] ?? null, 'disabilityStatus' => $data['disabilityStatus'] ?? 'none', 'almajiriStatus' => $data['almajiriStatus'] ?? 'not_almajiri', 'childStatus' => $data['childStatus'] ?? 'active', 'registeredBy' => $auth['id']]);
            if($isAlmajiri){$link=$pdo->prepare('INSERT INTO almajiri_links (id,child_id,tsangaya_id,current_status) VALUES (:id,:child,:tsangaya,"active")');$link->execute(['id'=>Ulids::make(),'child'=>$id,'tsangaya'=>$data['tsangayaId']]);}$record = $this->fetchById($pdo, $id); $this->audit->record($auth['id'], 'CREATE', 'child', $id, null, $record); return $record;
        });
    }

    public function update(array $auth, string $id, array $input): array
    {
        $before = $this->get($auth, $id); $data = Validator::allow($input, self::RULES, true); if(!empty($data['photoUrl'])&&(!str_starts_with((string)$data['photoUrl'],'data:image/')||strlen((string)$data['photoUrl'])>1500000))throw new RuntimeException('Use a valid child photograph smaller than 1 MB.'); if ($data === []) throw new RuntimeException('No supported fields were supplied.');
        return $this->database->transaction(function (PDO $pdo) use ($auth, $id, $data, $before): array {
            $map = ['firstName'=>'first_name','lastName'=>'last_name','gender'=>'gender','dateOfBirth'=>'date_of_birth','estimatedAge'=>'estimated_age','photoUrl'=>'photo_url','registrationDetails'=>'registration_details','householdId'=>'household_id','guardianPhone'=>'guardian_phone','wardId'=>'ward_id','disabilityStatus'=>'disability_status','almajiriStatus'=>'almajiri_status','childStatus'=>'child_status'];
            $sets=[]; $params=['id'=>$id]; foreach ($data as $key=>$value) { $sets[]=$map[$key].' = :'.$key; $params[$key]=$value; } $pdo->prepare('UPDATE children SET '.implode(', ', $sets).' WHERE id = :id')->execute($params);
            $record=$this->fetchById($pdo,$id); $this->audit->record($auth['id'],'UPDATE','child',$id,$before,$record); return $record;
        });
    }

    public function confirmGuardianPhone(array $auth,string $id,array $input):array{$phone=preg_replace('/\s+/', '',(string)($input['guardianPhone']??''));if(!preg_match('/^0\d{10}$/',$phone))throw new RuntimeException('Provide a valid 11-digit guardian phone number.');$before=$this->get($auth,$id);$guardian=$this->database->pdo()->prepare('SELECT id FROM users WHERE phone=:phone AND role="guardian" AND is_active=1 LIMIT 1');$guardian->execute(['phone'=>$phone]);if(!$guardian->fetchColumn())throw new RuntimeException('No active Guardian account is verified for this phone number. Create or activate the guardian account first.');return $this->database->transaction(function(PDO $pdo)use($auth,$id,$phone,$before):array{$pdo->prepare('UPDATE children SET guardian_phone=:phone WHERE id=:id')->execute(['phone'=>$phone,'id'=>$id]);$after=$this->fetchById($pdo,$id);$this->audit->record($auth['id'],'CONFIRM_GUARDIAN','child',$id,$before,$after);return$after;});}

    private function householdWard(?string $householdId): ?string { if ($householdId === null) return null; $statement=$this->database->pdo()->prepare('SELECT ward_id FROM households WHERE id=:id'); $statement->execute(['id'=>$householdId]); return $statement->fetchColumn() ?: null; }
    private function assertTsangayaPlacement(string $tsangayaId,string $wardId,string $communityId):void{$statement=$this->database->pdo()->prepare('SELECT id FROM tsangaya_schools WHERE id=:id AND ward_id=:ward AND community_id=:community');$statement->execute(['id'=>$tsangayaId,'ward'=>$wardId,'community'=>$communityId]);if(!$statement->fetchColumn())throw new RuntimeException('Choose a registered Tsangaya school within the selected ward and community.');}
    private function scopeForChildWard(array $auth, string $wardExpr): array {
        $scope = $auth['assigned_scope_id'] ?? null;
        return match ($auth['assigned_scope_type'] ?? null) {
            'school' => [" AND {$wardExpr} = (SELECT ward_id FROM schools WHERE id = :scope_id)", ['scope_id' => $scope]],
            'class' => [" AND {$wardExpr} = (SELECT s.ward_id FROM school_classes sc INNER JOIN schools s ON s.id = sc.school_id WHERE sc.id = :scope_id)", ['scope_id' => $scope]],
            default => ScopeFilter::byWard($auth, $wardExpr),
        };
    }
    private function assertWardInScope(array $auth, string $wardId): void { [$scopeSql,$params]=ScopeFilter::byWard($auth,'id'); if($scopeSql==='') return; $params['ward']=$wardId; $stmt=$this->database->pdo()->prepare('SELECT id FROM wards WHERE id=:ward'.$scopeSql); $stmt->execute($params); if($stmt->fetchColumn()===false) throw new RuntimeException('The selected child record is outside your assigned scope.'); }
    private function fetchById(PDO $pdo,string $id): array { $stmt=$pdo->prepare('SELECT * FROM children WHERE id=:id'); $stmt->execute(['id'=>$id]); return $stmt->fetch() ?: throw new RuntimeException('Child not found.'); }
}
