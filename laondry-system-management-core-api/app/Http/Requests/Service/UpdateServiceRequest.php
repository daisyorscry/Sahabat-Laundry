<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Helpers\ImageValidator;
use Illuminate\Validation\Validator;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('service')?->id;

        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('services', 'code')->ignore($id, 'id')->whereNull('deleted_at')],
            'category_id' => ['sometimes', 'nullable', 'uuid', 'exists:service_categories,id'],
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string'],
            'pricing_model' => ['sometimes', Rule::in(['weight', 'piece'])],
            'base_price' => ['sometimes', 'numeric', 'min:0'],
            'min_qty' => ['sometimes', 'numeric', 'min:0'],
            'est_duration_hours' => ['sometimes', 'integer', 'min:1'],
            'is_express_available' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
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
