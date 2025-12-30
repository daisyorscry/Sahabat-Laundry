<?php

namespace App\Http\Requests\Addon;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Helpers\ImageValidator;
use Illuminate\Validation\Validator;

class UpdateAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('addon')?->id;

        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('addons', 'code')->ignore($id, 'id')->whereNull('deleted_at')],
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
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
