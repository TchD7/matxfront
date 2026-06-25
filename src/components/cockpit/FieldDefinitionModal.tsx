import { SectionModal } from './fieldDefinition/SectionModal';
import { FieldModal } from './fieldDefinition/FieldModal';

import type { BuilderField } from './fieldDefinition/constants';

interface FieldDefinitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'section' | 'field';
    sectionId: string | number | null;
    interventionTypeId: string | number;
    formVersionId: string | number | null;
    fieldData: any;
    availableFields?: BuilderField[];
    onSuccess: () => void;
}

export const FieldDefinitionModal = ({
    mode,
    availableFields = [],
    ...props
}: FieldDefinitionModalProps) => {
    switch (mode) {
        case 'section':
            return (
                <SectionModal
                    {...props}
                />
            );

        case 'field':
            return (
                <FieldModal
                    {...props}
                    availableFields={availableFields}
                />
            );

        default:
            return null;
    }
};