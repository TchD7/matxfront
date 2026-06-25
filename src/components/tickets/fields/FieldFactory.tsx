import React from 'react';
import { BaseFieldProps } from '../types/formDynamicTypes';
import { TextField, TextAreaField } from './TextField';
import { NumberField } from './NumberField';
import { CheckboxField } from './CheckboxField';
import { DateField, TimeField, DateTimeField } from './DateField';
import { SelectField, MultiSelectField, RadioField } from './SelectField';
import { ImageField, FileField } from './ImageField';
import { SignatureField } from './SignatureField';

export const FieldFactory: React.FC<BaseFieldProps> = ({ field, isEditing, onChange }) => {
    // Si le champ n'est pas marqué comme visible par l'engine du backend, on l'exclut totalement du DOM
    if (!field.visible) return null;

    switch (field.type) {
        case 'text':
            return <TextField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'textarea':
            return <TextAreaField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'number':
            return <NumberField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'checkbox':
            return <CheckboxField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'date':
            return <DateField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'time':
            return <TimeField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'datetime':
            return <DateTimeField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'select':
            return <SelectField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'multi_select':
            return <MultiSelectField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'radio':
            return <RadioField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'image':
            return <ImageField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'file':
            return <FileField field={field} isEditing={isEditing} onChange={onChange} />;
        case 'signature':
            return <SignatureField field={field} isEditing={isEditing} onChange={onChange} />;
        default:
            return null;
    }
};