import React from 'react';
import {
    FormControl,
    FormLabel,
    FormHelperText,
    RadioGroup,
    Radio,
    Stack,
    Text,
} from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';
import { normalizeOptions } from '../types/formDynamicUtils';

export const RadioField: React.FC<BaseFieldProps> = React.memo(
    ({ field, isEditing, onChange }) => {

        const options = normalizeOptions(field.options);

        const labelMap = new Map(
            options.map(o => [o.value, o.label])
        );

        const value = (field.value ?? '') as string;

        return (
            <FormControl isRequired={field.required} isDisabled={!field.enabled}>
                <FormLabel>{field.label}</FormLabel>

                {/* READ MODE */}
                {!isEditing ? (
                    <Text fontWeight="medium">
                        {labelMap.get(value) ?? '-'}
                    </Text>
                ) : (
                    <RadioGroup
                        value={value}
                        onChange={(val) => onChange(field.id, val)}
                    >
                        <Stack direction="row">
                            {options.map(opt => (
                                <Radio key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Radio>
                            ))}
                        </Stack>
                    </RadioGroup>
                )}

                {field.help_text && (
                    <FormHelperText>{field.help_text}</FormHelperText>
                )}
            </FormControl>
        );
    });