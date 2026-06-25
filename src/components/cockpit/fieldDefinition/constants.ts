// ============================================================
// TYPES
// ============================================================

export type ConditionOperator =
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "checked"
    | "in"
    | "not_in"
    | "is_empty"
    | "not_empty";

export type ConditionGroupOperator =
    | "AND"
    | "OR";

export type ConditionTrigger =
    | "visibility"
    | "required"
    | "enabled";

export type FieldType =
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "date"
    | "time"
    | "datetime"
    | "select"
    | "multi_select"
    | "radio"
    | "image"
    | "file"
    | "signature";


// ============================================================
// MODELS
// ============================================================

export interface Condition {
    field_definition: number;
    operator: ConditionOperator;
    value?: unknown;
}

export interface ConditionGroup {
    operator: ConditionGroupOperator;
    conditions: Condition[];
}


// ============================================================
// CONDITION GROUP OPERATORS
// ============================================================

export const CONDITION_GROUP_OPERATORS = [
    {
        value: "AND",
        label: "Toutes les conditions (ET)",
    },
    {
        value: "OR",
        label: "Au moins une condition (OU)",
    },
] as const;


// ============================================================
// CONDITION TRIGGERS
// ============================================================

export const CONDITION_TRIGGERS = [
    {
        value: "visibility",
        label: "Visibilité",
    },
    {
        value: "required",
        label: "Obligatoire",
    },
    {
        value: "enabled",
        label: "Activé",
    },
] as const;


// ============================================================
// OPERATORS
// ============================================================

export const CONDITION_OPERATORS = [
    {
        value: "eq",
        label: "Égal à (=)",
    },
    {
        value: "neq",
        label: "Différent de (!=)",
    },
    {
        value: "gt",
        label: "Supérieur à (>)",
    },
    {
        value: "gte",
        label: "Supérieur ou égal (>=)",
    },
    {
        value: "lt",
        label: "Inférieur à (<)",
    },
    {
        value: "lte",
        label: "Inférieur ou égal (<=)",
    },
    {
        value: "contains",
        label: "Contient",
    },
    {
        value: "checked",
        label: "Est coché",
    },
    {
        value: "in",
        label: "Dans la liste",
    },
    {
        value: "not_in",
        label: "Pas dans la liste",
    },
    {
        value: "is_empty",
        label: "Est vide",
    },
    {
        value: "not_empty",
        label: "N'est pas vide",
    },
] as const;


// ============================================================
// OPERATORS PAR TYPE DE CHAMP
// ============================================================

export const FIELD_OPERATORS: Record<
    FieldType,
    ConditionOperator[]
> = {
    text: [
        "eq",
        "neq",
        "contains",
        "is_empty",
        "not_empty",
    ],

    textarea: [
        "eq",
        "contains",
        "is_empty",
        "not_empty",
    ],

    number: [
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "is_empty",
        "not_empty",
    ],

    checkbox: [
        "eq",
        "checked",
    ],

    select: [
        "eq",
        "neq",
        "in",
        "not_in",
    ],

    multi_select: [
        "contains",
        "in",
        "not_in",
    ],

    radio: [
        "eq",
        "neq",
    ],

    date: [
        "eq",
        "gt",
        "gte",
        "lt",
        "lte",
    ],

    time: [
        "eq",
        "gt",
        "gte",
        "lt",
        "lte",
    ],

    datetime: [
        "eq",
        "gt",
        "gte",
        "lt",
        "lte",
    ],

    image: [
        "is_empty",
        "not_empty",
    ],

    file: [
        "is_empty",
        "not_empty",
    ],

    signature: [
        "is_empty",
        "not_empty",
    ],
};

export interface BuilderField {
    id: number;

    label: string;

    code: string;

    field_type: string;

    required: boolean;

    version: number;

    is_active: boolean;

    unit?: string;

    options?: string[];

    depends_on_field_id?: number | null;

    depends_on_value?: unknown;

    visibility_condition_group?: ConditionGroup | null;

    required_condition_group?: ConditionGroup | null;

    enabled_condition_group?: ConditionGroup | null;
}
// ============================================================
// TYPES DE CHAMPS
// ============================================================

export const FIELD_TYPE_OPTIONS = [
    {
        value: "text",
        label: "Texte court",
    },
    {
        value: "textarea",
        label: "Texte long",
    },
    {
        value: "number",
        label: "Nombre",
    },
    {
        value: "checkbox",
        label: "Case à cocher",
    },
    {
        value: "date",
        label: "Date",
    },
    {
        value: "time",
        label: "Heure",
    },
    {
        value: "datetime",
        label: "Date et heure",
    },
    {
        value: "select",
        label: "Liste déroulante",
    },
    {
        value: "multi_select",
        label: "Sélection multiple",
    },
    {
        value: "radio",
        label: "Boutons radio",
    },
    {
        value: "image",
        label: "Image / Photo",
    },
    {
        value: "file",
        label: "Fichier / Document",
    },
    {
        value: "signature",
        label: "Signature",
    },
] as const;

export interface BuilderSection {
    id: string | number;
    title: string;
    code?: string;
    description?: string;
    is_deployed?: boolean;
    visibility_condition_group?: ConditionGroup | null;
    fields?: BuilderField[];
    field_definitions?: BuilderField[]; // Alternative de l'API
}

