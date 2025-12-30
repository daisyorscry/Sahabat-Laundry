<?php

namespace Database\Seeders\OrderService;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Auth\User;
use App\Models\OrderService\{Outlet, ServiceCategory, Service, Addon, ServicePrice};
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class OrderServiceSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $auditId = User::query()->orderBy('created_at')->value('id');
            if (!$auditId) {
                throw new \RuntimeException('users kosong. Pastikan UserSeeder jalan dulu.');
            }

            Outlet::withoutEvents(function () use ($auditId) {
                Outlet::factory(10)->state([
                    'created_by' => $auditId, 'updated_by' => $auditId,
                ])->create();
            });

            $categories = ServiceCategory::withoutEvents(function () use ($auditId) {
                return ServiceCategory::factory(30)->state([
                    'created_by' => $auditId, 'updated_by' => $auditId,
                ])->create();
            });

            $services = collect();
            foreach ($categories as $cat) {
                $batch = Service::withoutEvents(function () use ($auditId, $cat) {
                    return Service::factory(70)->state([
                        'created_by' => $auditId, 'updated_by' => $auditId,
                    ])->create(['category_id' => $cat->id]);
                });
                $services = $services->merge($batch);
            }

            $addons = Addon::withoutEvents(function () use ($auditId) {
                return Addon::factory(100)->state([
                    'created_by' => $auditId, 'updated_by' => $auditId,
                ])->create();
            });

            foreach ($services as $srv) {
                $attach = $addons->random(random_int(1, min(3, $addons->count())));
                foreach ($attach as $add) {
                    DB::table('service_addons')->insert([
                        'id'          => (string) Str::uuid(),
                        'service_id'  => $srv->id,
                        'addon_id'    => $add->id,
                        'is_required' => (bool) random_int(0, 1),
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }

            // --- Harga ---
            $outletIds = Outlet::pluck('id');

            foreach ($services as $srv) {
                foreach ($outletIds as $outletId) {
                    // normal
                    $this->createPriceWithFallback($srv->id, $outletId, false, $auditId);

                    // express (jika tersedia)
                    if ($srv->is_express_available) {
                        $this->createPriceWithFallback($srv->id, $outletId, true, $auditId);
                    }
                }
            }
        });
    }

    /**
     * Coba buat ServicePrice; jika bentrok unik, geser effective_start dan retry.
     */
    private function createPriceWithFallback(string $serviceId, string $outletId, bool $isExpress, string $auditId, int $maxRetries = 7): void
    {
        // generate awal dari factory, tapi jangan langsung create—pakai make() lalu create manual
        $model = ServicePrice::factory()->make([
            'service_id'   => $serviceId,
            'outlet_id'    => $outletId,
            'is_express'   => $isExpress,
            'created_by'   => $auditId,
            'updated_by'   => $auditId,
        ]);

        // pastikan ada effective_start, kalau tidak ada set default hari ini
        $start = $model->effective_start ? Carbon::parse($model->effective_start) : now();

        // for ($i = 0; $i < $maxRetries; $i++) {
        //     try {
        //         ServicePrice::create([
        //             'service_id'       => $serviceId,
        //             'outlet_id'        => $outletId,
        //             'member_tier'      => $model->member_tier,   // dari factory
        //             'is_express'       => $isExpress,
        //             'price'            => $model->price,
        //             'effective_start'  => $start->copy(),        // tanggal saat ini
        //             'effective_end'    => $model->effective_end, // boleh null
        //             'created_by'       => $auditId,
        //             'updated_by'       => $auditId,
        //         ]);
        //         return; // sukses
        //     } catch (UniqueConstraintViolationException $e) {
        //         // geser tanggal dan coba lagi
        //         // kalau kolom bertipe timestamp, geser menit biar aman; kalau DATE, geser hari pun cukup
        //         $start = $start->addDay(); // atau ->addMinutes(5) jika bertipe timestamp
        //         // lanjut loop
        //     }
        // }

        // jika semua retry gagal, biarkan diam/dicatat log agar seeder tetap jalan
        // logger opsional:
        logger()->warning('Gagal seeding ServicePrice setelah retry', [
            'service_id' => $serviceId,
            'outlet_id'  => $outletId,
            'is_express' => $isExpress,
        ]);
    }
}
