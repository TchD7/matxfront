import { memo } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Switch,
    IconButton,
    Flex,
    Divider
} from '@chakra-ui/react';

import {
    FiArrowUp,
    FiArrowDown,
    FiTrash2,
    FiEdit2,
    FiLock,
    FiUnlock
} from 'react-icons/fi';

import type { FieldDefinition } from './fieldDefinition/types';

interface Props {
    fields: FieldDefinition[];
    sectionId: string | number;
    isSectionDeployed?: boolean; // Reçu du parent (vrai si lié à une version publiée)

    onUpdateField: (
        fieldId: string | number,
        key: keyof FieldDefinition,
        value: any
    ) => void;

    onDeleteField: (fieldId: string | number) => void;

    onMoveField: (
        index: number,
        direction: 'up' | 'down'
    ) => void;

    onEditField: (field: FieldDefinition) => void;
}

const FieldDefinitionListComponent = ({
    fields = [],
    isSectionDeployed = false,
    onUpdateField,
    onDeleteField,
    onMoveField,
    onEditField
}: Props) => {

    // ============================================================
    // EMPTY STATE
    // ============================================================
    if (!fields.length) {
        return (
            <Text
                fontSize="sm"
                color="gray.400"
                textAlign="center"
                py={6}
            >

                Aucun champ dans cette section
            </Text>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <VStack spacing={3} align="stretch">
            {fields.map((field, index) => {
                const isDependency = Boolean(field.depends_on_field_id);

                return (
                    <Box
                        key={field.id}
                        bg={isSectionDeployed ? "gray.50" : "white"}
                        border="1px solid"
                        borderColor={isSectionDeployed ? "green.100" : "gray.200"}
                        borderRadius="lg"
                        p={4}
                        position="relative"
                        _hover={{
                            borderColor: isSectionDeployed ? 'green.300' : 'purple.200',
                            shadow: 'sm'
                        }}
                    >
                        {/* HEADER */}
                        <Flex justify="space-between" align="start">
                            <Box>
                                <HStack spacing={2} wrap="wrap">
                                    <Badge colorScheme={isSectionDeployed ? "green" : "purple"}>
                                        #{index + 1}
                                    </Badge>
                                    <Text fontWeight="bold" color={isSectionDeployed ? "gray.700" : "gray.900"}>
                                        {field.label || 'Champ sans titre'}
                                    </Text>

                                    {/* Statut dynamique basé sur le backend */}
                                    {isSectionDeployed ? (
                                        <Badge variant="outline" colorScheme="green" fontSize="10px">
                                            <HStack spacing={1}>
                                                <FiLock size={10} />
                                                <Text>Synchronisé (Prod)</Text>
                                            </HStack>
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" colorScheme="orange" fontSize="10px">
                                            <HStack spacing={1}>
                                                <FiUnlock size={10} />
                                                <Text>Brouillon / Éditable</Text>
                                            </HStack>
                                        </Badge>
                                    )}
                                </HStack>

                                <Text
                                    fontSize="xs"
                                    color="gray.500"
                                    fontFamily="mono"
                                    mt={1}
                                >
                                    {field.code}
                                </Text>
                            </Box>

                            {/* ACTIONS BUTTONS */}
                            <HStack spacing={1}>
                                <IconButton
                                    aria-label="Déplacer vers le haut"
                                    size="xs"
                                    icon={<FiArrowUp />}
                                    isDisabled={index === 0}
                                    onClick={() => onMoveField(index, 'up')}
                                />

                                <IconButton
                                    aria-label="Déplacer vers le bas"
                                    size="xs"
                                    icon={<FiArrowDown />}
                                    isDisabled={index === fields.length - 1}
                                    onClick={() => onMoveField(index, 'down')}
                                />

                                <IconButton
                                    aria-label="Modifier le champ"
                                    size="xs"
                                    colorScheme="blue"
                                    variant="ghost"
                                    icon={<FiEdit2 />}
                                    onClick={() => onEditField(field)}
                                />

                                <IconButton
                                    aria-label="Supprimer le champ"
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    icon={<FiTrash2 />}
                                    onClick={() => {
                                        if (confirm(`Supprimer le champ "${field.label || field.code}" ?`)) {
                                            onDeleteField(field.id);
                                        }
                                    }}
                                />
                            </HStack>
                        </Flex>

                        <Divider my={3} borderColor={isSectionDeployed ? "green.100" : "gray.200"} />

                        {/* BODY */}
                        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                            <HStack spacing={2} wrap="wrap">
                                <Badge variant="subtle" colorScheme="gray">
                                    {field.field_type}
                                </Badge>

                                {field.required && (
                                    <Badge colorScheme="red">
                                        requis
                                    </Badge>
                                )}

                                {field.unit && (
                                    <Badge colorScheme="green">
                                        {field.unit}
                                    </Badge>
                                )}

                                {Array.isArray(field.options) && field.options.length > 0 && (
                                    <Badge colorScheme="blue">
                                        {field.options.length} options
                                    </Badge>
                                )}
                            </HStack>

                            {/* REQUIRED TOGGLE */}
                            <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500">Requis</Text>
                                <Switch
                                    aria-label="Marquer comme requis"
                                    size="sm"
                                    colorScheme={isSectionDeployed ? "green" : "purple"}
                                    isChecked={field.required}
                                    onChange={(e) =>
                                        onUpdateField(field.id, 'required', e.target.checked)
                                    }
                                />
                            </HStack>
                        </Flex>

                        {/* DEPENDENCY CONDITIONS */}
                        {isDependency && (
                            <Box
                                mt={3}
                                p={2}
                                borderRadius="md"
                                bg={isSectionDeployed ? "green.50" : "purple.50"}
                                border="1px solid"
                                borderColor={isSectionDeployed ? "green.100" : "purple.100"}
                            >
                                <Text fontSize="xs" color={isSectionDeployed ? "green.700" : "purple.700"} fontWeight="bold">
                                    👁 Visible si :
                                </Text>
                                <Text fontSize="sm" fontWeight="medium" mt={0.5} color="gray.700">
                                    {field.depends_on_field_id} = {field.depends_on_value}
                                </Text>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </VStack>
    );
};

const FieldDefinitionList = memo(FieldDefinitionListComponent);

export default FieldDefinitionList;
