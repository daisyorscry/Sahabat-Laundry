<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCustomerRequest;
use App\Models\Auth\User;
use App\Models\Auth\Role;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    use ApiResponse;

    public function __invoke(RegisterCustomerRequest $request)
    {
        DB::beginTransaction();

        try {
            // 1) Buat user
            $user = User::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'password_hash' => Hash::make($request->password),
                'pin_hash' => $request->filled('pin') ? Hash::make($request->pin) : null,
            ]);

            $user->refresh(); // penting kalau UUID dibuat oleh DB

            // 2) Simpan alamat via relasi (FK auto)
            if ($request->filled('alamat')) {
                $user->addresses()->create([
                    'label' => $request->label_alamat ?? 'Alamat Utama',
                    'address' => $request->alamat,
                    'latitude' => $request->header('X-Latitude'),
                    'longitude' => $request->header('X-Longitude'),
                    'is_primary' => true,
                ]);
            }

            // 3) Assign role customer
            $role = Role::where('slug', 'customer')->firstOrFail();
            // pakai belongsToMany:
            $user->roles()->syncWithoutDetaching([$role->id]);
            // NOTE: kalau tetap pakai tabel pivot dengan kolom id tanpa default UUID, ubah migrasinya (lihat saran sebelumnya)

            DB::commit();

            return $this->successResponse(null, 'Registrasi berhasil. Silahkan login untuk verifikasi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse('Gagal registrasi', 500, $e->getMessage());
        }
    }
}
