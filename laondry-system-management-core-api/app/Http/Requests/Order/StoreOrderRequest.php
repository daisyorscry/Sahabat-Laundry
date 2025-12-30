<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'uuid', Rule::exists('users', 'id')],
            'outlet_id' => ['required', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
            'order_type' => ['required', Rule::in(['DROPOFF', 'PICKUP'])],
            'requested_pickup_at' => ['nullable', 'date'],
            'promised_at' => ['nullable', 'date'],
            'pickup_address' => ['nullable', 'string', 'max:255'],
            'delivery_address' => ['nullable', 'string', 'max:255'],

            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'items.*.weight_kg' => ['nullable', 'numeric', 'min:0.01'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'], // override manual (opsional)
            'items.*.express' => ['sometimes', 'boolean'],
            'items.*.addons' => ['sometimes', 'array'],
            'items.*.addons.*.addon_id' => ['required', 'uuid', Rule::exists('addons', 'id')->whereNull('deleted_at')],
            'items.*.addons.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.addons.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $items = $this->input('items', []);
            foreach ($items as $idx => $row) {
                if (empty($row['weight_kg']) && empty($row['qty'])) {
                    $v->errors()->add("items.$idx", "Wajib isi salah satu: weight_kg atau qty.");
                }
            }
        });
    }
}
