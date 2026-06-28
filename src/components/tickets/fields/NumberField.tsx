import React from 'react';
import { FormControl, FormLabel, FormHelperText, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';

export const NumberField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(field.id, val === '' ? null : Number(val));
    };

    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <InputGroup>
                <Input
                    type="number"
                    value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                    placeholder={field.placeholder}
                    isReadOnly={!isEditing}
                    onChange={handleNumberChange}
                    aria-label={field.label}
                    bg={isEditing ? 'white' : 'gray.50'}
                />
                {field.unit && (
                    <InputRightElement bg="gray.100" borderLeft="1px solid" borderColor="gray.200" borderRightRadius="md" px={3} w="auto">
                        <span style={{ fontSize: '0.85rem', color: '#4A5568', fontWeight: 600 }}>{field.unit}</span>
                    </InputRightElement>
                )}
            </InputGroup>
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
NumberField.displayName = 'NumberField';