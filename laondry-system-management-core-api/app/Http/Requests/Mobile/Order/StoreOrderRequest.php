<?php

namespace App\Http\Requests\Mobile\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\OrderService\Service;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id' => ['required', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
            'order_type' => ['required', Rule::in(['DROPOFF', 'PICKUP'])],
            'requested_pickup_at' => ['nullable', 'date'],
            'pickup_address' => ['nullable', 'string', 'max:255'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'member_tier' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'items.*.weight_kg' => ['nullable', 'numeric', 'min:0.01'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.is_express' => ['sometimes', 'boolean'],
            'items.*.addons' => ['sometimes', 'array'],
            'items.*.addons.*.addon_id' => ['required', 'uuid', Rule::exists('addons', 'id')->whereNull('deleted_at')],
            'items.*.addons.*.qty' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $items = $this->input('items', []);
            $ids = array_values(array_unique(array_map(fn($r) => $r['service_id'] ?? null, $items)));
            $services = Service::whereIn('id', array_filter($ids))
                ->get(['id', 'code', 'pricing_model'])->keyBy('id');

            foreach ($items as $i => $row) {
                $svc = isset($row['service_id']) ? $services->get($row['service_id']) : null;
                if (empty($row['weight_kg']) && empty($row['qty'])) {
                    $v->errors()->add("items.$i", 'Wajib isi salah satu: weight_kg atau qty.');
                    continue;
                }
                if ($svc) {
                    if ($svc->pricing_model === 'weight' && empty($row['weight_kg'])) {
                        $v->errors()->add("items.$i.weight_kg", "Service {$svc->code} butuh weight_kg.");
                    }
                    if ($svc->pricing_model === 'piece' && empty($row['qty'])) {
                        $v->errors()->add("items.$i.qty", "Service {$svc->code} butuh qty.");
                    }
                }
            }
        });
    }
}
