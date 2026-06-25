import React from 'react';
import { FormControl, FormLabel, FormHelperText, Select, RadioGroup, Radio, Stack } from '@chakra-ui/react';
import ReactSelect, { MultiValue } from 'react-select';
import { BaseFieldProps } from '../types/formDynamicTypes';
import { normalizeOptions } from '../types/formDynamicUtils';

export const SelectField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const options = normalizeOptions(field.options);
    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <Select
                value={(field.value as string) ?? ''}
                placeholder={field.placeholder || 'Sélectionner une option'}
                isDisabled={!isEditing}
                onChange={(e) => onChange(field.id, e.target.value)}
                aria-label={field.label}
                bg={isEditing ? 'white' : 'gray.50'}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
SelectField.displayName = 'SelectField';

export const MultiSelectField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const options = normalizeOptions(field.options);

    const selectOptions = options.map(opt => ({ label: opt.label, value: opt.value }));
    const currentValue = Array.isArray(field.value)
        ? selectOptions.filter(opt => (field.value as string[]).includes(opt.value))
        : [];

    const handleSelectChange = (newValue: MultiValue<{ label: string, value: string }>) => {
        onChange(field.id, newValue.map(v => v.value));
    };

    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <ReactSelect
                isMulti
                options={selectOptions}
                value={currentValue}
                isDisabled={!isEditing || !field.enabled}
                onChange={handleSelectChange}
                placeholder={field.placeholder || 'Sélectionner plusieurs options...'}
                aria-label={field.label}
                styles={{
                    control: (base) => ({
                        ...base,
                        backgroundColor: isEditing ? 'white' : '#F7FAFC',
                        borderColor: '#E2E8F0',
                    })
                }}
            />
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
MultiSelectField.displayName = 'MultiSelectField';

export const RadioField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const options = normalizeOptions(field.options);
    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>
            <RadioGroup
                value={(field.value as string) ?? ''}
                onChange={(val) => onChange(field.id, val)}
                isDisabled={!isEditing}
            >
                <Stack direction="row" spacing={4}>
                    {options.map((opt) => (
                        <Radio key={opt.value} value={opt.value} colorScheme="purple">
                            {opt.label}
                        </Radio>
                    ))}
                </Stack>
            </RadioGroup>
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
RadioField.displayName = 'RadioField';