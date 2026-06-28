import React, { useMemo } from 'react';
import {
    FormControl,
    FormLabel,
    FormHelperText,
    Text,
    Wrap,
    Tag,
} from '@chakra-ui/react';
import ReactSelect from 'react-select';
import type { BaseFieldProps } from '../types/formDynamicTypes';
import { normalizeOptions } from '../types/formDynamicUtils';

export const MultiSelectField: React.FC<BaseFieldProps> = React.memo(
    ({ field, isEditing, onChange }) => {

        const options = normalizeOptions(field.options);

        const selectOptions = useMemo(
            () => options.map(o => ({ label: o.label, value: o.value })),
            [options]
        );

        const valueArray: string[] = Array.isArray(field.value)
            ? (field.value as string[])
            : [];

        const selected = selectOptions.filter(opt =>
            valueArray.includes(opt.value)
        );

        return (
            <FormControl isRequired={field.required} isDisabled={!field.enabled}>
                <FormLabel>{field.label}</FormLabel>

                {/* READ MODE */}
                {!isEditing ? (
                    <Wrap spacing={2}>
                        {selected.length > 0 ? (
                            selected.map(opt => (
                                <Tag key={opt.value} colorScheme="purple">
                                    {opt.label}
                                </Tag>
                            ))
                        ) : (
                            <Text color="gray.400">-</Text>
                        )}
                    </Wrap>
                ) : (
                    <ReactSelect
                        isMulti
                        options={selectOptions}
                        value={selected}
                        onChange={(vals) =>
                            onChange(field.id, vals.map(v => v.value))
                        }
                    />
                )}

                {field.help_text && (
                    <FormHelperText>{field.help_text}</FormHelperText>
                )}
            </FormControl>
        );
    });