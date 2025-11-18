import type {
    RegisterOptions,
    UseFormRegister,
    FieldValues,
    Path,
} from "react-hook-form";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export interface IFormFieldProps<TFieldValues extends FieldValues = FieldValues>
    extends DetailedHTMLProps<
        InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    > {
    id: string;
    label?: string;
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    // react-hook-form integration (optional)
    register?: UseFormRegister<TFieldValues>;
    rules?: RegisterOptions<TFieldValues>;
    error?: string;
    labelClassName?: string;
    className?: string;
}

export interface ISignUpFormData {
    email: string;
    password: string;
    agreeToTerms?: boolean;
}

export interface ISignInFormData {
    email: string;
    password: string;
}

export interface ICheckboxProps<TFieldValues extends FieldValues = FieldValues> {
    label: string;
    name: Path<TFieldValues> | string;
    checked?: boolean;
    isNeedToClean?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    register?: UseFormRegister<TFieldValues>;
    rules?: RegisterOptions<TFieldValues>;
    error?: string;
    className?: string;
}

export interface IMatchHistoryFormData {
    fullName: string;
    country: string;
}

export interface IDropdownOption {
    value: string;
    label: string;
}

export interface ICustomDropdownProps<TFieldValues extends FieldValues = FieldValues> {
    id: string;
    name: string;
    label?: string;
    placeholder?: string;
    options: IDropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    register?: UseFormRegister<TFieldValues>;
    rules?: RegisterOptions<TFieldValues>;
    error?: string;
    labelClassName?: string;
    className?: string;
    disabled?: boolean;
}