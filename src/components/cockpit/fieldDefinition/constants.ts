export const CONDITION_OPERATORS = [
    { value: 'eq', label: 'Égal à (=)' },
    { value: 'neq', label: 'Différent de (!=)' },
    { value: 'gt', label: 'Supérieur à (>)' },
    { value: 'gte', label: 'Supérieur ou égal (>=)' },
    { value: 'lt', label: 'Inférieur à (<)' },
    { value: 'lte', label: 'Inférieur ou égal (<=)' },
    { value: 'contains', label: 'Contient' },
    { value: 'checked', label: 'Coché (checked)' },
    { value: 'in', label: 'Dans la liste (in)' },
    { value: 'not_in', label: 'Pas dans la liste (not in)' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'not_empty', label: "N'est pas vide" }
];

export const FIELD_TYPE_OPTIONS = [
    { value: "text", label: "Texte court" },
    { value: "textarea", label: "Texte long" },
    { value: "number", label: "Nombre" },
    { value: "checkbox", label: "Case à cocher" },
    { value: "date", label: "Date" },
    { value: "time", label: "Heure" },
    { value: "datetime", label: "Date et Heure" },
    { value: "select", label: "Liste déroulante" },
    { value: "multi_select", label: "Sélection multiple" },
    { value: "radio", label: "Bouton radio" },
    { value: "image", label: "Image / Photo" },
    { value: "file", label: "Fichier / Document" },
    { value: "signature", label: "Signature" },
];