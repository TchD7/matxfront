import type { FieldOptionInput, NormalizedFieldOption } from './formDynamicTypes';

export const normalizeOptions = (options?: FieldOptionInput[]): NormalizedFieldOption[] => {
    if (!options) return [];
    return options.map((option) => {
        if (typeof option === 'object' && option !== null) {
            return {
                label: String(option.label),
                value: String(option.value),
            };
        }
        return {
            label: String(option),
            value: String(option),
        };
    });
};