import React from 'react';
import { FormControl, FormLabel, FormHelperText, Input, Textarea } from '@chakra-ui/react';
import { BaseFieldProps } from '../types/formDynamicTypes';

export const TextField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <Input
                type="text"
                value={(field.value as string) ?? ''}
                placeholder={field.placeholder}
                isReadOnly={!isEditing}
                onChange={(e) => onChange(field.id, e.target.value)}
                aria-label={field.label}
                bg={isEditing ? 'white' : 'gray.50'}
            />
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
TextField.displayName = 'TextField';

export const TextAreaField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <Textarea
                value={(field.value as string) ?? ''}
                placeholder={field.placeholder}
                isReadOnly={!isEditing}
                onChange={(e) => onChange(field.id, e.target.value)}
                aria-label={field.label}
                bg={isEditing ? 'white' : 'gray.50'}
                rows={3}
            />
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
TextAreaField.displayName = 'TextAreaField';