<?php

namespace Database\Seeders\OrderService;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Auth\User;
use App\Models\OrderService\Addon;

class AddonSeeder extends Seeder
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
                    'code' => 'STAIN_TREATMENT',
                    'name' => 'Pretreatment Noda Berat',
                    'description' => 'Penanganan awal untuk noda membandel (minyak, darah, tinta). Direkomendasikan sebelum proses utama.',
                    'price' => 8000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/stain.svg',
                ],
                [
                    'code' => 'SANITIZE',
                    'name' => 'Sanitizing (Ozone/UV/Antibacterial)',
                    'description' => 'Proses sanitasi untuk mengurangi bakteri/virus dan bau. Cocok untuk helm, sepatu, pakaian pasca-sakit.',
                    'price' => 10000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/sanitize.svg',
                ],
                [
                    'code' => 'HOT_WASH',
                    'name' => 'Cuci Air Panas',
                    'description' => 'Pencucian dengan air panas terkontrol untuk hasil lebih higienis. Tidak disarankan untuk bahan menyusut.',
                    'price' => 7000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/hot_wash.svg',
                ],
                [
                    'code' => 'HYPOALLERGENIC',
                    'name' => 'Deterjen Hypoallergenic',
                    'description' => 'Deterjen/pewangi khusus bebas pewangi keras untuk kulit sensitif & bayi.',
                    'price' => 6000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/hypoallergenic.svg',
                ],
                [
                    'code' => 'COLOR_FIX',
                    'name' => 'Penjaga/Perbaikan Warna',
                    'description' => 'Menstabilkan warna agar tidak cepat pudar/bleeding. Cocok untuk batik & pakaian berwarna kuat.',
                    'price' => 7000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/color_fix.svg',
                ],
                [
                    'code' => 'DEODORIZE',
                    'name' => 'Penghilang Bau',
                    'description' => 'Deodorizing treatment untuk mengatasi bau apek/asap/lemak membandel.',
                    'price' => 6000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/deodorize.svg',
                ],
                [
                    'code' => 'EXTRA_RINSE',
                    'name' => 'Extra Bilas',
                    'description' => 'Tambahan siklus bilas untuk memastikan residu deterjen minimal.',
                    'price' => 4000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/extra_rinse.svg',
                ],
                [
                    'code' => 'SOFTENER_PREMIUM',
                    'name' => 'Pelembut Premium',
                    'description' => 'Pelembut khusus untuk kain halus, memberi hasil lembut dan wangi tahan lama.',
                    'price' => 5000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/softener.svg',
                ],
                [
                    'code' => 'WHITENING_BOOSTER',
                    'name' => 'Whitening Booster',
                    'description' => 'Booster pengangkat kusam pada pakaian putih (non-klorin, aman untuk kebanyakan serat).',
                    'price' => 7000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/whitening.svg',
                ],
                [
                    'code' => 'STEAM_FINISH',
                    'name' => 'Steam Finish',
                    'description' => 'Finishing uap untuk merapikan kusut & menyegarkan kain tanpa kontak panas berlebih.',
                    'price' => 7000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/steam.svg',
                ],
                [
                    'code' => 'HAND_WASH',
                    'name' => 'Hand Wash',
                    'description' => 'Pencucian manual untuk item sensitif yang tidak cocok dengan mesin.',
                    'price' => 12000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/hand_wash.svg',
                ],
                [
                    'code' => 'STARCH',
                    'name' => 'Kanji/Starch',
                    'description' => 'Penambahan kanji untuk hasil kaku & rapi pada kemeja/celana tertentu.',
                    'price' => 5000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/starch.svg',
                ],

                // ——— Packaging / Delivery related (umumnya cocok ke KILOAN & B2B)
                [
                    'code' => 'PACKAGING_PREMIUM',
                    'name' => 'Kemasan Premium (Garment/Hanger)',
                    'description' => 'Kemasan garment bag / hanger premium agar pakaian rapi dan terlindungi.',
                    'price' => 8000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/packaging_premium.svg',
                ],
                [
                    'code' => 'VACUUM_SEAL',
                    'name' => 'Vacuum Seal Packaging',
                    'description' => 'Pengepakan vakum untuk hemat ruang & menjaga kebersihan (cocok bedding & baju musiman).',
                    'price' => 12000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/vacuum.svg',
                ],

                // ——— Surcharge & Premium handling
                [
                    'code' => 'DELICATE_SURCHARGE',
                    'name' => 'Handling Bahan Sensitif',
                    'description' => 'Biaya tambahan untuk bahan sangat sensitif/bernilai (butuh perlakuan khusus).',
                    'price' => 15000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/delicate.svg',
                ],
                [
                    'code' => 'EXPRESS_UPGRADE',
                    'name' => 'Upgrade Express',
                    'description' => 'Upgrade SLA menjadi express (hanya jika service mendukung & kapasitas tersedia).',
                    'price' => 10000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/express.svg',
                ],

                // ——— Kiloan khusus (kemudahan & presentasi)
                [
                    'code' => 'FOLDING_PREMIUM',
                    'name' => 'Folding Premium (KonMari)',
                    'description' => 'Pelipatan gaya KonMari untuk hasil rapi seragam & mudah ditata.',
                    'price' => 6000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/folding_premium.svg',
                ],
                [
                    'code' => 'SEPARATE_BAG',
                    'name' => 'Tas Terpisah per Kategori',
                    'description' => 'Pengemasan terpisah (atasan/bawahan/dll) sesuai permintaan.',
                    'price' => 4000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/separate_bag.svg',
                ],

                // ——— Bedding / Carpet / Curtain
                [
                    'code' => 'ANTI_MITE',
                    'name' => 'Anti Tungau',
                    'description' => 'Treatment anti tungau untuk bedding/karpet/gorden.',
                    'price' => 15000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/antimite.svg',
                ],
                [
                    'code' => 'FABRIC_PROTECTOR',
                    'name' => 'Pelindung Kain (Protector)',
                    'description' => 'Coating pelindung kain untuk mengurangi penyerapan noda di masa depan.',
                    'price' => 20000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/fabric_protector.svg',
                ],

                // ——— Shoes / Leather / Bag care
                [
                    'code' => 'SHOE_DEODORIZE',
                    'name' => 'Deodorize Sepatu',
                    'description' => 'Netralisir bau pada sepatu sesudah pembersihan.',
                    'price' => 8000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/shoe_deodorize.svg',
                ],
                [
                    'code' => 'SHOE_ANTIFUNGAL',
                    'name' => 'Antifungal Sepatu',
                    'description' => 'Treatment antijamur untuk sepatu (inner & insole).',
                    'price' => 9000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/shoe_antifungal.svg',
                ],
                [
                    'code' => 'LEATHER_CONDITIONING',
                    'name' => 'Leather Conditioning',
                    'description' => 'Perawatan & conditioning kulit (tas/sepatu/jaket).',
                    'price' => 20000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/leather_condition.svg',
                ],
                [
                    'code' => 'WATERPROOFING',
                    'name' => 'Waterproofing Spray',
                    'description' => 'Lapisan perlindungan air untuk sepatu/jaket/tas tertentu.',
                    'price' => 18000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/waterproofing.svg',
                ],

                // ——— Minor repair (umum Item Care/B2B)
                [
                    'code' => 'BUTTON_REPAIR',
                    'name' => 'Perbaikan Kancing',
                    'description' => 'Pasang/replace kancing lepas (tidak termasuk kancing khusus).',
                    'price' => 8000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/button.svg',
                ],
                [
                    'code' => 'ZIPPER_LUBE',
                    'name' => 'Zipper Lubrication',
                    'description' => 'Pelumasan resleting macet agar kembali lancar (bukan ganti resleting).',
                    'price' => 6000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/zipper.svg',
                ],
                [
                    'code' => 'MINOR_HEM',
                    'name' => 'Hemming Minor',
                    'description' => 'Hemming ringan untuk ujung kain sederhana (non-premium).',
                    'price' => 20000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/hem.svg',
                ],

                // ——— Premium-specific add-ons
                [
                    'code' => 'BEAD_PROTECT',
                    'name' => 'Proteksi Payet/Hiasan',
                    'description' => 'Proteksi ekstra untuk payet/brokat saat proses pembersihan.',
                    'price' => 25000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/bead_protect.svg',
                ],
                [
                    'code' => 'FABRIC_COVERS',
                    'name' => 'Pelindung Kain Khusus',
                    'description' => 'Cover pelindung tambahan untuk material sangat halus (sutra/wool premium).',
                    'price' => 15000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/fabric_covers.svg',
                ],

                // ——— B2B ops
                [
                    'code' => 'SHRINK_WRAP_BUNDLE',
                    'name' => 'Shrink-wrap per Bundle',
                    'description' => 'Wrapping rapi per bundle untuk pengiriman B2B.',
                    'price' => 12000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/shrink_wrap.svg',
                ],
                [
                    'code' => 'LABELING_SERVICE',
                    'name' => 'Penandaan/Labeling',
                    'description' => 'Labeling item/seragam untuk memudahkan sortir & tracking B2B.',
                    'price' => 10000.00,
                    'is_active' => true,
                    'icon_path' => 'icons/addons/labeling.svg',
                ],
            ];

            foreach ($rows as $row) {
                $model = Addon::firstOrNew(['code' => $row['code']]);

                if (! $model->exists) {
                    $model->id         = (string) Str::uuid();
                    $model->created_by = $auditId;
                    $model->created_at = $now;
                }

                $model->name        = $row['name'];
                $model->description = $row['description'] ?? null;
                $model->price       = (float) $row['price'];
                $model->is_active   = (bool) ($row['is_active'] ?? true);
                $model->icon_path   = $row['icon_path'] ?? null;

                $model->updated_by  = $auditId;
                $model->updated_at  = $now;

                $model->save();
            }
        });
    }
}
