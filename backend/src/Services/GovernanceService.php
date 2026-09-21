<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Database;
use AM2050\Support\AuditLogger;
use AM2050\Support\Ulids;
use PDO;
use RuntimeException;

final class GovernanceService
{
    private const RULES = ['incentiveAttendanceThreshold','incentiveAmount','complianceSlaDays','programmeDisplayName'];
    public function __construct(private readonly Database $db, private readonly AuditLogger $audit) {}
    public function rules(): array { return $this->db->pdo()->query('SELECT rule_key,rule_value,updated_by,updated_at FROM program_rules ORDER BY rule_key')->fetchAll(); }
    public function updateRule(array $auth,string $key,mixed $value): array { if(!in_array($key,self::RULES,true))throw new RuntimeException('That programme rule cannot be changed.');if($key==='incentiveAttendanceThreshold'&&(!is_numeric($value)||(float)$value<0||(float)$value>100))throw new RuntimeException('The incentive attendance threshold must be between 0 and 100.');if($key==='complianceSlaDays'&&(!is_numeric($value)||(int)$value<1||(int)$value>365))throw new RuntimeException('The compliance SLA must be between 1 and 365 days.');if($key==='programmeDisplayName'&&(!is_string($value)||trim($value)===''))throw new RuntimeException('Programme display name is required.');$pdo=$this->db->pdo();$before=$pdo->prepare('SELECT rule_key,rule_value FROM program_rules WHERE rule_key=:key');$before->execute(['key'=>$key]);$old=$before->fetch()?:null;$pdo->prepare('INSERT INTO program_rules(id,rule_key,rule_value,updated_by) VALUES(:id,:key,:value,:user) ON DUPLICATE KEY UPDATE rule_value=VALUES(rule_value),updated_by=VALUES(updated_by)')->execute(['id'=>Ulids::make(),'key'=>$key,'value'=>json_encode($value,JSON_THROW_ON_ERROR),'user'=>$auth['id']]);$stmt=$pdo->prepare('SELECT rule_key,rule_value,updated_by,updated_at FROM program_rules WHERE rule_key=:key');$stmt->execute(['key'=>$key]);$record=$stmt->fetch();$this->audit->record($auth['id'],'UPDATE','program_rule',substr(hash('sha256',$key),0,26),$old,$record);return$record; }
    public function auditLog(array $query): array { $page=max(1,(int)($query['page']??1));$limit=min(250,max(1,(int)($query['limit']??100)));$offset=($page-1)*$limit;$params=[];$clauses=[];if(!empty($query['entityType'])){$clauses[]='a.entity_type=:entityType';$params['entityType']=$query['entityType'];}if(!empty($query['fromDate'])){$clauses[]='a.created_at>=:fromDate';$params['fromDate']=$query['fromDate'].' 00:00:00';}if(!empty($query['toDate'])){$clauses[]='a.created_at<=:toDate';$params['toDate']=$query['toDate'].' 23:59:59';}$where=$clauses===[]?'':' WHERE '.implode(' AND ',$clauses);$pdo=$this->db->pdo();$count=$pdo->prepare('SELECT COUNT(*) FROM audit_logs a'.$where);$count->execute($params);$total=(int)$count->fetchColumn();$stmt=$pdo->prepare('SELECT a.id,a.action,a.entity_type,a.entity_id,a.before_value AS before_data,a.after_value AS after_data,a.created_at,u.name AS actor_name,u.role AS actor_role FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id'.$where.' ORDER BY a.created_at DESC LIMIT :limit OFFSET :offset');foreach($params as$key=>$value)$stmt->bindValue(':'.$key,$value);$stmt->bindValue(':limit',$limit,PDO::PARAM_INT);$stmt->bindValue(':offset',$offset,PDO::PARAM_INT);$stmt->execute();return['data'=>$stmt->fetchAll(),'page'=>$page,'limit'=>$limit,'total'=>$total]; }
}
