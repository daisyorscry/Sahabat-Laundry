<?php

namespace Database\Seeders\OrderService;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Auth\User;
use App\Models\OrderService\ServiceCategory;
use App\Models\OrderService\Service;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $auditId = User::query()->orderBy('created_at')->value('id');
            if (! $auditId) {
                throw new \RuntimeException('users kosong. Pastikan UserSeeder jalan dulu.');
            }

            $now = now();

            $services = [
                'KILOAN' => [
                    [
                        'code' => 'KILO_REG3D',
                        'name' => 'Cuci Kiloan Reguler (3 Hari)',
                        'description' => 'Layanan cuci kiloan standar. SLA 3 hari (72 jam). Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 6000.00,
                        'min_qty' => 3.00,           // kg
                        'est_duration_hours' => 72,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_reg3d.svg',
                    ],
                    [
                        'code' => 'KILO_FOLD2D',
                        'name' => 'Cuci + Lipat (2 Hari)',
                        'description' => 'Cuci dan lipat rapi. SLA 2 hari (48 jam). Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 8000.00,
                        'min_qty' => 3.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_fold2d.svg',
                    ],
                    [
                        'code' => 'KILO_FOLD1D',
                        'name' => 'Cuci + Lipat (1 Hari)',
                        'description' => 'Cuci dan lipat rapi. SLA 1 hari (24 jam). Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 10000.00,
                        'min_qty' => 3.00,
                        'est_duration_hours' => 24,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_fold1d.svg',
                    ],
                    [
                        'code' => 'KILO_EXP3H',
                        'name' => 'Cuci Kiloan Express mulai dari 3 Jam',
                        'description' => 'Prioritas express. Estimasi mulai 3 jam, tergantung antrian & kapasitas. Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 15000.00,
                        'min_qty' => 3.00,
                        'est_duration_hours' => 3,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_exp3h.svg',
                    ],
                    [
                        'code' => 'KILO_IRON',
                        'name' => 'Setrika Kiloan',
                        'description' => 'Setrika pakaian kiloan. Bisa digabung dengan layanan cuci. Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 7000.00,
                        'min_qty' => 3.00,
                        'est_duration_hours' => 24,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_iron.svg',
                    ],
                    [
                        'code' => 'KILO_FOLD_IRON',
                        'name' => 'Cuci + Lipat + Setrika',
                        'description' => 'Paket lengkap: cuci, lipat, dan setrika. SLA 2 hari (48 jam). Minimal 3 kg.',
                        'pricing_model' => 'weight',
                        'base_price' => 12000.00,
                        'min_qty' => 3.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/kiloan/kilo_fold_iron.svg',
                    ],
                ],

                'ITEM_CARE' => [
                    [
                        'code' => 'ITEM_JAS',
                        'name' => 'Jas / Blazer',
                        'description' => 'Perawatan jas/blazer satuan. Termasuk spotting ringan.',
                        'pricing_model' => 'piece',
                        'base_price' => 25000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/jas.svg',
                    ],
                    [
                        'code' => 'ITEM_GAUN',
                        'name' => 'Gaun Pesta',
                        'description' => 'Perawatan gaun pesta satuan. Material umum (non-premium).',
                        'pricing_model' => 'piece',
                        'base_price' => 40000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 72,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/gaun.svg',
                    ],
                    [
                        'code' => 'ITEM_BATIK',
                        'name' => 'Batik',
                        'description' => 'Perawatan batik satuan. Warna aman, hindari pemutih.',
                        'pricing_model' => 'piece',
                        'base_price' => 20000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/batik.svg',
                    ],
                    [
                        'code' => 'ITEM_BEDCOVER',
                        'name' => 'Bed Cover',
                        'description' => 'Pencucian bed cover satuan. Ukuran single/queen/king harga bisa berbeda.',
                        'pricing_model' => 'piece',
                        'base_price' => 35000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/bedcover.svg',
                    ],
                    [
                        'code' => 'ITEM_SP',
                        'name' => 'Sprei',
                        'description' => 'Pencucian sprei satuan. Termasuk sarung bantal/guling opsional.',
                        'pricing_model' => 'piece',
                        'base_price' => 15000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 24,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/sprei.svg',
                    ],
                    [
                        'code' => 'ITEM_KARPET',
                        'name' => 'Karpet / Permadani',
                        'description' => 'Perawatan karpet/permadani. Termasuk vacuum, cuci, dan pengeringan.',
                        'pricing_model' => 'piece',
                        'base_price' => 50000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 96,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/karpet.svg',
                    ],
                    [
                        'code' => 'ITEM_SEPATU',
                        'name' => 'Sepatu Sneakers',
                        'description' => 'Deep clean sneakers. Termasuk midsole dan insole basic.',
                        'pricing_model' => 'piece',
                        'base_price' => 30000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/sepatu.svg',
                    ],
                    [
                        'code' => 'ITEM_TAS',
                        'name' => 'Tas Ransel / Tas Kulit',
                        'description' => 'Perawatan tas ransel/kulit. Pembersihan dan conditioning ringan.',
                        'pricing_model' => 'piece',
                        'base_price' => 35000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 72,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/tas.svg',
                    ],
                    [
                        'code' => 'ITEM_HELM',
                        'name' => 'Helm',
                        'description' => 'Cuci helm: busa, visor, dan pengeringan anti-bau.',
                        'pricing_model' => 'piece',
                        'base_price' => 20000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 24,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/helm.svg',
                    ],
                    [
                        'code' => 'ITEM_BONEKA',
                        'name' => 'Boneka',
                        'description' => 'Cuci boneka. Aman untuk bahan halus. Ukuran besar mungkin dikenakan biaya tambahan.',
                        'pricing_model' => 'piece',
                        'base_price' => 20000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/itemcare/boneka.svg',
                    ],
                ],

                'PREMIUM' => [
                    [
                        'code' => 'PREM_SUTRA',
                        'name' => 'Sutra (Dress/Scarf)',
                        'description' => 'Perawatan material sutra. Penanganan lembut dan deterjen khusus.',
                        'pricing_model' => 'piece',
                        'base_price' => 60000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 96,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/sutra.svg',
                    ],
                    [
                        'code' => 'PREM_WOOL',
                        'name' => 'Wool (Sweater/Coat)',
                        'description' => 'Perawatan wool. Hindari penyusutan, gunakan proses low-temp.',
                        'pricing_model' => 'piece',
                        'base_price' => 60000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 96,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/wool.svg',
                    ],
                    [
                        'code' => 'PREM_PAYET',
                        'name' => 'Gaun Payet/Brokat',
                        'description' => 'Perawatan gaun berpayet/brokat. Penanganan manual dominan.',
                        'pricing_model' => 'piece',
                        'base_price' => 80000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 120,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/payet.svg',
                    ],
                    [
                        'code' => 'PREM_KBY',
                        'name' => 'Kebaya Premium',
                        'description' => 'Perawatan kebaya premium. Jahitan halus dan hiasan dilindungi.',
                        'pricing_model' => 'piece',
                        'base_price' => 70000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 96,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/kebaya.svg',
                    ],
                    [
                        'code' => 'PREM_WEDDING',
                        'name' => 'Gaun Pengantin',
                        'description' => 'Perawatan gaun pengantin. Termasuk inspeksi noda & pelindung.',
                        'pricing_model' => 'piece',
                        'base_price' => 150000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 168,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/wedding.svg',
                    ],
                    [
                        'code' => 'PREM_COSTUME',
                        'name' => 'Kostum/Adat/Cosplay',
                        'description' => 'Perawatan kostum khusus. Teknik berbeda sesuai material.',
                        'pricing_model' => 'piece',
                        'base_price' => 50000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 96,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/premium/costume.svg',
                    ],
                ],

                'B2B_LINEN' => [
                    [
                        'code' => 'B2B_SPREI',
                        'name' => 'Sprei Hotel',
                        'description' => 'Linen hotel: sprei. Skema harga bisa kontrak volume.',
                        'pricing_model' => 'piece',
                        'base_price' => 12000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/sprei.svg',
                    ],
                    [
                        'code' => 'B2B_HANDUK',
                        'name' => 'Handuk Hotel',
                        'description' => 'Linen hotel: handuk. Disinfeksi & pengeringan optimal.',
                        'pricing_model' => 'piece',
                        'base_price' => 10000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/handuk.svg',
                    ],
                    [
                        'code' => 'B2B_TAPLAK',
                        'name' => 'Taplak Meja Restoran',
                        'description' => 'Linen resto: taplak meja. Penanganan noda minyak/sauce.',
                        'pricing_model' => 'piece',
                        'base_price' => 8000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/taplak.svg',
                    ],
                    [
                        'code' => 'B2B_NAPKIN',
                        'name' => 'Napkin Restoran',
                        'description' => 'Linen resto: napkin. Pemutih terkontrol jika diperlukan.',
                        'pricing_model' => 'piece',
                        'base_price' => 5000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/napkin.svg',
                    ],
                    [
                        'code' => 'B2B_MEDIS',
                        'name' => 'Linen Medis (Scrub, Bed Sheet)',
                        'description' => 'Standar higienis untuk medis. Proses disinfeksi khusus.',
                        'pricing_model' => 'piece',
                        'base_price' => 20000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 72,
                        'is_express_available' => false,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/medis.svg',
                    ],
                    [
                        'code' => 'B2B_SERAGAM',
                        'name' => 'Seragam Karyawan',
                        'description' => 'Seragam kerja. Tersedia penjemputan berkala via kontrak.',
                        'pricing_model' => 'piece',
                        'base_price' => 15000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/seragam.svg',
                    ],
                    [
                        'code' => 'B2B_UNIFORM',
                        'name' => 'Uniform F&B',
                        'description' => 'Uniform F&B. Penanganan noda minyak & bau asap dapur.',
                        'pricing_model' => 'piece',
                        'base_price' => 15000.00,
                        'min_qty' => 1.00,
                        'est_duration_hours' => 48,
                        'is_express_available' => true,
                        'is_active' => true,
                        'icon_path' => 'icons/b2b/uniform.svg',
                    ],
                ],
            ];

            foreach ($services as $catCode => $rows) {
                $cat = ServiceCategory::where('code', $catCode)->first();
                if (! $cat) {
                    continue;
                }

                foreach ($rows as $row) {
                    $model = Service::firstOrNew(['code' => $row['code']]);

                    if (! $model->exists) {
                        $model->id         = (string) Str::uuid();
                        $model->created_by = $auditId;
                        $model->created_at = $now;
                    }

                    // Set semua field sesuai migrasi
                    $model->category_id          = $cat->id;
                    $model->name                 = $row['name'];
                    $model->description          = $row['description'];
                    $model->pricing_model        = $row['pricing_model'];
                    $model->base_price           = (float) $row['base_price'];
                    $model->min_qty              = (float) $row['min_qty'];
                    $model->est_duration_hours   = (int) $row['est_duration_hours'];
                    $model->is_express_available = (bool) $row['is_express_available'];
                    $model->is_active            = (bool) $row['is_active'];
                    $model->icon_path            = $row['icon_path'];

                    $model->updated_by = $auditId;
                    $model->updated_at = $now;

                    $model->save();
                }
            }
        });
    }
}
