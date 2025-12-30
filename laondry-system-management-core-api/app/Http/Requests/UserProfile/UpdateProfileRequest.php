<?php
// app/Http/Requests/Auth/UpdateProfileRequest.php
namespace App\Http\Requests\UserProfile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $uid = $this->user()?->id;

        return [
            'full_name'    => ['sometimes','string','max:100'],
            'email'        => ['sometimes','nullable','email','max:100', Rule::unique('users','email')->ignore($uid,'id')],
            'phone_number' => ['sometimes','nullable','string','max:20', Rule::unique('users','phone_number')->ignore($uid,'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email sudah terdaftar.',
            'phone_number.unique' => 'Nomor HP sudah terdaftar.',
        ];
    }
}
