import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Switch,
    Button,
    VStack,
    useToast,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import api from '../../api/apiClient';

interface InterventionType {
    id?: number | string;
    name: string;
    description?: string;
    is_active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    interventionType?: InterventionType | null;
    onSuccess: () => void;
}

export default function InterventionTypeModal({
    isOpen,
    onClose,
    interventionType,
    onSuccess,
}: Props) {

    const toast = useToast();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<InterventionType>({
        name: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {

        if (interventionType) {
            setForm({
                name: interventionType.name,
                description: interventionType.description || '',
                is_active: interventionType.is_active,
            });
        } else {
            setForm({
                name: '',
                description: '',
                is_active: true,
            });
        }

    }, [interventionType, isOpen]);

    const handleChange = (
        field: keyof InterventionType,
        value: any
    ) => {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {

        try {

            setLoading(true);

            if (!form.name.trim()) {
                toast({
                    title: 'Nom obligatoire',
                    status: 'warning',
                });
                return;
            }

            if (interventionType?.id) {

                await api.put(
                    `/api/v1/intervention-types/${interventionType.id}/`,
                    form
                );

                toast({
                    title: 'Type modifié',
                    status: 'success',
                });

            } else {

                await api.post(
                    '/api/v1/intervention-types/',
                    form
                );

                toast({
                    title: 'Type créé',
                    status: 'success',
                });
            }

            onSuccess();
            onClose();

        } catch (error: any) {

            toast({
                title: 'Erreur',
                description:
                    error?.response?.data?.detail ||
                    'Impossible d\'enregistrer',
                status: 'error',
            });

        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
        >
            <ModalOverlay />

            <ModalContent>

                <ModalHeader>
                    {interventionType
                        ? 'Modifier le type'
                        : 'Nouveau type'}
                </ModalHeader>

                <ModalCloseButton />

                <ModalBody>

                    <VStack spacing={4}>

                        <FormControl isRequired>
                            <FormLabel>
                                Nom
                            </FormLabel>

                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    handleChange(
                                        'name',
                                        e.target.value
                                    )
                                }
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>
                                Description
                            </FormLabel>

                            <Textarea
                                rows={4}
                                value={form.description}
                                onChange={(e) =>
                                    handleChange(
                                        'description',
                                        e.target.value
                                    )
                                }
                            />
                        </FormControl>

                        <FormControl
                            display="flex"
                            alignItems="center"
                        >
                            <FormLabel
                                mb="0"
                                flex={1}
                            >
                                Actif
                            </FormLabel>

                            <Switch
                                isChecked={form.is_active}
                                onChange={(e) =>
                                    handleChange(
                                        'is_active',
                                        e.target.checked
                                    )
                                }
                            />
                        </FormControl>

                    </VStack>

                </ModalBody>

                <ModalFooter>

                    <Button
                        mr={3}
                        variant="ghost"
                        onClick={onClose}
                    >
                        Annuler
                    </Button>

                    <Button
                        colorScheme="purple"
                        onClick={handleSubmit}
                        isLoading={loading}
                    >
                        {interventionType
                            ? 'Mettre à jour'
                            : 'Créer'}
                    </Button>

                </ModalFooter>

            </ModalContent>
        </Modal>
    );
}