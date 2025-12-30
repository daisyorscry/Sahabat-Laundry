/* eslint-disable @typescript-eslint/no-explicit-any */
import { Control, Controller, FieldValues } from "react-hook-form";

import { CheckboxField } from "../types";

export default function CheckboxFieldComp<T extends FieldValues>({
  control,
  field,
}: {
  control: Control<T>;
  field: CheckboxField<any>;
}) {
  return (
    <div className="form-row">
      <Controller
        control={control}
        name={field.name as any}
        render={({ field: rhf, fieldState }) => (
          <>
            <label>
              <input
                type="checkbox"
                checked={!!rhf.value}
                onChange={(e) => rhf.onChange(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>{field.label}</span>
            </label>
            {field.helperText && <small>{field.helperText}</small>}
            {fieldState.error && (
              <small style={{ color: "crimson" }}>{fieldState.error.message}</small>
            )}
          </>
        )}
      />
    </div>
  );
}
