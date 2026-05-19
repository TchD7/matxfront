import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Switch,
    VStack,
    HStack,
    Textarea,
    useToast,
    Text,
    Box,
    Divider
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import api from '../../api/apiClient';

export default function FieldDefinitionModal({
    isOpen,
    onClose,
    fieldData,
    interventionTypes,
    onSuccess
}: any) {

    const toast = useToast();

    const [form, setForm] = useState<any>({
        label: "",
        code: "",
        field_type: "text",
        required: false,
        options: "",
        default_value: "",
        intervention_type: ""
    });

    const [loading, setLoading] = useState(false);

    // ================= INIT FORM =================
    useEffect(() => {
        if (fieldData) {
            setForm({
                label: fieldData.label || "",
                code: fieldData.code || "",
                field_type: fieldData.field_type || "text",
                required: fieldData.required || false,
                options: fieldData.options ? JSON.stringify(fieldData.options, null, 2) : "",
                default_value: fieldData.default_value ? JSON.stringify(fieldData.default_value, null, 2) : "",
                intervention_type: fieldData.intervention_type?.id || ""
            });
        } else {
            setForm({
                label: "",
                code: "",
                field_type: "text",
                required: false,
                options: "",
                default_value: "",
                intervention_type: ""
            });
        }
    }, [fieldData]);

    // ================= HANDLE CHANGE =================
    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    // ================= SAVE =================
    const handleSave = async () => {
        try {
            setLoading(true);

            const payload: any = {
                label: form.label,
                code: form.code || null,
                field_type: form.field_type,
                required: form.required,
                intervention_type: form.intervention_type
            };

            // JSON safe parsing
            try {
                payload.options = form.options ? JSON.parse(form.options) : null;
            } catch {
                toast({ title: "Options JSON invalide", status: "error" });
                return;
            }

            try {
                payload.default_value = form.default_value ? JSON.parse(form.default_value) : null;
            } catch {
                toast({ title: "Default value JSON invalide", status: "error" });
                return;
            }

            if (fieldData?.id) {
                await api.put(`/api/v1/field-definitions/${fieldData.id}/`, payload);
                toast({ title: "Champ mis à jour", status: "success" });
            } else {
                await api.post(`/api/v1/field-definitions/`, payload);
                toast({ title: "Champ créé", status: "success" });
            }

            onSuccess();
            onClose();

        } catch (err) {
            toast({ title: "Erreur sauvegarde", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    // ================= UI =================
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />

            <ModalContent>
                <ModalHeader>
                    {fieldData ? "Modifier champ" : "Nouveau champ"}
                </ModalHeader>

                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">

                        {/* LABEL */}
                        <FormControl isRequired>
                            <FormLabel>Label</FormLabel>
                            <Input
                                value={form.label}
                                onChange={(e) => handleChange("label", e.target.value)}
                            />
                        </FormControl>

                        {/* CODE */}
                        <FormControl>
                            <FormLabel>Code (slug)</FormLabel>
                            <Input
                                value={form.code}
                                onChange={(e) => handleChange("code", e.target.value)}
                                placeholder="ex: temperature, pressure..."
                            />
                        </FormControl>

                        {/* TYPE */}
                        <FormControl isRequired>
                            <FormLabel>Type de champ</FormLabel>
                            <Select
                                value={form.field_type}
                                onChange={(e) => handleChange("field_type", e.target.value)}
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="date">Date</option>
                                <option value="time">Time</option>
                                <option value="image">Image</option>
                                <option value="file">File</option>
                                <option value="signature">Signature</option>
                                <option value="select">Select</option>
                            </Select>
                        </FormControl>

                        {/* INTERVENTION TYPE */}
                        <FormControl isRequired>
                            <FormLabel>Type d'intervention</FormLabel>
                            <Select
                                value={form.intervention_type}
                                onChange={(e) => handleChange("intervention_type", e.target.value)}
                            >
                                <option value="">-- choisir --</option>
                                {interventionTypes.map((t: any) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* REQUIRED */}
                        <HStack justify="space-between">
                            <Text>Champ obligatoire</Text>
                            <Switch
                                isChecked={form.required}
                                onChange={(e) => handleChange("required", e.target.checked)}
                            />
                        </HStack>

                        <Divider />

                        {/* OPTIONS (SELECT ONLY) */}
                        {form.field_type === "select" && (
                            <FormControl>
                                <FormLabel>Options (JSON)</FormLabel>
                                <Textarea
                                    value={form.options}
                                    onChange={(e) => handleChange("options", e.target.value)}
                                    placeholder='["option1", "option2"]'
                                    fontFamily="monospace"
                                />
                            </FormControl>
                        )}

                        {/* DEFAULT VALUE */}
                        <FormControl>
                            <FormLabel>Valeur par défaut (JSON)</FormLabel>
                            <Textarea
                                value={form.default_value}
                                onChange={(e) => handleChange("default_value", e.target.value)}
                                placeholder='"valeur" ou 123 ou true'
                                fontFamily="monospace"
                            />
                        </FormControl>

                        {/* PREVIEW */}
                        <Box p={3} bg="gray.50" borderRadius="md">
                            <Text fontSize="xs" color="gray.500">
                                Preview
                            </Text>
                            <Text fontWeight="bold">
                                {form.label || "Nom du champ"}
                            </Text>
                            <Text fontSize="xs">
                                type: {form.field_type}
                            </Text>
                        </Box>

                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Annuler
                    </Button>

                    <Button
                        colorScheme="purple"
                        ml={3}
                        isLoading={loading}
                        onClick={handleSave}
                    >
                        Sauvegarder
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}