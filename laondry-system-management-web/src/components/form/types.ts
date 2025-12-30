/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { FieldValues, Path } from "react-hook-form";

export type FormThemeSlots = {
  label: string;
  inputBase: string;
  inputSurf: {
    normal: string;
    invalid: string;
  };
  inputPadding: (opts: { leftIcon?: boolean; rightIcon?: boolean }) => string;
  helper: string;
  error: string;
  chip: {
    base: string;
    checked: string;
    unchecked: string;
  };
  popover: string;
};

export type TextLike = "text" | "email" | "textarea";

export type BaseField<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  helperText?: string;
  format?: (value: any) => string;
  parse?: (text: string) => any;
  disabled?: boolean;
  required?: boolean;
  ui?: Partial<FormThemeSlots>;
};

export type SelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

export type AsyncSelectField<T extends FieldValues> = {
  type: "async-select";
  name: keyof T;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;

  loadOptions: (q: string, signal?: AbortSignal) => Promise<SelectOption[]>;
  mapValue?: (o: SelectOption) => any;

  debounceMs?: number;
  minChars?: number;
  emptyText?: string;
  initialQuery?: string;
};

export type TextField<T extends FieldValues> = BaseField<T> & {
  type: TextLike;
  autoComplete?: string;
  maxLength?: number;
  rows?: number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode | null;
};
export type PasswordField<T extends FieldValues> = {
  type: "password";
  name: Path<T>;
  label?: string;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  autoComplete?: React.HTMLInputAutoCompleteAttribute;
  disabled?: boolean;
};
export type TelephoneField<T extends FieldValues> = {
  type: "tel";
  name: Path<T>;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;

  countryCode?: string;
  output?: "raw" | "e164";
  allowPlus?: boolean;
  minDigits?: number;
  maxDigits?: number;
};

export type NumberField<T extends FieldValues> = BaseField<T> & {
  type: "number";
  min?: number;
  max?: number;
  step?: number | "any";
  allowNegative?: boolean;

  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export type DecimalBase<T extends FieldValues> = BaseField<T> & {
  decimalSeparator?: "," | ".";
  thousandSeparator?: "," | "." | " ";
  precision?: number;
  allowNegative?: boolean;
};

export type DecimalField<T extends FieldValues> = DecimalBase<T> & {
  type: "decimal";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export type CurrencyField<T extends FieldValues> = DecimalBase<T> & {
  type: "currency";
  prefix?: string;
  suffix?: string;
  allowNegative?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export type PinField<T extends FieldValues> = BaseField<T> & {
  type: "pin";
  length?: number;
};

export type SelectField<T extends FieldValues> = BaseField<T> & {
  type: "select";
  options: Array<SelectOption>;
};

export type RadioOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

export type RadioGroupField<T extends FieldValues> = BaseField<T> & {
  type: "radio";
  options: Array<RadioOption>;

  inline?: boolean;
  dense?: boolean;
  framed?: boolean;
};

export type CheckboxField<T extends FieldValues> = BaseField<T> & {
  type: "checkbox";
};

export type SwitchField<T extends FieldValues> = BaseField<T> & {
  type: "switch";
  labelPosition?: "left" | "right";
  size?: "sm" | "md";
};

export type DateField<T extends FieldValues> = BaseField<T> & {
  type: "date";
  mode?: "date" | "time" | "datetime";
  min?: string;
  max?: string;
};

export type DateRangeField<T extends FieldValues> = BaseField<T> & {
  type: "date-range";
  mode?: "date" | "datetime";
  min?: string;
  max?: string;
  timeStepMinutes?: number;
  displayFormat?: (d: Date) => string;
  portal?: boolean;
  portalTargetId?: string;
  placement?: "center" | "top" | "bottom" | "left" | "right";
};

type WidenName<F> = F extends { name: any } ? Omit<F, "name"> & { name: string } : F;

export type RelativeFieldConfig<T extends FieldValues> = WidenName<FieldConfig<T>>;

export type ArrayObjectField<T extends FieldValues> = {
  type: "array-object";
  name: Path<T>;
  label?: string;
  helperText?: string;
  itemFields: RelativeFieldConfig<T>[];
  itemLabel?: (index: number, values: T) => React.ReactNode | string;
  minItems?: number;
  maxItems?: number;
  sortable?: boolean;
  addText?: string;
};

export type FileAsset = {
  id: string | number;
  label: string;
  url: string;
  mime?: string;
  size?: number;
  thumb?: string;
};

export type FileField<T extends FieldValues> = BaseField<T> & {
  type: "file";
  multiple?: boolean;
  accept?: string;
  minBytes?: number;
  maxBytes?: number;
  allowedMimes?: string[];
  allowedExts?: string[];
  images?: boolean | string[];
  maxFiles?: number;
  showPreview?: boolean;
  source?: "upload" | "library";
  assets?: FileAsset[];
  loadAssets?: (q: string, signal?: AbortSignal) => Promise<FileAsset[]>;
  searchable?: boolean;
  debounceMs?: number;
};

export type AtomicFieldConfig<T extends FieldValues> =
  | TextField<T>
  | PasswordField<T>
  | TelephoneField<T>
  | NumberField<T>
  | DecimalField<T>
  | CurrencyField<T>
  | PinField<T>
  | SelectField<T>
  | RadioGroupField<T>
  | CheckboxField<T>
  | SwitchField<T>
  | DateField<T>
  | DateRangeField<T>
  | FileField<T>
  | AsyncSelectField<T>;

export type ArrayField<T extends FieldValues> = BaseField<T> & {
  type: "array";
  of: Omit<AtomicFieldConfig<T>, "name">;
  minItems?: number;
  maxItems?: number;
  addText?: string;
};

export type FieldConfig<T extends FieldValues> =
  | TextField<T>
  | PasswordField<T>
  | TelephoneField<T>
  | NumberField<T>
  | DecimalField<T>
  | CurrencyField<T>
  | PinField<T>
  | SelectField<T>
  | RadioGroupField<T>
  | CheckboxField<T>
  | SwitchField<T>
  | DateField<T>
  | DateRangeField<T>
  | FileField<T>
  | ArrayField<T>
  | AsyncSelectField<T>
  | ArrayObjectField<T>;
