<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['required', 'string', 'max:20', 'unique:users,phone_number'],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'pin' => ['nullable', 'string', 'min:4', 'max:6'],
            'is_active' => ['sometimes', 'boolean'],
            'is_member' => ['sometimes', 'boolean'],
            'balance' => ['sometimes', 'numeric', 'min:0'],
            'customer_status_id' => ['nullable', 'integer', 'exists:customer_statuses,id'],

            // addresses (optional)
            'addresses' => ['sometimes', 'array'],
            'addresses.*.label' => ['nullable', 'string', 'max:100'],
            'addresses.*.address' => ['required', 'string'],
            'addresses.*.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'addresses.*.longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'addresses.*.is_primary' => ['sometimes', 'boolean'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Nama lengkap wajib diisi',
            'phone_number.required' => 'Nomor telepon wajib diisi',
            'phone_number.unique' => 'Nomor telepon sudah terdaftar',
            'email.unique' => 'Email sudah terdaftar',
            'email.email' => 'Format email tidak valid',
        ];
    }
}
