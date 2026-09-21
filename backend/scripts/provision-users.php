<?php
declare(strict_types=1);

use AM2050\Core\Env;
use AM2050\Support\Ulids;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::load(dirname(__DIR__));
$source = (string) Env::get('LIVE_USERS_JSON');
if ($source === '' || !is_readable($source)) throw new RuntimeException('Set LIVE_USERS_JSON to a readable, untracked JSON file.');
$rows = json_decode((string) file_get_contents($source), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($rows) || $rows === []) throw new RuntimeException('LIVE_USERS_JSON must contain a non-empty JSON array.');
$dsn=sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',Env::get('DB_HOST'),Env::get('DB_PORT','3306'),Env::get('DB_NAME'));$pdo=new PDO($dsn,Env::get('DB_USER'),Env::get('DB_PASS'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$roles=['super_admin','program_admin','lga_supervisor','ward_supervisor','headmaster','mobilizer','almajiri_liaison','teacher','guardian'];$scopeTables=['state'=>'states','lga'=>'lgas','ward'=>'wards','school'=>'schools','class'=>'school_classes'];$created=0;
foreach($rows as $row){$name=trim((string)($row['name']??''));$phone=preg_replace('/\s+/','',(string)($row['phone']??''));$email=strtolower(trim((string)($row['email']??'')));$role=(string)($row['role']??'');$password=(string)($row['password']??'');$scopeType=$row['assignedScopeType']??null;$scopeId=$row['assignedScopeId']??null;if($name===''||!preg_match('/^0\d{10}$/',$phone)||!filter_var($email,FILTER_VALIDATE_EMAIL)||!in_array($role,$roles,true)||strlen($password)<14)throw new RuntimeException('Each user requires name, valid phone/email, allowed role, and a 14+ character password.');if($role==='super_admin'){if($scopeType!==null||$scopeId!==null)throw new RuntimeException('A super_admin cannot have a scope.');}else{if(!isset($scopeTables[$scopeType])||!preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/',(string)$scopeId))throw new RuntimeException('Each scoped user requires a valid scope type and id.');$exists=$pdo->prepare('SELECT id FROM '.$scopeTables[$scopeType].' WHERE id=:id');$exists->execute(['id'=>$scopeId]);if(!$exists->fetch())throw new RuntimeException('A supplied user scope does not exist.');}$duplicate=$pdo->prepare('SELECT id FROM users WHERE phone=:phone OR email=:email');$duplicate->execute(['phone'=>$phone,'email'=>$email]);if($duplicate->fetch())throw new RuntimeException('A supplied user phone or email already exists.');$pdo->prepare('INSERT INTO users(id,name,role,phone,email,password_hash,assigned_scope_type,assigned_scope_id,is_active) VALUES(:id,:name,:role,:phone,:email,:password,:type,:scope,1)')->execute(['id'=>Ulids::make(),'name'=>$name,'role'=>$role,'phone'=>$phone,'email'=>$email,'password'=>password_hash($password,PASSWORD_BCRYPT),'type'=>$scopeType,'scope'=>$scopeId]);$created++;}
fwrite(STDOUT,"Provisioned {$created} authorized user account(s). Securely delete the untracked input file now.\n");
