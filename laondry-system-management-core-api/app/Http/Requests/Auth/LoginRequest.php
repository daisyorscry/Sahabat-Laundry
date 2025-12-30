<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string'],
            'pin' => ['required', 'string', 'min:4', 'max:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.required' => 'Nomor telepon wajib diisi',
            'pin.required' => 'PIN wajib diisi',
            'pin.min' => 'PIN minimal 4 digit',
            'pin.max' => 'PIN maksimal 6 digit',
        ];
    }
}
