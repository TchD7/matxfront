import {
    Box, Flex, VStack, HStack, Button, Text, Input, Select, Switch,
    Heading, SimpleGrid, IconButton, useToast, Badge, Divider, Stack
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiCloudLightning } from 'react-icons/fi';
import api from '../../api/apiClient';

const FIELD_TYPES = [
    { value: "text", label: "Texte" },
    { value: "number", label: "Numérique" },
    { value: "checkbox", label: "Case à cocher" },
    { value: "date", label: "Date" },
    { value: "time", label: "Heure" },
    { value: "image", label: "Photo Appareil" },
    { value: "file", label: "Fichier / Doc" },
    { value: "signature", label: "Signature" },
    { value: "select", label: "Liste déroulante" },
];

export default function ResponsiveFieldDeployer() {
    const toast = useToast();
    const [interventionTypes, setInterventionTypes] = useState<any[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [fields, setFields] = useState<any[]>([]);
    const [isDeploying, setIsDeploying] = useState(false);

    useEffect(() => {
        api.get('/api/v1/intervention-types/').then(res => {
            const data = res.data.results || res.data;
            setInterventionTypes(data);
            if (data.length > 0) setSelectedTypeId(data[0].id);
        });
    }, []);

    useEffect(() => {
        if (!selectedTypeId) return;
        api.get(`/api/v1/field-definitions/?intervention_type=${selectedTypeId}`).then(res => {
            const sorted = (res.data.results || res.data).sort((a: any, b: any) => a.order - b.order);
            setFields(sorted);
        });
    }, [selectedTypeId]);

    const addFieldLocal = () => {
        const tempId = `temp-${Date.now()}`;
        setFields([...fields, {
            id: tempId,
            label: "",
            field_type: "text",
            required: false,
            code: `param_${Date.now().toString().slice(-4)}`
        }]);
    };

    const removeFieldLocal = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateFieldLocal = (id: string, key: string, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;

        const updatedFields = [...fields];
        const temp = updatedFields[index];
        updatedFields[index] = updatedFields[targetIndex];
        updatedFields[targetIndex] = temp;
        setFields(updatedFields);
    };

    const handleDeploy = async () => {
        try {
            setIsDeploying(true);
            await api.post('/api/v1/field-definitions/deploy/', {
                intervention_type_id: selectedTypeId,
                fields: fields
            });
            toast({ title: "Architecture déployée !", status: "success", duration: 3000 });
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Erreur de validation lors du déploiement";
            toast({ title: "Échec du déploiement", description: errorMsg, status: "error" });
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <SimpleGrid columns={{ base: 1, lg: 4 }} gap={6} p={{ base: 3, md: 5 }} width="100%">

            {/* PANNEAU : SÉLECTION DU TYPE D'INTERVENTION */}
            <Box bg="white" p={4} borderRadius="xl" boxShadow="sm" border="1px solid #eee" h="fit-content">
                <Heading size="xs" textTransform="uppercase" color="gray.400" mb={4}>
                    Types d'interventions
                </Heading>
                {/* Horizontal scroll sur mobile, Vertical liste sur PC */}
                <Stack
                    direction={{ base: "row", lg: "column" }}
                    spacing={2}
                    overflowX={{ base: "auto", lg: "visible" }}
                    whiteSpace={{ base: "nowrap", lg: "normal" }}
                    pb={{ base: 2, lg: 0 }}
                >
                    {interventionTypes.map(type => {
                        const isSelected = selectedTypeId === type.id;
                        return (
                            <Box
                                key={type.id} p={3} borderRadius="lg" cursor="pointer" inlineSize={{ base: "max-content", lg: "auto" }}
                                bg={isSelected ? "purple.50" : "transparent"}
                                color={isSelected ? "purple.700" : "gray.700"}
                                fontWeight={isSelected ? "bold" : "normal"}
                                _hover={{ bg: "gray.50" }}
                                onClick={() => setSelectedTypeId(type.id)}
                            >
                                {type.name}
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* ZONE DE TRAVAIL DES CHAMPS (WORKSPACE) */}
            <Box
                gridColumn={{ base: "span 1", lg: "span 3" }} // 👈 ICI : Force l'extension sur 3 colonnes
                bg="white"
                p={{ base: 4, md: 5 }}
                borderRadius="xl"
                boxShadow="sm"
                border="1px solid #eee"
                width="100%"
            >
                <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} gap={4} mb={6}>
                    <Box>
                        <Heading size="md">Champs de saisie mobiles</Heading>
                        <Text fontSize="xs" color="gray.500">
                            Configurez vos lignes de rapport, puis déployez en un clic sur le terrain.
                        </Text>
                    </Box>
                    <HStack spacing={2} width={{ base: "full", sm: "auto" }}>
                        <Button leftIcon={<FiPlus />} size="sm" colorScheme="purple" variant="outline" flex={{ base: 1, sm: "initial" }} onClick={addFieldLocal}>
                            Ajouter
                        </Button>
                        <Button
                            leftIcon={<FiCloudLightning />} size="sm" colorScheme="purple" flex={{ base: 1, sm: "initial" }}
                            isLoading={isDeploying} onClick={handleDeploy} isDisabled={fields.length === 0}
                        >
                            Déployer
                        </Button>
                    </HStack>
                </Flex>

                <Divider mb={4} />

                {/* CONTAINER RESPONSIVE DES CHAMPS */}
                <VStack spacing={4} align="stretch">
                    {fields.length === 0 && (
                        <Box py={10} textAlign="center" color="gray.400" border="2px dashed #eee" borderRadius="lg">
                            Aucun paramètre configuré. Cliquez sur "Ajouter".
                        </Box>
                    )}

                    {fields.map((field, index) => (
                        <Stack
                            key={field.id}
                            direction={{ base: "column", md: "row" }}
                            p={4}
                            bg="gray.50"
                            borderRadius="lg"
                            spacing={3}
                            align={{ base: "stretch", md: "center" }}
                            border={String(field.id).startsWith('temp-') ? "1px dashed #B794F4" : "1px solid #edf2f7"}
                            position="relative"
                        >
                            {/* Header de ligne : Badge et Actions rapides sur Mobile */}
                            <Flex justify="space-between" align="center" width={{ base: "full", md: "auto" }}>
                                <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                                    #{index + 1}
                                </Badge>

                                {/* Boutons de déplacement visibles à droite uniquement sur mobile dans ce bloc */}
                                <HStack spacing={1} display={{ base: "flex", md: "none" }}>
                                    <IconButton
                                        aria-label="Monter" size="xs" icon={<FiArrowUp />}
                                        isDisabled={index === 0} onClick={() => moveField(index, 'up')}
                                    />
                                    <IconButton
                                        aria-label="Descendre" size="xs" icon={<FiArrowDown />}
                                        isDisabled={index === fields.length - 1} onClick={() => moveField(index, 'down')}
                                    />
                                    <IconButton
                                        aria-label="Supprimer" size="xs" colorScheme="red" variant="ghost"
                                        icon={<FiTrash2 />} onClick={() => removeFieldLocal(field.id)}
                                    />
                                </HStack>
                            </Flex>

                            {/* Inputs Grid : S'adapte intelligemment selon la taille d'écran */}
                            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} flex={1}>
                                <Box>
                                    <Text display={{ base: "block", md: "none" }} fontSize="xs" fontWeight="bold" mb={1} color="gray.500">Intitulé du champ</Text>
                                    <Input
                                        size="sm" bg="white" placeholder="Ex: Température (°C)"
                                        value={field.label} onChange={(e) => updateFieldLocal(field.id, 'label', e.target.value)}
                                    />
                                </Box>

                                <Box>
                                    <Text display={{ base: "block", md: "none" }} fontSize="xs" fontWeight="bold" mb={1} color="gray.500">Code API Unique</Text>
                                    <Input
                                        size="sm" bg="white" placeholder="Ex: temp_calcul"
                                        value={field.code} onChange={(e) => updateFieldLocal(field.id, 'code', e.target.value)}
                                    />
                                </Box>

                                <Box>
                                    <Text display={{ base: "block", md: "none" }} fontSize="xs" fontWeight="bold" mb={1} color="gray.500">Type de donnée</Text>
                                    <Select
                                        size="sm" bg="white" value={field.field_type}
                                        onChange={(e) => updateFieldLocal(field.id, 'field_type', e.target.value)}
                                    >
                                        {FIELD_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </Select>
                                </Box>

                                {/* Switch obligatoire aligné proprement */}
                                <Flex align="center" justify={{ base: "space-between", md: "center" }} pt={{ base: 2, md: 0 }}>
                                    <Text fontSize="xs" fontWeight={{ base: "bold", md: "normal" }} color="gray.500">Obligatoire ?</Text>
                                    <Switch
                                        size="sm" ml={3} colorScheme="purple" isChecked={field.required}
                                        onChange={(e) => updateFieldLocal(field.id, 'required', e.target.checked)}
                                    />
                                </Flex>
                            </SimpleGrid>

                            {/* Actions de tri et suppression sur Écrans PC (Masqué sur Mobile) */}
                            <HStack spacing={1} display={{ base: "none", md: "flex" }}>
                                <IconButton
                                    aria-label="Monter" size="xs" icon={<FiArrowUp />}
                                    isDisabled={index === 0} onClick={() => moveField(index, 'up')}
                                />
                                <IconButton
                                    aria-label="Descendre" size="xs" icon={<FiArrowDown />}
                                    isDisabled={index === fields.length - 1} onClick={() => moveField(index, 'down')}
                                />
                                <IconButton
                                    aria-label="Supprimer" size="xs" colorScheme="red" variant="ghost"
                                    icon={<FiTrash2 />} onClick={() => removeFieldLocal(field.id)}
                                />
                            </HStack>

                        </Stack>
                    ))}
                </VStack>
            </Box>
        </SimpleGrid>
    );
}