// registry.ts
import type { FC } from "react";
import { Control, FieldValues } from "react-hook-form";

import ArrayFieldComp from "./fields/ArrayField";
import ArrayObjectFieldComp from "./fields/ArrayObjectField";
import AsyncSelectFieldComp from "./fields/AsyncSelectField";
import CheckboxFieldComp from "./fields/CheckboxField";
import CurrencyFieldComp from "./fields/CurrencyField";
import DateFieldComp from "./fields/DateField";
import DateRangeFieldComp from "./fields/DateRangeField";
import DecimalFieldComp from "./fields/DecimalField";
import FileFieldComp from "./fields/FileField";
import NumberFieldComp from "./fields/NumberField";
import PasswordFieldComp from "./fields/PasswordField";
import PinFieldComp from "./fields/PinField";
import RadioGroupFieldComp from "./fields/RadioGroupField";
import SelectFieldComp from "./fields/SelectField";
import SwitchFieldComp from "./fields/SwitchField";
import TelephoneFieldComp from "./fields/TelephoneField";
import TextFieldComp from "./fields/TextField";
import {
  ArrayField,
  ArrayObjectField,
  AsyncSelectField,
  CheckboxField,
  CurrencyField,
  DateField,
  DateRangeField,
  DecimalField,
  FieldConfig,
  FileField,
  NumberField,
  PasswordField,
  PinField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TelephoneField,
  TextField,
  TextLike,
} from "./types";

export type FieldRenderer<T extends FieldValues, F extends FieldConfig<T>> = FC<{
  control: Control<T>;
  field: F;
}>;

export type ControlRegistry<T extends FieldValues> = Record<
  TextLike,
  FieldRenderer<T, TextField<T>>
> & {
  password: FieldRenderer<T, PasswordField<T>>;
  tel: FieldRenderer<T, TelephoneField<T>>;
  number: FieldRenderer<T, NumberField<T>>;
  decimal: FieldRenderer<T, DecimalField<T>>;
  currency: FieldRenderer<T, CurrencyField<T>>;
  pin: FieldRenderer<T, PinField<T>>;
  select: FieldRenderer<T, SelectField<T>>;
  radio: FieldRenderer<T, RadioGroupField<T>>;
  checkbox: FieldRenderer<T, CheckboxField<T>>;
  switch: FieldRenderer<T, SwitchField<T>>;
  date: FieldRenderer<T, DateField<T>>;
  "date-range": FieldRenderer<T, DateRangeField<T>>;
  file: FieldRenderer<T, FileField<T>>;

  "async-select": FieldRenderer<T, AsyncSelectField<T>>;
  "array-object": FieldRenderer<T, ArrayObjectField<T>>;
  array: FieldRenderer<T, ArrayField<T>>;
};

export const controlRegistry = {
  text: TextFieldComp,
  email: TextFieldComp,
  textarea: TextFieldComp,

  password: PasswordFieldComp,
  tel: TelephoneFieldComp,
  number: NumberFieldComp,
  decimal: DecimalFieldComp,
  currency: CurrencyFieldComp,
  pin: PinFieldComp,
  select: SelectFieldComp,
  radio: RadioGroupFieldComp,
  checkbox: CheckboxFieldComp,
  switch: SwitchFieldComp,
  date: DateFieldComp,
  "date-range": DateRangeFieldComp,
  file: FileFieldComp,

  "async-select": AsyncSelectFieldComp,
  "array-object": ArrayObjectFieldComp,
  array: ArrayFieldComp,
} satisfies ControlRegistry<FieldValues>;
