export interface RenderFieldOption {
    id?: string | number;
    value: string;
    label: string;
    [key: string]: any;
}

export interface RenderField {
    id: string | number;
    code: string;
    label: string;
    type: string;
    placeholder?: string;
    unit?: string;
    options?: RenderFieldOption[];
    required: boolean;
    [key: string]: any;
}

export interface RenderSection {
    section_id: string | number;
    section_title: string;
    fields: RenderField[];
}

export interface TicketFieldValueRecord {
    id: string | number;
    ticket: string | number;
    field_definition: { id: string | number } | string | number;
    value: any;
}
