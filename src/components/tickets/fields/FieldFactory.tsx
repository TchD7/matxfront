import React from 'react';
import { Box } from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';

// Importations regroupées
import { TextField, TextAreaField } from './TextField';
import { NumberField } from './NumberField';
import { CheckboxField } from './CheckboxField';
import { DateField, TimeField, DateTimeField } from './DateField';
import { SelectField } from './SelectField';
import { MultiSelectField } from './MultiSelectField';
import { RadioField } from './RadioField';
import { ImageField } from './ImageField';
import { FileField } from './FileField';
import { SignatureField } from './SignatureField';

// Mapping des composants pour éviter le switch géant
const FIELD_MAP: Record<string, React.FC<BaseFieldProps>> = {
    text: TextField,
    textarea: TextAreaField,
    number: NumberField,
    checkbox: CheckboxField,
    date: DateField,
    time: TimeField,
    datetime: DateTimeField,
    select: SelectField,
    multi_select: MultiSelectField,
    radio: RadioField,
    image: ImageField,
    file: FileField,
    signature: SignatureField,
};

export const FieldFactory: React.FC<BaseFieldProps> = ({ field, isEditing, onChange }) => {
    if (!field.visible) return null;

    const FieldComponent = FIELD_MAP[field.type];

    // Rendu du composant trouvé ou message d'erreur
    const component = FieldComponent ? (
        <FieldComponent field={field} isEditing={isEditing} onChange={onChange} />
    ) : (
        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="red.200" bg="red.50">
            Type de champ inconnu : <b>{field.type}</b>
        </Box>
    );

    // Conteneur spécifique pour les médias en lecture seule
    const isMediaField = ['image', 'file', 'signature'].includes(field.type);

    if (!isEditing && isMediaField) {
        return (
            <Box
                w="100%"
                p={2}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.200"
                borderRadius="lg"
                bg="gray.50"
            >
                {component}
            </Box>
        );
    }

    return component;
};