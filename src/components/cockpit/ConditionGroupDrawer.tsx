import {
    Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
    VStack, HStack, Box, Text, Select, Input, Button, IconButton, useToast, Divider, Badge
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiAlertCircle } from 'react-icons/fi';
import api from '../../api/apiClient';

interface ConditionGroupDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    fieldId: number | string | null;
    fieldLabel: string;
    availableFields: any[]; // Tous les autres champs de la section pour servir de dépendance
}

export default function ConditionGroupDrawer({
    isOpen,
    onClose,
    fieldId,
    fieldLabel,
    availableFields
}: ConditionGroupDrawerProps) {
    const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
    const [conditions, setConditions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Charger les conditions existantes à l'ouverture pour le fieldId
    useEffect(() => {
        if (isOpen && fieldId) {
            setIsLoading(true);
            api.get(`/api/v1/condition-groups/?target_field=${fieldId}`)
                .then((res) => {
                    const group = res.data.results?.[0] || res.data?.[0];
                    if (group) {
                        setOperator(group.operator || 'AND');
                        setConditions(group.conditions || []);
                    } else {
                        setOperator('AND');
                        setConditions([]);
                    }
                })
                .catch(() => console.error("Aucune règle préexistante trouvée"))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, fieldId]);

    const addConditionRow = () => {
        setConditions([...conditions, { depend_on_field: '', operator: 'EQUALS', value: '' }]);
    };

    const removeConditionRow = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateConditionRow = (index: number, key: string, value: string) => {
        setConditions(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c));
    };

    const handleSaveRules = async () => {
        if (!fieldId) return;
        setIsLoading(true);

        const payload = {
            target_field: fieldId,
            operator: operator,
            conditions: conditions.filter(c => c.depend_on_field && c.value) // Nettoyage à l'envoi
        };

        try {
            await api.post(`/api/v1/condition-groups/save_rules/`, payload);
            toast({ title: "Règles de visibilité enregistrées", status: "success" });
            onClose();
        } catch {
            toast({ title: "Erreur à la sauvegarde des règles", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px" bg="gray.50">
                    <Text fontSize="md" fontWeight="bold">Règles d'affichage conditionnel</Text>
                    <Text fontSize="xs" color="purple.600" mt={1}>Champ cible : {fieldLabel}</Text>
                </DrawerHeader>

                <DrawerBody py={6}>
                    <VStack spacing={5} align="stretch">
                        {/* Alerte Explicative */}
                        <HStack p={3} bg="blue.50" borderRadius="lg" color="blue.700" spacing={3} align="start">
                            <Icon as={FiAlertCircle} mt={1} />
                            <Text fontSize="xs">
                                Définissez quand ce champ doit être affiché sur le terminal mobile du technicien. Si aucune règle n'est définie, le champ sera toujours visible.
                            </Text>
                        </HStack>

                        {/* Choix de l'opérateur global du groupe */}
                        <HStack justify="space-between" bg="gray.50" p={3} borderRadius="lg">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                Combiner les conditions avec :
                            </Text>
                            <HStack spacing={2}>
                                <Button
                                    size="xs"
                                    colorScheme={operator === 'AND' ? 'purple' : 'gray'}
                                    onClick={() => setOperator('AND')}
                                >
                                    ET (Toutes)
                                </Button>
                                <Button
                                    size="xs"
                                    colorScheme={operator === 'OR' ? 'purple' : 'gray'}
                                    onClick={() => setOperator('OR')}
                                >
                                    OU (Au moins une)
                                </Button>
                            </HStack>
                        </HStack>

                        <Divider />

                        {/* Liste des lignes de conditions */}
                        <VStack spacing={3} align="stretch">
                            {conditions.map((cond, index) => (
                                <HStack key={index} spacing={2} alignItems="center">
                                    {/* Champ dépendant */}
                                    <Select
                                        size="sm"
                                        placeholder="Si le champ..."
                                        value={cond.depend_on_field}
                                        onChange={(e) => updateConditionRow(index, 'depend_on_field', e.target.value)}
                                    >
                                        {availableFields
                                            .filter(f => f.id !== fieldId) // Ne pas dépendre de soi-même
                                            .map(f => (
                                                <option key={f.id} value={f.id}>{f.label}</option>
                                            ))
                                        }
                                    </Select>

                                    {/* Opérateur logique du champ */}
                                    <Select
                                        size="sm"
                                        w="140px"
                                        value={cond.operator}
                                        onChange={(e) => updateConditionRow(index, 'operator', e.target.value)}
                                    >
                                        <option value="EQUALS">égal à</option>
                                        <option value="NOT_EQUALS">différent de</option>
                                        <option value="GREATER_THAN">supérieur à</option>
                                        <option value="LESS_THAN">inférieur à</option>
                                        <option value="CONTAINS">contient</option>
                                    </Select>

                                    {/* Valeur attendue */}
                                    <Input
                                        size="sm"
                                        placeholder="Valeur"
                                        value={cond.value}
                                        onChange={(e) => updateConditionRow(index, 'value', e.target.value)}
                                    />

                                    {/* Suppression de la condition */}
                                    <IconButton
                                        aria-label="Supprimer la règle"
                                        icon={<FiTrash2 />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => removeConditionRow(index)}
                                    />
                                </HStack>
                            ))}

                            <Button
                                leftIcon={<FiPlus />}
                                variant="dashed"
                                colorScheme="purple"
                                size="sm"
                                mt={2}
                                onClick={addConditionRow}
                            >
                                Ajouter une condition
                            </Button>
                        </VStack>

                        <Divider mt={4} />

                        {/* Actions de sauvegarde du tiroir */}
                        <HStack spacing={3} justify="flex-end" mt={4}>
                            <Button variant="outline" size="sm" onClick={onClose} isDisabled={isLoading}>
                                Annuler
                            </Button>
                            <Button
                                leftIcon={<FiSave />}
                                colorScheme="purple"
                                size="sm"
                                onClick={handleSaveRules}
                                isLoading={isLoading}
                            >
                                Enregistrer les règles
                            </Button>
                        </HStack>
                    </VStack>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}