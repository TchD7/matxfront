export interface FieldTypes {
    value: string;
    label: string;
}

export interface InterventionType {
    id: string | number;
    name: string;
}

export interface FieldOption {
    id: string;
    value: string;
    label: string;
}

export interface FieldDefinition {
    id: string | number;
    label: string;
    field_type: string;
    required: boolean;
    code: string;
    order?: number;
    options?: FieldOption[];
    depends_on_field_id?: string | number | null;
    depends_on_value?: string | null;
}

export interface Section {
    id: string | number;
    title: string;
    fields: FieldDefinition[];
}