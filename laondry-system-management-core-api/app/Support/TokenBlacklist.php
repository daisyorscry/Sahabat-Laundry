<?php

namespace App\Support;

class TokenBlacklist
{
    public static function put(string $jti, int $ttlSeconds): void
    {
        cache()->put("bl:{$jti}", 1, $ttlSeconds);
    }

    public static function has(string $jti): bool
    {
        return cache()->has("bl:{$jti}");
    }
}
