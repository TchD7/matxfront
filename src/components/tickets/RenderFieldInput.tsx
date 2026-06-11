import {
    Box,
    Checkbox,
    CheckboxGroup,
    HStack,
    Input,
    Select,
    Textarea,
    SimpleGrid,
} from '@chakra-ui/react';
import type { RenderField } from '../../types/formRender.types';

interface RenderFieldInputProps {
    field: RenderField;
    value: any;
    onChange: (fieldId: string | number, value: any) => void;
}

export function RenderFieldInput({ field, value, onChange }: RenderFieldInputProps) {
    const handleChange = (nextValue: any) => {
        onChange(field.id, nextValue);
    };

    switch (field.type) {
        case 'text':
        case 'number':
        case 'date':
        case 'time':
        case 'datetime':
            return (
                <Input
                    bg="white"
                    type={field.type === 'number' ? 'number' : field.type === 'datetime' ? 'datetime-local' : field.type}
                    placeholder={field.placeholder || ''}
                    value={value ?? ''}
                    onChange={(e) => handleChange(e.target.value)}
                    size="sm"
                    borderRadius="md"
                />
            );
        case 'textarea':
            return (
                <Textarea
                    bg="white"
                    placeholder={field.placeholder || ''}
                    value={value ?? ''}
                    onChange={(e) => handleChange(e.target.value)}
                    size="sm"
                    borderRadius="md"
                    rows={4}
                />
            );
        case 'select':
            return (
                <Select
                    bg="white"
                    placeholder="Sélectionner une option"
                    value={value ?? ''}
                    onChange={(e) => handleChange(e.target.value)}
                    size="sm"
                    borderRadius="md"
                >
                    {(field.options || []).map((opt, index) => (
                        <option key={opt.id ?? index} value={opt.value ?? opt}>
                            {opt.label ?? opt.value ?? opt}
                        </option>
                    ))}
                </Select>
            );
        case 'multi_select':
            return (
                <CheckboxGroup
                    value={Array.isArray(value) ? value.map(String) : []}
                    onChange={(newValue) => handleChange(newValue)}
                >
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                        {(field.options || []).map((opt, index) => {
                            const optionValue = opt.value ?? opt;
                            return (
                                <Checkbox key={opt.id ?? index} value={String(optionValue)} colorScheme="purple" size="sm">
                                    {opt.label ?? optionValue}
                                </Checkbox>
                            );
                        })}
                    </SimpleGrid>
                </CheckboxGroup>
            );
        case 'checkbox':
            return (
                <Checkbox
                    isChecked={Boolean(value)}
                    onChange={(e) => handleChange(e.target.checked)}
                    colorScheme="purple"
                >
                    {field.label}
                </Checkbox>
            );
        default:
            return (
                <Input
                    bg="white"
                    placeholder={field.placeholder || ''}
                    value={value ?? ''}
                    onChange={(e) => handleChange(e.target.value)}
                    size="sm"
                    borderRadius="md"
                />
            );
    }
}
