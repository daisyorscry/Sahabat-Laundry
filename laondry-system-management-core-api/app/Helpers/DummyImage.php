<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DummyImage
{
    public static function create(string $dir = 'addons', int $width = 200, int $height = 200, ?string $category = 'technics'): string
    {
        $disk = Storage::disk('public');
        if (!$disk->exists($dir)) {
            $disk->makeDirectory($dir);
        }

        try {
            $faker = \Faker\Factory::create();

            $filename = $faker->image($disk->path($dir), $width, $height, $category, false);

            if (is_string($filename)) {
                $filename = ltrim($filename, '/\\');
            }

            if (!empty($filename) && $disk->exists($dir . '/' . $filename)) {
                return $dir . '/' . $filename;
            }
        } catch (\Throwable $e) {
        }

        $filename = 'addon-' . Str::uuid() . '.png';
        $absolute = $disk->path($dir . '/' . $filename);
        self::generatePng($absolute, $width, $height);

        return $dir . '/' . $filename;
    }

    protected static function generatePng(string $absolutePath, int $width, int $height): void
    {
        $img = imagecreatetruecolor($width, $height);

        $bg = imagecolorallocate($img, random_int(0, 255), random_int(0, 255), random_int(0, 255));
        imagefill($img, 0, 0, $bg);

        $fg = imagecolorallocate($img, 255, 255, 255);
        imagestring($img, 2, 8, 8, 'ICON', $fg);

        imagepng($img, $absolutePath);
        imagedestroy($img);
    }
}
