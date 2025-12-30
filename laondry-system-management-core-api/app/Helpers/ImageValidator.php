<?php

namespace App\Helpers;

class ImageValidator
{
    protected static array $allowedMimes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
    ];

    public static function validateJsonBase64(?string $json): array
    {
        if (empty($json)) {
            return ['valid' => false, 'error' => 'Icon path kosong'];
        }

        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['valid' => false, 'error' => 'Format JSON tidak valid'];
        }

        if (!isset($data['filename'], $data['mime'], $data['base64'])) {
            return ['valid' => false, 'error' => 'JSON harus punya filename, mime, base64'];
        }

        if (!in_array($data['mime'], self::$allowedMimes, true)) {
            return ['valid' => false, 'error' => 'Mime type tidak diizinkan'];
        }

        $decoded = base64_decode($data['base64'], true);
        if ($decoded === false) {
            return ['valid' => false, 'error' => 'Base64 tidak valid'];
        }

        $finfo = finfo_open();
        $mime = finfo_buffer($finfo, $decoded, FILEINFO_MIME_TYPE);
        finfo_close($finfo);

        if (!in_array($mime, self::$allowedMimes, true)) {
            return ['valid' => false, 'error' => "File bukan image, terdeteksi: $mime"];
        }

        return ['valid' => true, 'data' => $data];
    }
}
