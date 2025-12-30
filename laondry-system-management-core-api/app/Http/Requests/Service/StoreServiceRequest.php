<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use App\Helpers\ImageValidator;
use Illuminate\Validation\Validator;

class StoreServiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'category_id'          => ['required', 'uuid', 'exists:service_categories,id'],
            'code'                 => ['required', 'string', 'max:50', 'unique:services,code'],
            'name'                 => ['required', 'string', 'max:150'],
            'description'          => ['nullable', 'string'],
            'pricing_model'        => ['required', 'in:weight,piece'],
            'base_price'           => ['nullable'], // dinormalisasi di controller
            'min_qty'              => ['nullable'],
            'est_duration_hours'   => ['nullable', 'integer', 'min:0'],
            'is_express_available' => ['sometimes', 'boolean'],
            'is_active'            => ['sometimes', 'boolean'],
            'icon_path'            => ['nullable', 'json'],

            // addons (opsional)
            'addons'                      => ['sometimes', 'array'],
            'addons.*.addon_id'           => ['required', 'uuid', 'exists:addons,id'],
            'addons.*.is_required'        => ['sometimes', 'boolean'],

            // prices (opsional)
            'prices'                      => ['sometimes', 'array'],
            'prices.*.outlet_id'          => ['required', 'uuid', 'exists:outlets,id'],
            'prices.*.member_tier'        => ['nullable', 'string', 'max:50'],
            'prices.*.price'              => ['required'], // dinormalisasi ke decimal
            'prices.*.effective_start'    => ['required', 'date'],
            'prices.*.effective_end'      => ['nullable', 'date', 'after_or_equal:prices.*.effective_start'],
            'prices.*.is_express'         => ['sometimes', 'boolean'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }

    public function withValidator($validator)
    {
        $validator->after(function (Validator $v) {
            if ($this->filled('icon_path')) {
                $result = ImageValidator::validateJsonBase64($this->icon_path);
                if (!$result['valid']) {
                    $v->errors()->add('icon_path', $result['error']);
                }
            }
        });
    }
}
