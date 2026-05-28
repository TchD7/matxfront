import type { FieldTypes } from './types';

export const FIELD_TYPES: FieldTypes[] = [
    { value: 'text', label: 'Texte' },
    { value: 'textarea', label: 'Zone de texte' },
    { value: 'number', label: 'Numérique' },
    { value: 'checkbox', label: 'Case à cocher' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Heure' },
    { value: 'datetime', label: 'Date & Heure' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'multi_select', label: 'Sélection multiple' },
    { value: 'radio', label: 'Bouton radio' },
    { value: 'image', label: 'Photo' },
    { value: 'file', label: 'Document' },
    { value: 'signature', label: 'Signature' },
];