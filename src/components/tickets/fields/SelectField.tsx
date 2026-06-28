import React, { useMemo } from 'react';
import {
    FormControl,
    FormLabel,
    FormHelperText,
    Select,
    Text,
} from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';
import { normalizeOptions } from '../types/formDynamicUtils';

export const SelectField: React.FC<BaseFieldProps> = React.memo(
    ({ field, isEditing, onChange }) => {

        const options = normalizeOptions(field.options);

        const labelMap = useMemo(() => {
            const map = new Map<string, string>();
            options.forEach(o => map.set(o.value, o.label));
            return map;
        }, [options]);

        const value = (field.value ?? '') as string;

        return (
            <FormControl isRequired={field.required} isDisabled={!field.enabled}>
                <FormLabel>{field.label}</FormLabel>

                {/* READ MODE */}
                {!isEditing ? (
                    <Text color="gray.800" fontWeight="medium">
                        {labelMap.get(value) ?? value ?? '-'}
                    </Text>
                ) : (
                    <Select
                        value={value}
                        placeholder={field.placeholder || 'Sélectionner...'}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        bg="white"
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </Select>
                )}

                {field.help_text && (
                    <FormHelperText>{field.help_text}</FormHelperText>
                )}
            </FormControl>
        );
    });