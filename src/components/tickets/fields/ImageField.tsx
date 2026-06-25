import React, { useCallback } from 'react';
import { FormControl, FormLabel, FormHelperText, Box, Text, VStack, Icon, Image, useToast, HStack, Button } from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiTrash2 } from 'react-icons/fi';
import { BaseFieldProps } from '../types/formDynamicTypes';

export const FileUploadField: React.FC<BaseFieldProps & { isImageOnly?: boolean }> = React.memo(({ field, isEditing, onChange, isImageOnly = false }) => {
    const toast = useToast();
    const maxSizeBytes = 5 * 1024 * 1024; // Limitation standard à 5MB

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > maxSizeBytes) {
            toast({
                title: "Fichier trop volumineux",
                description: "La taille maximale autorisée est de 5 Mo.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            onChange(field.id, {
                name: file.name,
                size: file.size,
                type: file.type,
                base64: reader.result as string,
            });
        };
        reader.readAsDataURL(file);
    }, [field.id, onChange, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: !isEditing || !field.enabled,
        accept: isImageOnly ? { 'image/*': [] } : undefined,
        multiple: false,
    });

    const fileData = field.value as { name: string; base64: string } | null;

    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>

            {fileData?.base64 ? (
                <VStack align="stretch" spacing={2} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                    {isImageOnly ? (
                        <Image src={fileData.base64} alt={fileData.name} maxH="200px" objectFit="contain" borderRadius="md" mx="auto" />
                    ) : (
                        <HStack justify="space-between">
                            <HStack>
                                <Icon as={FiFile} color="purple.500" boxSize={5} />
                                <Text fontSize="sm" noOfLines={1}>{fileData.name}</Text>
                            </HStack>
                            {isEditing && (
                                <Button size="xs" colorScheme="red" variant="ghost" onClick={() => onChange(field.id, null)}>
                                    <Icon as={FiTrash2} />
                                </Button>
                            )}
                        </HStack>
                    )}
                </VStack>
            ) : (
                <Box
                    {...getRootProps()}
                    p={5}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderRadius="md"
                    borderColor={isDragActive ? 'purple.500' : 'gray.300'}
                    bg={isDragActive ? 'purple.50' : 'white'}
                    cursor={isEditing && field.enabled ? 'pointer' : 'not-allowed'}
                    transition="all 0.2s"
                    _hover={isEditing && field.enabled ? { borderColor: 'purple.400' } : {}}
                >
                    <input {...getInputProps()} aria-label={field.label} />
                    <VStack spacing={1} textAlign="center">
                        <Icon as={FiUploadCloud} boxSize={6} color="gray.400" />
                        <Text fontSize="sm" fontWeight="medium">
                            {isDragActive ? "Déposez le fichier ici..." : "Glissez-déposez ou cliquez pour uploader"}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                            {isImageOnly ? "Images uniquement (Max 5Mo)" : "Tous fichiers acceptés (Max 5Mo)"}
                        </Text>
                    </VStack>
                </Box>
            )}
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
FileUploadField.displayName = 'FileUploadField';

export const ImageField: React.FC<BaseFieldProps> = (props) => <FileUploadField {...props} isImageOnly={true} />;
export const FileField: React.FC<BaseFieldProps> = (props) => <FileUploadField {...props} isImageOnly={false} />;