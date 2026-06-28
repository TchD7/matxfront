import React, { useCallback, useMemo, useState } from 'react';
import {
    Box, Button, FormControl, FormHelperText, FormLabel, HStack, Icon,
    Image as ChakraImage, Text, useToast, VStack, IconButton
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiTrash2, FiImage, FiEye } from 'react-icons/fi';
import type { BaseFieldProps } from '../types/formDynamicTypes';
import { ImageViewer } from './ImageViewer';

// --- Utilitaire de compression (inchangé dans sa logique) ---
async function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (file.type === "image/svg+xml") return resolve(reader.result as string);
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject("Canvas error");

                if (file.type !== "image/png") {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export const ImageField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const toast = useToast();
    const [viewerOpen, setViewerOpen] = useState(false);

    const imageSrc = useMemo(() => (typeof field.value === 'string' ? field.value : null), [field.value]);

    const onDrop = useCallback(async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            onChange(field.id, compressed);
        } catch {
            toast({ title: "Erreur", description: "Traitement impossible", status: "error" });
        }
    }, [field.id, onChange, toast]);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        multiple: false,
        disabled: !isEditing || !field.enabled,
        accept: { 'image/*': [] },
    });

    const ImagePreview = ({ canZoom = false }: { canZoom?: boolean }) => (
        <Box position="relative" display="inline-block" maxW="full">
            <ChakraImage
                src={imageSrc!}
                maxH="180px"
                borderRadius="md"
                objectFit="contain"
                cursor={canZoom ? "pointer" : "default"}
                onClick={canZoom ? () => setViewerOpen(true) : undefined}
                border="1px solid"
                borderColor="gray.200"
            />
            {canZoom && (
                <IconButton
                    aria-label="Zoom"
                    icon={<FiEye />}
                    size="sm"
                    position="absolute" top="2" right="2"
                    onClick={() => setViewerOpen(true)}
                />
            )}
        </Box>
    );

    if (!isEditing) {
        return (
            <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">{field.label}</FormLabel>
                {imageSrc ? <ImagePreview canZoom /> : <Text color="gray.400" fontSize="sm">Aucune image</Text>}
                <ImageViewer open={viewerOpen} setOpen={setViewerOpen} image={imageSrc} />
            </FormControl>
        );
    }

    return (
        <FormControl isRequired={field.required}>
            <FormLabel fontSize="sm" fontWeight="medium">{field.label}</FormLabel>

            <Box
                {...getRootProps()}
                border="2px dashed"
                borderColor={imageSrc ? "purple.300" : "gray.300"}
                borderRadius="lg"
                p={4}
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: 'purple.500', bg: 'purple.50' }}
            >
                <input {...getInputProps()} />
                {imageSrc ? (
                    <ImagePreview />
                ) : (
                    <VStack spacing={2} py={2}>
                        <Icon as={FiImage} boxSize={8} color="gray.400" />
                        <Text fontSize="xs" color="gray.500">Cliquez ou glissez une image</Text>
                    </VStack>
                )}
            </Box>

            {imageSrc && (
                <HStack mt={2}>
                    <Button size="xs" leftIcon={<FiUploadCloud />} onClick={open}>Remplacer</Button>
                    <Button size="xs" colorScheme="red" variant="ghost" leftIcon={<FiTrash2 />} onClick={() => onChange(field.id, null)}>Supprimer</Button>
                </HStack>
            )}

            {field.help_text && <FormHelperText fontSize="xs">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});

ImageField.displayName = 'ImageField';