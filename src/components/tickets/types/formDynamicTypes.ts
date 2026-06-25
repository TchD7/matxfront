export type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'checkbox'
    | 'date'
    | 'time'
    | 'datetime'
    | 'select'
    | 'multi_select'
    | 'radio'
    | 'image'
    | 'file'
    | 'signature';

export interface RawFieldOption {
    label: string | number | boolean;
    value: string | number | boolean;
}

export type FieldOptionInput = string | number | RawFieldOption;

export interface NormalizedFieldOption {
    label: string;
    value: string;
}

export interface RenderedField {
    id: number;
    code: string;
    label: string;
    type: FieldType;
    value: unknown;
    default_value: unknown;
    required: boolean;
    enabled: boolean;
    visible: boolean;
    placeholder?: string;
    help_text?: string;
    unit?: string;
    options?: FieldOptionInput[];
    depends_on_field_id?: number | null;
    depends_on_value?: unknown;
}

export interface RenderedSection {
    section_id: number;
    section_title: string;
    section_code: string;
    section_description?: string;
    fields: RenderedField[];
}

export interface Ticket {
    id: string;
    intervention_type?: string | { id: string };
}

export interface BaseFieldProps {
    field: RenderedField;
    isEditing: boolean;
    onChange: (fieldId: number, value: unknown) => void;
}