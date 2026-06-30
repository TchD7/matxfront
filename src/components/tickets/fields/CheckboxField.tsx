import React from 'react';
import { Checkbox, FormControl, FormLabel, Badge, Box } from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';

export const CheckboxField: React.FC<BaseFieldProps> = ({ field, isEditing, onChange }) => {
    // On s'assure que la valeur est bien un booléen
    const isChecked = !!field.value;

    // MODE LECTURE SEULE
    if (!isEditing) {
        return (
            <Box>
                <FormLabel mb={1} color="gray.600" fontSize="sm" fontWeight="normal">
                    {field.label}
                </FormLabel>
                <Badge
                    colorScheme={isChecked ? 'green' : 'gray'}
                    fontSize="sm"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                >
                    {isChecked ? 'Oui' : 'Non'}
                </Badge>
            </Box>
        );
    }

    // MODE ÉDITION
    return (
        <FormControl display="flex" alignItems="center">
            <Checkbox
                isChecked={isChecked}
                onChange={(e) => onChange(field.id, e.target.checked)}
                colorScheme="purple"
            >
                {field.label}
            </Checkbox>
        </FormControl>
    );
};