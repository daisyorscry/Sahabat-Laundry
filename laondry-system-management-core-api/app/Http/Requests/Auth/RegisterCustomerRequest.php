<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterCustomerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:users,email',
            'phone_number' => 'nullable|string|max:20|unique:users,phone_number',
            'password' => 'required|string|min:6',
            'pin' => 'required|string|digits:6',
            'alamat' => 'nullable|string',
            'label_alamat' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'full_name.max' => 'Nama lengkap maksimal 100 karakter.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar.',
            'phone_number.unique' => 'Nomor HP sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
            'pin.required' => 'PIN wajib diisi.',
            'pin.digits' => 'PIN harus terdiri dari 6 digit angka.',
            'label_alamat.max' => 'Label alamat maksimal 100 karakter.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
