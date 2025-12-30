<?php

namespace App\Http\Requests\Addon;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use \App\Helpers\ImageValidator;

class StoreAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'        => ['required', 'string', 'max:50', Rule::unique('addons', 'code')->whereNull('deleted_at')],
            'name'        => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'price'       => ['required', 'numeric', 'min:0'],
            'is_active'   => ['sometimes', 'boolean'],
            'icon_path'   => ['nullable', 'json'],
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
