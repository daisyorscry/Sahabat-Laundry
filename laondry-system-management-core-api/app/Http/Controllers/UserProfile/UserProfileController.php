<?php
namespace App\Http\Controllers\UserProfile;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserProfile\UpdateProfileRequest;
use App\Models\Auth\User;
use App\Models\Auth\UserAddress;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class UserProfileController extends Controller
{
    use ApiResponse;

    public function me(Request $request)
    {
        try {
            $loginsLimit = max(0, (int) ($request->integer('logins_limit') ?? 10));
            $otpsLimit = max(0, (int) ($request->integer('otps_limit') ?? 5));

            $user = User::query()
                ->with([
                    'roles:id,slug,name',
                    'addresses' => fn($q) => $q->select('id', 'user_id', 'label', 'address', 'latitude', 'longitude', 'is_primary', 'created_at')
                        ->orderByDesc('is_primary')->orderByDesc('created_at'),
                    'otps' => function ($q) use ($otpsLimit) {
                        $q->select('id', 'user_id', 'used_at', 'created_at')->latest();
                        if ($otpsLimit > 0)
                            $q->limit($otpsLimit);
                    },
                    'staffPositions:id,user_id,position',
                    'customerStatus:id,code,description',
                    'memberTier:id,code,name,description,discount_percentage,benefits,priority',
                    'logins' => function ($q) use ($loginsLimit) {
                        $q->select(
                            'id',
                            'user_id',
                            'logged_in_at',
                            'ip_address',
                            'user_agent',
                            'device_type',
                            'platform',
                            'browser',
                            'country',
                            'region',
                            'city',
                            'latitude',
                            'longitude',
                            'timezone',
                            'device_id',
                            'is_suspicious',
                            'created_at'
                        )
                            ->latest();
                        if ($loginsLimit > 0)
                            $q->limit($loginsLimit);
                    },
                ])
                ->withCount(['addresses', 'staffPositions', 'logins'])
                ->findOrFail(Auth::id());

            return $this->successResponse($user);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil profil', 500, ['exception' => $e->getMessage()]);
        }
    }

    public function update(UpdateProfileRequest $request)
    {
        try {
            $user = DB::transaction(function () use ($request) {
                $user = User::lockForUpdate()->findOrFail(Auth::id());
                $p = $request->validated();

                $emailChanged = array_key_exists('email', $p) && $p['email'] !== $user->email;

                if (array_key_exists('full_name', $p))
                    $user->full_name = $p['full_name'];
                if (array_key_exists('email', $p))
                    $user->email = $p['email'];
                if (array_key_exists('phone_number', $p))
                    $user->phone_number = $p['phone_number'];
                if ($emailChanged)
                    $user->email_verified_at = null;

                $user->save();

            });

            return $this->successResponse($user, 'Profil diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui profil', 422, ['exception' => $e->getMessage()]);
        }
    }

    private function syncAddresses(User $user, array $addresses, ?string $primaryId): void
    {
        $userId = $user->id;
        $newPrimaryId = $primaryId;

        foreach ($addresses as $row) {
            $id = $row['id'] ?? null;
            $label = $row['label'] ?? null;
            $address = $row['address'] ?? null;
            $lat = $row['latitude'] ?? null;
            $lng = $row['longitude'] ?? null;
            $isPrimary = array_key_exists('is_primary', $row) ? (bool) $row['is_primary'] : null;
            $toDelete = !empty($row['_delete']);

            if ($id) {
                // pastikan milik user
                $addr = UserAddress::where('id', $id)->where('user_id', $userId)->first();
                if (!$addr)
                    continue;

                if ($toDelete) {
                    $addr->delete();
                    // kalau yang dihapus primary, kosongkan dulu, nanti dipilih lagi jika ada newPrimaryId
                    if ($addr->is_primary && !$newPrimaryId)
                        $newPrimaryId = null;
                    continue;
                }

                // update kolom yang dikirim
                $updates = [];
                if (array_key_exists('label', $row))
                    $updates['label'] = $label;
                if (array_key_exists('address', $row))
                    $updates['address'] = $address;
                if (array_key_exists('latitude', $row))
                    $updates['latitude'] = $lat;
                if (array_key_exists('longitude', $row))
                    $updates['longitude'] = $lng;
                if (!empty($updates))
                    $addr->update($updates);

                if ($isPrimary === true)
                    $newPrimaryId = $addr->id;
            } else {
                if ($toDelete)
                    continue; // abaikan
                // create baru
                $created = UserAddress::create([
                    'user_id' => $userId,
                    'label' => $label,
                    'address' => $address,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'is_primary' => false, // set di bawah
                ]);
                if ($isPrimary === true)
                    $newPrimaryId = $created->id;
            }
        }

        // Set primary (kalau diminta). Pastikan hanya satu primary.
        if ($newPrimaryId) {
            UserAddress::where('user_id', $userId)->update(['is_primary' => false]);
            UserAddress::where('user_id', $userId)->where('id', $newPrimaryId)->update(['is_primary' => true]);
        } else {
            // Jika semua terhapus atau tidak ada primary, pastikan ada satu primary jika masih ada address
            $hasPrimary = UserAddress::where('user_id', $userId)->where('is_primary', true)->exists();
            if (!$hasPrimary) {
                $firstId = UserAddress::where('user_id', $userId)->orderByDesc('created_at')->value('id');
                if ($firstId) {
                    UserAddress::where('user_id', $userId)->update(['is_primary' => false]);
                    UserAddress::where('id', $firstId)->update(['is_primary' => true]);
                }
            }
        }
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048', // 2MB
        ]);

        try {
            $user = User::findOrFail(Auth::id());

            $disk = config('filesystems.default', 'public'); // atau pakai 'public' fixed
            $file = $request->file('avatar');

            // folder per user
            $dir = 'avatars/' . $user->id;
            $ext = strtolower($file->getClientOriginalExtension() ?: 'webp');
            $name = Str::uuid() . '.' . $ext;

            // hapus avatar lama jika ada
            if ($user->avatar_path && Storage::disk($user->avatar_disk ?: $disk)->exists($user->avatar_path)) {
                Storage::disk($user->avatar_disk ?: $disk)->delete($user->avatar_path);
            }

            // simpan baru
            $path = $file->storeAs($dir, $name, ['disk' => $disk]);

            $user->avatar_disk = $disk;
            $user->avatar_path = $path;
            $user->save();

            return $this->successResponse($user->fresh(), 'Avatar diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal update avatar', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function removeAvatar()
    {
        try {
            $user = User::findOrFail(Auth::id());

            if ($user->avatar_path) {
                $disk = $user->avatar_disk ?: 'public';
                try {
                    if (Storage::disk($disk)->exists($user->avatar_path)) {
                        Storage::disk($disk)->delete($user->avatar_path);
                    }
                } catch (\Throwable) { /* ignore */
                }
                $user->avatar_path = null;
                $user->avatar_disk = null;
                $user->save();
            }

            return $this->successResponse($user->fresh(), 'Avatar dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal hapus avatar', 422, ['exception' => $e->getMessage()]);
        }
    }
}
