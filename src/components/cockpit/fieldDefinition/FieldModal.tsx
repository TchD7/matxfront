import { useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Button, FormControl, FormLabel, Input, Select, Switch,
    VStack, HStack, Box, useToast, IconButton
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../../api/apiClient';
import { CONDITION_OPERATORS, FIELD_TYPE_OPTIONS } from './constants';

export const FieldModal = ({
    isOpen, onClose, sectionId, fieldData, onSuccess
}: any) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // 🧩 Field States
    const [label, setLabel] = useState('');
    const [fieldCode, setFieldCode] = useState('');
    const [type, setType] = useState('text');
    const [required, setRequired] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [unit, setUnit] = useState('');
    const [options, setOptions] = useState<any[]>([]);

    // 🧠 Field Condition States
    const [hasFieldCondition, setHasFieldCondition] = useState(false);
    const [fieldCondition, setFieldCondition] = useState<{ operator: string; conditions: any[] }>({
        operator: 'AND', conditions: []
    });

    useEffect(() => {
        if (!isOpen) return;

        if (fieldData) {
            setLabel(fieldData.label || '');
            setFieldCode(fieldData.code || '');
            setType(fieldData.field_type || 'text');
            setRequired(!!fieldData.required);
            setPlaceholder(fieldData.placeholder || '');
            setUnit(fieldData.unit || '');
            setOptions(Array.isArray(fieldData.options) ? fieldData.options : []);

            if (fieldData?.condition_group_data) {
                setHasFieldCondition(true);
                setFieldCondition({
                    operator: fieldData.condition_group_data.operator || 'AND',
                    conditions: fieldData.condition_group_data.conditions || []
                });
            } else {
                setHasFieldCondition(false);
                setFieldCondition({ operator: 'AND', conditions: [] });
            }
        } else {
            setLabel('');
            setFieldCode('');
            setType('text');
            setRequired(false);
            setPlaceholder('');
            setUnit('');
            setOptions([]);
            setHasFieldCondition(false);
            setFieldCondition({ operator: 'AND', conditions: [] });
        }
    }, [isOpen, fieldData]);

    const handleSubmit = async () => {
        if (hasFieldCondition && (!fieldCondition?.conditions?.length || fieldCondition.conditions.some((c: any) => !c.field_definition))) {
            toast({ title: 'Condition invalide', description: 'Remplis toutes les conditions ou désactive la logique.', status: 'warning' });
            return;
        }

        if (['select', 'multi_select', 'radio'].includes(type) && options.length === 0) {
            toast({ title: 'Options manquantes', description: 'Ajoutez au moins une option pour ce type de champ', status: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                section: sectionId,
                label,
                code: fieldCode,
                field_type: type,
                required,
                placeholder,
                unit,
                options: ['select', 'multi_select', 'radio'].includes(type) ? options : [],
                condition_group_data: hasFieldCondition ? fieldCondition : null
            };

            if (fieldData?.id) {
                await api.put(`/api/v1/field-definitions/${fieldData.id}/`, payload);
            } else {
                await api.post('/api/v1/field-definitions/', payload);
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur lors de la sauvegarde du champ', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{fieldData ? 'Modifier le champ' : 'Nouveau champ'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <HStack spacing={4} align="start">
                            <FormControl isRequired flex={2}>
                                <FormLabel>Libellé du champ</FormLabel>
                                <Input value={label} onChange={(e) => {
                                    setLabel(e.target.value);
                                    if (!fieldData) {
                                        setFieldCode(e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                                    }
                                }} placeholder="Ex: Température ambiante" />
                            </FormControl>
                            <FormControl isRequired flex={1}>
                                <FormLabel>Code technique</FormLabel>
                                <Input value={fieldCode} onChange={(e) => setFieldCode(e.target.value)} isReadOnly={!!fieldData} bg={fieldData ? "gray.50" : "white"} />
                            </FormControl>
                        </HStack>

                        <HStack spacing={4} align="start">
                            <FormControl isRequired flex={2}>
                                <FormLabel>Type de donnée</FormLabel>
                                <Select value={type} onChange={(e) => setType(e.target.value)}>
                                    {FIELD_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl flex={1}>
                                <FormLabel>Unité</FormLabel>
                                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: °C, kg" />
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <FormLabel>Placeholder</FormLabel>
                            <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Texte d'exemple..." />
                        </FormControl>

                        {/* Options de choix dynamique */}
                        {['select', 'multi_select', 'radio'].includes(type) && (
                            <Box border="1px solid" borderColor="gray.200" p={4} borderRadius="md" bg="gray.50">
                                <FormLabel fontWeight="bold">Options de choix</FormLabel>
                                <VStack spacing={2} align="stretch">
                                    {options.map((opt, index) => (
                                        <HStack key={index}>
                                            <Input size="sm" bg="white" placeholder="Label de l'option" value={opt.label || ''} onChange={(e) => {
                                                const updated = [...options];
                                                updated[index] = {
                                                    label: e.target.value,
                                                    value: e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_')
                                                };
                                                setOptions(updated);
                                            }} />
                                            <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" onClick={() => setOptions(options.filter((_, i) => i !== index))} />
                                        </HStack>
                                    ))}
                                    <Button size="sm" leftIcon={<FiPlus />} onClick={() => setOptions([...options, { label: '', value: '' }])} alignSelf="flex-start">Ajouter une option</Button>
                                </VStack>
                            </Box>
                        )}

                        <FormControl display="flex" alignItems="center" justifyContent="space-between" borderTop="1px solid" borderColor="gray.100" pt={4}>
                            <FormLabel mb={0} fontWeight="bold">Ce champ est obligatoire</FormLabel>
                            <Switch isChecked={required} onChange={(e) => setRequired(e.target.checked)} colorScheme="purple" />
                        </FormControl>

                        {/* Moteur de conditions évolué pour le champ */}
                        <Box border="1px dashed" borderColor={hasFieldCondition ? "purple.300" : "gray.300"} p={4} borderRadius="md" bg={hasFieldCondition ? "purple.50" : "transparent"}>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={hasFieldCondition ? 4 : 0}>
                                <FormLabel mb={0} fontWeight="bold" color={hasFieldCondition ? "purple.700" : "gray.700"}>Logique conditionnelle (Visibilité du Champ)</FormLabel>
                                <Switch isChecked={hasFieldCondition} onChange={(e) => setHasFieldCondition(e.target.checked)} colorScheme="purple" />
                            </FormControl>

                            {hasFieldCondition && (
                                <VStack spacing={3} align="stretch">
                                    {fieldCondition.conditions.map((cond: any, index: number) => (
                                        <HStack key={index} spacing={2}>
                                            <Input size="sm" bg="white" placeholder="Code du champ cible" value={cond.field_definition} onChange={(e) => {
                                                const updated = [...fieldCondition.conditions];
                                                updated[index].field_definition = e.target.value;
                                                setFieldCondition({ ...fieldCondition, conditions: updated });
                                            }} />
                                            <Select size="sm" bg="white" value={cond.operator} onChange={(e) => {
                                                const updated = [...fieldCondition.conditions];
                                                updated[index].operator = e.target.value;
                                                setFieldCondition({ ...fieldCondition, conditions: updated });
                                            }}>
                                                {CONDITION_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </Select>
                                            {!['is_empty', 'not_empty'].includes(cond.operator) && (
                                                <Input size="sm" bg="white" placeholder="Valeur attendue" value={cond.value} onChange={(e) => {
                                                    const updated = [...fieldCondition.conditions];
                                                    updated[index].value = e.target.value;
                                                    setFieldCondition({ ...fieldCondition, conditions: updated });
                                                }} />
                                            )}
                                            <IconButton aria-label="Supprimer" icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" onClick={() => setFieldCondition({ ...fieldCondition, conditions: fieldCondition.conditions.filter((_, i) => i !== index) })} />
                                        </HStack>
                                    ))}
                                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="purple" variant="outline" onClick={() => setFieldCondition(prev => ({ ...prev, conditions: [...(prev?.conditions || []), { field_definition: '', operator: 'eq', value: '' }] }))} alignSelf="flex-start">Ajouter une condition</Button>
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px solid" borderColor="gray.100">
                    <Button variant="ghost" onClick={onClose} mr={3}>Annuler</Button>
                    <Button colorScheme="purple" onClick={handleSubmit} isLoading={loading}>Sauvegarder</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};