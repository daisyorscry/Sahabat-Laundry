<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageStorage
{
    protected static array $extByMime = [
        'image/png'      => 'png',
        'image/jpeg'     => 'jpg',
        'image/jpg'      => 'jpg',
        'image/webp'     => 'webp',
        'image/gif'      => 'gif',
        'image/svg+xml'  => 'svg',
    ];

    public static function saveJsonToPublic(string $json, string $dir = 'addons', ?string $preferName = null): string
    {
        $result = ImageValidator::validateJsonBase64($json);
        if (!$result['valid']) {
            throw new \InvalidArgumentException($result['error'] ?? 'Invalid image');
        }

        $data = $result['data'];
        $mime = $data['mime'];
        $raw  = base64_decode($data['base64'], true);

        $ext = self::$extByMime[$mime] ?? null;
        if (!$ext) {
            throw new \RuntimeException("Mime tidak didukung: {$mime}");
        }

        $base = $preferName
            ? Str::slug(pathinfo($preferName, PATHINFO_FILENAME))
            : Str::slug(pathinfo($data['filename'] ?? 'image', PATHINFO_FILENAME));

        if ($base === '') {
            $base = (string) Str::uuid();
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($dir)) {
            $disk->makeDirectory($dir);
        }

        $candidate = "{$dir}/{$base}.{$ext}";
        if ($disk->exists($candidate)) {
            $candidate = sprintf('%s/%s-%s.%s', $dir, $base, Str::random(6), $ext);
        }

        $disk->put($candidate, $raw);

        return $candidate;
    }

    public static function publicUrl(?string $path, ?string $fallback = null): ?string
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (empty($path)) {
            return $fallback;
        }

        if (!$disk->exists($path)) {
            return $fallback;
        }

        return $disk->url($path);
    }
}
