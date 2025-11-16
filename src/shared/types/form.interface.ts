import type {
    RegisterOptions,
    UseFormRegister,
    FieldValues,
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
}

export interface ISignInFormData {
    email: string;
    password: string;
}

export interface ICheckboxProps {
    label: string;
    checked?: boolean;
    isNeedToClean?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
