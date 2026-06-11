import { SectionModal } from './fieldDefinition/SectionModal';
import { FieldModal } from './fieldDefinition/FieldModal';

interface FieldDefinitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'section' | 'field';
    sectionId: string | number | null;
    interventionTypeId: string | number;
    formVersionId: string | number | null;
    fieldData: any;
    onSuccess: () => void;
}

export const FieldDefinitionModal = ({ mode, ...props }: FieldDefinitionModalProps) => {
    if (mode === 'section') {
        return <SectionModal {...props} />;
    }

    if (mode === 'field') {
        return <FieldModal {...props} />;
    }

    return null;
};