<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddOrderItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'service_id' => ['required', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'weight_kg' => ['nullable', 'numeric', 'min:0.01'],
            'qty' => ['nullable', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'express' => ['sometimes', 'boolean'],
            'addons' => ['sometimes', 'array'],
            'addons.*.addon_id' => ['required', 'uuid', Rule::exists('addons', 'id')->whereNull('deleted_at')],
            'addons.*.qty' => ['nullable', 'integer', 'min:1'],
            'addons.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            if (!$this->input('weight_kg') && !$this->input('qty')) {
                $v->errors()->add('item', 'Wajib isi salah satu: weight_kg atau qty.');
            }
        });
    }
}
