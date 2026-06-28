import React from 'react';
import { FormControl, FormHelperText, Checkbox } from '@chakra-ui/react';
import type { BaseFieldProps } from '../types/formDynamicTypes';

export const CheckboxField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled || !isEditing} pt={6}>
            <Checkbox
                isChecked={Boolean(field.value)}
                onChange={(e) => onChange(field.id, e.target.checked)}
                colorScheme="purple"
                aria-label={field.label}
            >
                {field.label}
            </Checkbox>
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
CheckboxField.displayName = 'CheckboxField';