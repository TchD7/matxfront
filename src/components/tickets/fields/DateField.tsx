import React from 'react';
import { FormControl, FormLabel, FormHelperText, Input } from '@chakra-ui/react';
import type{ BaseFieldProps } from '../types/formDynamicTypes';

const createTemporalField = (type: 'date' | 'time' | 'datetime-local', displayName: string) => {
    const Component: React.FC<BaseFieldProps> = ({ field, isEditing, onChange }) => (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <Input
                type={type}
                value={(field.value as string) ?? ''}
                isReadOnly={!isEditing}
                onChange={(e) => onChange(field.id, e.target.value)}
                aria-label={field.label}
                bg={isEditing ? 'white' : 'gray.50'}
            />
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
    Component.displayName = displayName;
    return React.memo(Component);
};

export const DateField = createTemporalField('date', 'DateField');
export const TimeField = createTemporalField('time', 'TimeField');
export const DateTimeField = createTemporalField('datetime-local', 'DateTimeField');