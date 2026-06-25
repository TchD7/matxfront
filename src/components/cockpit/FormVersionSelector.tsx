import { useState, useEffect, useCallback, useRef } from 'react';
import {
    HStack, Text, Select, Button, Badge, useToast, Menu, MenuButton,
    MenuList, MenuItem, Icon
} from '@chakra-ui/react';
import { FiChevronDown, FiCheckCircle, FiCopy, FiLayers, FiTrash2, FiLock } from 'react-icons/fi';
import api from '../../api/apiClient';

// 👈 2. Création de l'interface stricte (zéro any)
export interface FormVersion {
    id: number | string;
    label: string;
    version: number;
    is_published: boolean;
    created_at?: string;
}

interface FormVersionSelectorProps {
    interventionTypeId: string | number;
    onVersionChange: (versionId: string | null) => void;
    // 👈 8. Ajout de la prop pour notifier le parent du mode lecture seule
    onVersionMetaChange?: (version: FormVersion | null) => void;
}

export default function FormVersionSelector({
    interventionTypeId,
    onVersionChange,
    onVersionMetaChange,
}: FormVersionSelectorProps) {
    const [versions, setVersions] = useState<FormVersion[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useToast();

    // Référence pour lire l'état actuel sans l'ajouter aux dépendances
    const selectedIdRef = useRef<string>(selectedVersionId);
    useEffect(() => {
        selectedIdRef.current = selectedVersionId;
    }, [selectedVersionId]);

    // 👈 1. loadVersions sécurisé (pas de dépendance circulaire, pas d'effets dans le setState)
    const loadVersions = useCallback(async () => {
        if (!interventionTypeId) return;
        try {
            const res = await api.get(`/api/v1/form-versions/?intervention_type=${interventionTypeId}`);
            const data: FormVersion[] = res.data?.results || res.data || [];
            setVersions(data);

            const prevId = selectedIdRef.current;
            const exists = data.some((v: FormVersion) => String(v.id) === String(prevId));

            if (!exists) {
                const active = data.find((v: FormVersion) => v.is_published) || data[0];
                if (active) {
                    const activeId = String(active.id);
                    setSelectedVersionId(activeId);
                    onVersionChange(activeId);
                } else {
                    setSelectedVersionId('');
                    onVersionChange(null);
                }
            }
        } catch {
            toast({ title: "Erreur chargement versions", status: "error" });
        }
    }, [interventionTypeId, onVersionChange, toast]);

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const currentVersion = versions.find(v => String(v.id) === selectedVersionId) || null;

    // 👈 8. Remonter les métadonnées de la version au parent à chaque changement
    useEffect(() => {
        if (onVersionMetaChange) {
            onVersionMetaChange(currentVersion);
        }
    }, [currentVersion, onVersionMetaChange]);

    const handleSelectChange = (val: string) => {
        setSelectedVersionId(val);
        onVersionChange(val || null);
    };

    const handleCreateNew = async () => {
        setIsLoading(true);
        try {
            const res = await api.post(`/api/v1/form-versions/`, {
                intervention_type: interventionTypeId
            });

            toast({ title: "Nouvelle version créée", status: "success" });
            
            // On sélectionne d'abord, puis on recharge la liste
            if (res.data?.id) {
                const newId = String(res.data.id);
                setSelectedVersionId(newId);
                onVersionChange(newId);
            }
            await loadVersions();
        } catch {
            toast({ title: "Erreur création version", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        setIsLoading(true);
        try {
            await api.post(`/api/v1/form-versions/${selectedVersionId}/publish/`);
            toast({ title: "Version publiée", status: "success" });
            await loadVersions();
        } catch {
            toast({ title: "Erreur publication", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // 👈 4. Corriger la duplication en sélectionnant le brouillon immédiatement
    const handleDuplicate = async () => {
        setIsLoading(true);
        try {
            const res = await api.post(`/api/v1/form-versions/${selectedVersionId}/duplicate/`);
            toast({ title: "Brouillon créé", status: "success" });
            
            if (res.data?.id) {
                const draftId = String(res.data.id);
                setSelectedVersionId(draftId);
                onVersionChange(draftId);
            }
            await loadVersions();
        } catch {
            toast({ title: "Erreur duplication", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // 👈 5. Corriger la suppression en pré-sélectionnant la prochaine version logique
    const handleDeleteDraft = async () => {
        if (!selectedVersionId || currentVersion?.is_published) return;

        const previousVersions = [...versions];
        const nextVersions = versions.filter(v => String(v.id) !== selectedVersionId);
        
        // Optimistic UI : Mise à jour de la liste ET de la sélection immédiate
        setVersions(nextVersions);
        const active = nextVersions.find(v => v.is_published) || nextVersions[0];
        
        if (active) {
            const activeId = String(active.id);
            setSelectedVersionId(activeId);
            onVersionChange(activeId);
        } else {
            setSelectedVersionId('');
            onVersionChange(null);
        }

        try {
            await api.delete(`/api/v1/form-versions/${selectedVersionId}/delete-draft/`);
            toast({ title: "Brouillon supprimé", status: "success" });
            await loadVersions(); // Sécurise la synchro avec le backend
        } catch {
            setVersions(previousVersions);
            setSelectedVersionId(selectedIdRef.current);
            onVersionChange(selectedIdRef.current);
            toast({ title: "Erreur suppression", status: "error" });
        }
    };

    // Helper pour formater la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
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
                w="450px" // Un peu plus large pour laisser la place aux dates
                value={selectedVersionId}
                onChange={(e) => handleSelectChange(e.target.value)}
            >
                <option value="">Sélectionner une version...</option>

                {versions.map((v) => {
                    // 👈 6 & 7. Formatage riche du label (V{version} - {label} - Créée le {date})
                    const dateStr = v.created_at ? ` - Créée le ${formatDate(v.created_at)}` : '';
                    const statusStr = v.is_published ? '(Live)' : `(Brouillon${dateStr})`;
                    
                    return (
                        <option key={v.id} value={String(v.id)}>
                            V{v.version} - {v.label} {statusStr}
                        </option>
                    );
                })}
            </Select>

            {currentVersion && (
                <Badge 
                    colorScheme={currentVersion.is_published ? 'green' : 'orange'} 
                    px={2} py={1} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    {/* 👈 8. Affichage du cadenas pour une version publiée */}
                    {currentVersion.is_published ? (
                        <><FiLock size={12} /> 🔒 Version publiée</>
                    ) : (
                        'Brouillon'
                    )}
                </Badge>
            )}

            <Menu>
                <MenuButton as={Button} size="sm" rightIcon={<FiChevronDown />} colorScheme="purple" variant="outline" isLoading={isLoading}>
                    Actions
                </MenuButton>
                <MenuList>
                    <MenuItem onClick={handleCreateNew}>
                        Créer nouvelle version
                    </MenuItem>

                    {/* 👈 3. On désactive si rien n'est sélectionné */}
                    <MenuItem 
                        icon={<FiCopy />} 
                        onClick={handleDuplicate}
                        isDisabled={!selectedVersionId}
                    >
                        Dupliquer en brouillon
                    </MenuItem>

                    {currentVersion && !currentVersion.is_published && (
                        <>
                            <MenuItem 
                                icon={<FiCheckCircle color="green" />} 
                                onClick={handlePublish}
                                isDisabled={!selectedVersionId}
                            >
                                Publier
                            </MenuItem>
                            <MenuItem 
                                icon={<FiTrash2 color="red" />} 
                                onClick={handleDeleteDraft}
                                isDisabled={!selectedVersionId}
                            >
                                Supprimer brouillon
                            </MenuItem>
                        </>
                    )}
                </MenuList>
            </Menu>
        </HStack>
    );
}