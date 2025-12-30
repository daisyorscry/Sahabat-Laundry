<?php

namespace App\Http\Controllers\UserProfile;

use App\Http\Controllers\Controller;
use App\Models\Auth\UserAddress;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class UserAddressController extends Controller
{
    use ApiResponse;

    /** List alamat user (primary duluan) */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $items = UserAddress::where('user_id', $userId)
            ->orderByDesc('is_primary')
            ->orderBy('created_at')
            ->get();

        return $this->successResponse($items);
    }

    /** Detail satu alamat user */
    public function show(Request $request, string $id)
    {
        $userId = $request->user()->id;

        $addr = UserAddress::where('user_id', $userId)
            ->where('id', $id)
            ->first();

        if (!$addr) {
            return $this->errorResponse('Alamat tidak ditemukan', 404);
        }

        return $this->successResponse($addr);
    }

    /** Create alamat baru */
    public function store(Request $request)
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        try {
            $addr = DB::transaction(function () use ($data, $user) {
                $addr = new UserAddress();
                $addr->user_id = $user->id;
                $addr->label = $data['label'];
                $addr->address = $data['address'] ?? null;
                $addr->latitude = $data['latitude'] ?? null;
                $addr->longitude = $data['longitude'] ?? null;
                $addr->is_primary = (bool) ($data['is_primary'] ?? false);
                $addr->save();

                // Jika dibuat primary, nonaktifkan primary lain
                if ($addr->is_primary) {
                    UserAddress::where('user_id', $user->id)
                        ->where('id', '!=', $addr->id)
                        ->update(['is_primary' => false]);
                }

                return $addr;
            });

            return $this->successResponse($addr, 'Alamat dibuat', 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat alamat', 422, $e->getMessage());
        }
    }

    /** Update alamat */
    public function update(Request $request, string $id)
    {
        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        $userId = $request->user()->id;

        $addr = UserAddress::where('user_id', $userId)->where('id', $id)->first();
        if (!$addr) {
            return $this->errorResponse('Alamat tidak ditemukan', 404);
        }

        try {
            $addr = DB::transaction(function () use ($addr, $data, $userId) {
                if (array_key_exists('label', $data))
                    $addr->label = $data['label'];
                if (array_key_exists('address', $data))
                    $addr->address = $data['address'];
                if (array_key_exists('latitude', $data))
                    $addr->latitude = $data['latitude'];
                if (array_key_exists('longitude', $data))
                    $addr->longitude = $data['longitude'];

                $setPrimary = array_key_exists('is_primary', $data) ? (bool) $data['is_primary'] : null;

                if ($setPrimary === true) {
                    $addr->is_primary = true;
                    $addr->save();

                    UserAddress::where('user_id', $userId)
                        ->where('id', '!=', $addr->id)
                        ->update(['is_primary' => false]);
                } elseif ($setPrimary === false) {
                    // Boleh menonaktifkan primary; tidak memaksa harus ada primary.
                    $addr->is_primary = false;
                    $addr->save();
                } else {
                    $addr->save();
                }

                return $addr;
            });

            return $this->successResponse($addr, 'Alamat diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui alamat', 422, $e->getMessage());
        }
    }

    /** Hapus alamat */
    public function destroy(Request $request, string $id)
    {
        $userId = $request->user()->id;

        $addr = UserAddress::where('user_id', $userId)->where('id', $id)->first();
        if (!$addr) {
            return $this->errorResponse('Alamat tidak ditemukan', 404);
        }

        try {
            DB::transaction(function () use ($addr, $userId) {
                $wasPrimary = (bool) $addr->is_primary;
                $addr->delete();

                // Jika yang dihapus adalah primary, promosikan salah satu yang tersisa jadi primary
                if ($wasPrimary) {
                    $next = UserAddress::where('user_id', $userId)->orderBy('created_at')->first();
                    if ($next) {
                        $next->is_primary = true;
                        $next->save();

                        UserAddress::where('user_id', $userId)
                            ->where('id', '!=', $next->id)
                            ->update(['is_primary' => false]);
                    }
                }
            });

            return $this->successResponse(null, 'Alamat dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus alamat', 422, $e->getMessage());
        }
    }

    /** Set alamat tertentu menjadi primary */
    public function setPrimary(Request $request, string $id)
    {
        $userId = $request->user()->id;

        $addr = UserAddress::where('user_id', $userId)->where('id', $id)->first();
        if (!$addr) {
            return $this->errorResponse('Alamat tidak ditemukan', 404);
        }

        try {
            DB::transaction(function () use ($addr, $userId) {
                UserAddress::where('user_id', $userId)->update(['is_primary' => false]);
                $addr->is_primary = true;
                $addr->save();
            });

            return $this->successResponse($addr, 'Alamat utama diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengatur primary', 422, $e->getMessage());
        }
    }
}
