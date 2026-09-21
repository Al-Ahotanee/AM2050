<?php
declare(strict_types=1);

namespace AM2050\Support;

use Symfony\Component\Uid\Ulid;

final class Ulids
{
    public static function make(): string
    {
        return (new Ulid())->toBase32();
    }
}
