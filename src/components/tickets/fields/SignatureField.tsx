import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
    FormControl,
    FormLabel,
    FormHelperText,
    Box,
    HStack,
    Button,
    Image,
    VStack,
    IconButton,
} from '@chakra-ui/react';
import SignatureCanvas from 'react-signature-canvas';
import { FiTrash2, FiEye } from 'react-icons/fi';
import type { BaseFieldProps } from '../types/formDynamicTypes';
import { ImageViewer } from './ImageViewer';

// ----------------------------
// SAFE IMAGE COMPRESSOR
// ----------------------------
function compressBase64(base64: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64);

            canvas.width = img.width;
            canvas.height = img.height;

            // Fond blanc explicite pour éviter la transparence noire
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(base64);
    });
}

// ----------------------------
// COMPONENT
// ----------------------------
export const SignatureField: React.FC<BaseFieldProps> = React.memo(
    ({ field, isEditing, onChange }) => {
        const sigRef = useRef<SignatureCanvas | null>(null);
        const [viewerOpen, setViewerOpen] = useState(false);

        // Source de vérité unique pour la valeur de l'image
        const imageSrc = useMemo(
            () => (typeof field.value === 'string' ? field.value : null),
            [field.value]
        );

        // État d'édition local : actif s'il n'y a pas encore de signature enregistrée
        const [isLocalEditing, setIsLocalEditing] = useState(!imageSrc);

        // Synchronise le mode d'édition local si la valeur externe change ou s'efface
        useEffect(() => {
            if (!imageSrc) {
                setIsLocalEditing(true);
            }
        }, [imageSrc]);

        // Sauvegarde de la signature tracée
        // Sauvegarde de la signature tracée
        const handleSave = async () => {
            // 1. Vérifier si la référence et l'instance sous-jacente existent
            if (!sigRef.current) return;

            // 2. Sécuriser la vérification du tracé
            if (sigRef.current.isEmpty()) return;

            try {
                // 3. Récupérer le canvas natif de manière ultra-safe
                // react-signature-canvas expose le canvas HTML via getCanvas()
                const canvasElement = sigRef.current.getCanvas();
                if (!canvasElement) return;

                // 4. Exporter directement en Base64 sans passer par getTrimmedCanvas() 
                // (qui cause le crash avec votre bundler actuel)
                const raw = canvasElement.toDataURL('image/png');

                // 5. Compresser et envoyer au parent
                const compressed = await compressBase64(raw);
                onChange(field.id, compressed);
                setIsLocalEditing(false);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde de la signature :", error);
            }
        };

        // Nettoyage complet
        const handleClear = () => {
            sigRef.current?.clear();
            onChange(field.id, null);
            setIsLocalEditing(true);
        };

        // ----------------------------
        // 1. MODE LECTURE (isEditing globale à false)
        // ----------------------------
        if (!isEditing) {
            return (
                <FormControl isRequired={field.required}>
                    <FormLabel>{field.label}</FormLabel>
                    <Box position="relative" display="inline-block">
                        {imageSrc ? (
                            <>
                                <Image
                                    src={imageSrc}
                                    alt="signature"
                                    maxH="140px"
                                    borderRadius="md"
                                    objectFit="contain"
                                    cursor="pointer"
                                    bg="gray.50"
                                    onClick={() => setViewerOpen(true)}
                                />
                                <IconButton
                                    aria-label="zoom signature"
                                    icon={<FiEye />}
                                    size="sm"
                                    position="absolute"
                                    top="2"
                                    right="2"
                                    onClick={() => setViewerOpen(true)}
                                />
                                <ImageViewer
                                    open={viewerOpen}
                                    setOpen={setViewerOpen}
                                    image={imageSrc}
                                />
                            </>
                        ) : (
                            <Box
                                border="1px dashed"
                                borderColor="gray.200"
                                p={4}
                                borderRadius="md"
                                color="gray.400"
                            >
                                Aucune signature
                            </Box>
                        )}
                    </Box>
                    {field.help_text && <FormHelperText>{field.help_text}</FormHelperText>}
                </FormControl>
            );
        }

        // ----------------------------
        // 2. MODE ÉDITION - APERÇU (S'il y a déjà une signature en base)
        // ----------------------------
        if (!isLocalEditing && imageSrc) {
            return (
                <FormControl isRequired={field.required}>
                    <FormLabel>{field.label}</FormLabel>
                    <VStack spacing={3} align="flex-start">
                        <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2} bg="gray.50">
                            <Image src={imageSrc} alt="Signature enregistrée" maxH="120px" objectFit="contain" />
                        </Box>
                        <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<FiTrash2 />}
                            onClick={handleClear}
                        >
                            Supprimer la signature
                        </Button>
                    </VStack>
                    {field.help_text && <FormHelperText>{field.help_text}</FormHelperText>}
                </FormControl>
            );
        }

        // ----------------------------
        // 3. MODE ÉDITION - CANVAS ACTIF (Si vide ou après suppression)
        // ----------------------------
        return (
            <FormControl isRequired={field.required}>
                <FormLabel>{field.label}</FormLabel>
                <VStack spacing={3} align="stretch">
                    <Box
                        border="1px solid"
                        borderColor="gray.300"
                        borderRadius="md"
                        bg="white"
                        overflow="hidden"
                    >
                        <SignatureCanvas
                            ref={(ref) => { sigRef.current = ref; }}
                            canvasProps={{
                                style: {
                                    width: '100%',
                                    height: 160,
                                    touchAction: 'none',
                                },
                            }}
                            clearOnResize={false}
                        />
                    </Box>

                    <HStack justify="flex-end" spacing={2}>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sigRef.current?.clear()}
                        >
                            Effacer le tracé
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="green"
                            onClick={handleSave}
                        >
                            Valider
                        </Button>
                    </HStack>
                </VStack>
                {field.help_text && <FormHelperText>{field.help_text}</FormHelperText>}
            </FormControl>
        );
    }
);

SignatureField.displayName = 'SignatureField';