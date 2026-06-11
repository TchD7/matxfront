import { useState, useEffect, useCallback } from 'react';
import {
    HStack, Text, Select, Button, Badge, useToast, Menu, MenuButton,
    MenuList, MenuItem, Icon
} from '@chakra-ui/react';
import { FiChevronDown, FiCheckCircle, FiCopy, FiLayers, FiTrash2 } from 'react-icons/fi';
import api from '../../api/apiClient';

interface FormVersionSelectorProps {
    interventionTypeId: string | number;
    onVersionChange: (versionId: string | null) => void;
}

export default function FormVersionSelector({
    interventionTypeId,
    onVersionChange,
}: FormVersionSelectorProps) {
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Fonction de chargement des versions (Stable)
    const loadVersions = useCallback(async () => {
        if (!interventionTypeId) return;
        try {
            const res = await api.get(`/api/v1/form-versions/?intervention_type=${interventionTypeId}`);
            const data = res.data?.results || res.data || [];
            setVersions(data);

            // N'initialise que si rien n'est sélectionné ou si l'ID n'existe plus
            const exists = data.some((v: any) => String(v.id) === String(selectedVersionId));

            if (!exists) {
                const active = data.find((v: any) => v.is_published) || data[0];
                if (active) {
                    const activeId = String(active.id);
                    setSelectedVersionId(activeId);
                    onVersionChange(activeId);
                } else {
                    setSelectedVersionId('');
                    onVersionChange(null);
                }
            }
            // Si 'exists' est vrai, on ne fait rien, on garde la sélection actuelle
        } catch {
            toast({ title: "Erreur chargement versions", status: "error" });
        }
    }, [interventionTypeId, onVersionChange, toast, selectedVersionId]); // Ajout de selectedVersionId ici

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const currentVersion = versions.find(v => String(v.id) === selectedVersionId);

    const handleSelectChange = (val: string) => {
        setSelectedVersionId(val);
        onVersionChange(val || null);
    };
    const handleCreateNew = async () => {
        setIsLoading(true);
        try {
            // Appel API pour créer une nouvelle version vierge
            const res = await api.post(`/api/v1/form-versions/`, {
                intervention_type: interventionTypeId
            });

            toast({ title: "Nouvelle version créée", status: "success" });
            await loadVersions();

            // Sélection automatique de la nouvelle version
            if (res.data?.id) {
                const newId = String(res.data.id);
                setSelectedVersionId(newId);
                onVersionChange(newId);
            }
        } catch {
            toast({ title: "Erreur création version", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // Actions API avec rafraîchissement local
    const handleAction = async (actionFn: () => Promise<any>, successMsg: string, errorMsg: string) => {
        setIsLoading(true);
        try {
            await actionFn();
            toast({ title: successMsg, status: "success" });
            await loadVersions(); // Rafraîchissement propre après succès
        } catch {
            toast({ title: errorMsg, status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = () => handleAction(
        () => api.post(`/api/v1/form-versions/${selectedVersionId}/publish/`),
        "Version publiée", "Erreur publication"
    );

    const handleDuplicate = () => handleAction(
        () => api.post(`/api/v1/form-versions/${selectedVersionId}/duplicate/`),
        "Brouillon créé", "Erreur duplication"
    );

    const handleDeleteDraft = async () => {
        if (!selectedVersionId || currentVersion?.is_published) return;

        // Optimistic Update
        const previousVersions = [...versions];
        setVersions(prev => prev.filter(v => String(v.id) !== selectedVersionId));

        try {
            await api.delete(`/api/v1/form-versions/${selectedVersionId}/delete-draft/`);
            toast({ title: "Brouillon supprimé", status: "success" });
            await loadVersions();
        } catch {
            setVersions(previousVersions);
            toast({ title: "Erreur suppression", status: "error" });
        }
    };

    return (
        <HStack spacing={2} bg="white" p={2} borderRadius="xl" border="1px solid #E2E8F0" shadow="xs">
            <HStack spacing={2}>
                <Icon as={FiLayers} color="purple.500" />
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                    Version :
                </Text>
            </HStack>


            <Select
                size="sm"
                w="400px"
                value={selectedVersionId}
                onChange={(e) => handleSelectChange(e.target.value)}
            >
                {/* Option par défaut si rien n'est sélectionné */}
                <option value="">Sélectionner une version...</option>

                {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                        {v.label} {v.is_published ? '(Live)' : '(Brouillon)'}
                    </option>
                ))}
            </Select>

            {currentVersion && (
                <Badge colorScheme={currentVersion.is_published ? 'green' : 'orange'} px={2} py={1} borderRadius="md">
                    {currentVersion.is_published ? 'En production' : 'Brouillon'}
                </Badge>
            )}

            <Menu>
                <MenuButton as={Button} size="sm" rightIcon={<FiChevronDown />} colorScheme="purple" variant="outline" isLoading={isLoading}>
                    Actions
                </MenuButton>
                <MenuList>
                    <MenuItem

                        onClick={handleCreateNew}
                    >
                        Créer nouvelle version
                    </MenuItem>

                    <MenuItem icon={<FiCopy />} onClick={handleDuplicate}>
                        Dupliquer en brouillon
                    </MenuItem>
                    {currentVersion && !currentVersion.is_published && (
                        <>
                            <MenuItem icon={<FiCheckCircle color="green" />} onClick={handlePublish}>Publier</MenuItem>
                            <MenuItem icon={<FiTrash2 color="red" />} onClick={handleDeleteDraft}>Supprimer brouillon</MenuItem>
                        </>
                    )}

                </MenuList>
            </Menu>
        </HStack>
    );
}