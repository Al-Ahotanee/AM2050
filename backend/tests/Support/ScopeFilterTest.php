<?php
declare(strict_types=1);
namespace AM2050\Tests\Support;
use AM2050\Support\ScopeFilter; use AM2050\Support\Ulids; use PHPUnit\Framework\TestCase;
final class ScopeFilterTest extends TestCase { public function testUlidsArePortableAndSortableLength():void{$one=Ulids::make();$two=Ulids::make();self::assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{26}$/',$one);self::assertSame(26,strlen($two));}public function testWardScopeUsesParameterizedClause():void{[$sql,$params]=ScopeFilter::byWard(['role'=>'mobilizer','assigned_scope_type'=>'ward','assigned_scope_id'=>'01M0E5SB0G19ZYGD0C02CZTEQP'],'h.ward_id');self::assertSame(' AND h.ward_id = :scope_id',$sql);self::assertSame('01M0E5SB0G19ZYGD0C02CZTEQP',$params['scope_id']);}public function testGlobalRoleDoesNotGetArtificialScope():void{[$sql,$params]=ScopeFilter::byWard(['role'=>'program_admin','assigned_scope_type'=>null,'assigned_scope_id'=>null],'h.ward_id');self::assertSame('',$sql);self::assertSame([],$params);}}
