import React, { useRef } from 'react';
import { FormControl, FormLabel, FormHelperText, Box, Button, HStack, Image } from '@chakra-ui/react';
import SignatureCanvas from 'react-signature-canvas';
import { BaseFieldProps } from '../types/formDynamicTypes';

export const SignatureField: React.FC<BaseFieldProps> = React.memo(({ field, isEditing, onChange }) => {
    const sigCanvasRef = useRef<SignatureCanvas | null>(null);

    const handleClear = () => {
        sigCanvasRef.current?.clear();
        onChange(field.id, null);
    };

    const handleEnd = () => {
        if (sigCanvasRef.current) {
            if (sigCanvasRef.current.isEmpty()) {
                onChange(field.id, null);
            } else {
                const base64Data = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
                onChange(field.id, base64Data);
            }
        }
    };

    const existingSignature = field.value as string | null;

    return (
        <FormControl isRequired={field.required} isDisabled={!field.enabled}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{field.label}</FormLabel>

            {!isEditing ? (
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50" p={2} h="150px" display="flex" alignItems="center" justifyContent="center">
                    {existingSignature ? (
                        <Image src={existingSignature} alt="Signature" maxH="130px" objectFit="contain" />
                    ) : (
                        <Box fontSize="sm" color="gray.400" as="em">Aucune signature</Box>
                    )}
                </Box>
            ) : (
                <Box border="1px solid" borderColor="gray.300" borderRadius="md" bg="white" position="relative">
                    <SignatureCanvas
                        ref={(ref) => { sigCanvasRef.current = ref; }}
                        canvasProps={{
                            style: { width: '100%', height: '150px', borderRadius: '6px' },
                            'aria-label': field.label
                        }}
                        onEnd={handleEnd}
                        clearOnResize={false}
                    />
                    <HStack position="absolute" bottom={2} right={2} spacing={2}>
                        <Button size="xs" variant="outline" colorScheme="red" onClick={handleClear}>
                            Effacer
                        </Button>
                    </HStack>
                </Box>
            )}
            {field.help_text && <FormHelperText color="gray.500">{field.help_text}</FormHelperText>}
        </FormControl>
    );
});
SignatureField.displayName = 'SignatureField';