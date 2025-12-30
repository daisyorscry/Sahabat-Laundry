<?php

namespace Database\Seeders\OrderService;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Auth\User;
use App\Models\OrderService\ServiceCategory;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $auditId = User::query()->orderBy('created_at')->value('id');
            if (! $auditId) {
                throw new \RuntimeException('users kosong. Pastikan UserSeeder jalan dulu.');
            }

            $now = now();

            $rows = [
                [
                    'code'        => 'KILOAN',
                    'name'        => 'Laundry Kiloan',
                    'description' => 'Cuci lipat/setrika berbasis berat',
                    'is_active'   => true,
                ],
                [
                    'code'        => 'ITEM_CARE',
                    'name'        => 'Item Care',
                    'description' => 'Gabungan wet/dry, bedding, curtain, carpet, shoes, bag',
                    'is_active'   => true,
                ],
                [
                    'code'        => 'PREMIUM',
                    'name'        => 'Premium Care',
                    'description' => 'Delicate/premium (sutra, wool, payet)',
                    'is_active'   => true,
                ],
                [
                    'code'        => 'B2B_LINEN',
                    'name'        => 'B2B Linen',
                    'description' => 'Linen hotel/resto/medis/korporat',
                    'is_active'   => true,
                ],
            ];

            ServiceCategory::withoutEvents(function () use ($rows, $auditId, $now) {
                foreach ($rows as $data) {
                    $model = ServiceCategory::firstOrNew(['code' => $data['code']]);

                    if (! $model->exists) {
                        $model->id         = (string) Str::uuid();
                        $model->created_by = $auditId;
                        $model->created_at = $now;
                    }

                    $model->name        = $data['name'];
                    $model->description = $data['description'] ?? null;
                    $model->is_active   = $data['is_active'] ?? true;
                    $model->updated_by  = $auditId;
                    $model->updated_at  = $now;

                    $model->save();
                }
            });
        });
    }
}
