import {
    Box,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Checkbox,
    Textarea,
    Button,
    useToast,
    Spinner,
    Center,
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import api from '../../api/apiClient';

// ================= TYPES =================
interface FieldValue {
    id: number;
    label: string;
    field_type: string;
    value: any;
    required: boolean;
    options?: any;
}

interface Ticket {
    id: string;
    fields?: FieldValue[];
}

// ================= COMPONENT =================
export default function TicketFieldsTab({
    ticket,
    onRefresh,
}: {
    ticket: Ticket;
    onRefresh: () => void;
}) {
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState<Record<number, any>>({});

    // ================= INIT VALUES =================
    useEffect(() => {
        if (!ticket.fields) return;

        const initial: Record<number, any> = {};

        ticket.fields.forEach((f) => {
            initial[f.id] = f.value ?? '';
        });

        setValues(initial);
    }, [ticket.fields]);

    // ================= HANDLE CHANGE =================
    const handleChange = (id: number, value: any) => {
        setValues((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // ================= SAVE =================
    const saveFields = async () => {
        try {
            setLoading(true);

            await api.patch(`/api/v1/tickets/${ticket.id}/`, {
                fields: Object.entries(values).map(([id, value]) => ({
                    field_id: Number(id),
                    value,
                })),
            });

            toast({
                title: 'Champs mis à jour',
                status: 'success',
            });

            onRefresh();

        } catch (err: any) {
            toast({
                title: 'Erreur sauvegarde',
                description: err.response?.data?.detail || 'Erreur serveur',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // ================= RENDER FIELD =================
    const renderField = (field: FieldValue) => {
        const value = values[field.id] ?? '';

        switch (field.field_type) {

            case 'text':
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );

            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    >
                        <option value="">-- choisir --</option>
                        {field.options?.map((opt: any, idx: number) => (
                            <option key={idx} value={opt.value ?? opt}>
                                {opt.label ?? opt}
                            </option>
                        ))}
                    </Select>
                );

            case 'checkbox':
                return (
                    <Checkbox
                        isChecked={!!value}
                        onChange={(e) => handleChange(field.id, e.target.checked)}
                    >
                        {field.label}
                    </Checkbox>
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );

            case 'time':
                return (
                    <Input
                        type="time"
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );

            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                    />
                );
        }
    };

    // ================= UI =================
    if (!ticket.fields) {
        return (
            <Center py={10}>
                <Spinner />
            </Center>
        );
    }

    return (
        <Box p={4}>

            <VStack spacing={5} align="stretch">

                {ticket.fields.map((field) => (
                    <FormControl
                        key={field.id}
                        isRequired={field.required}
                    >

                        {/* LABEL */}
                        <FormLabel fontWeight="bold">
                            {field.label}
                        </FormLabel>

                        {/* INPUT */}
                        {renderField(field)}

                    </FormControl>
                ))}

                {/* SAVE BUTTON */}
                <Button
                    colorScheme="purple"
                    onClick={saveFields}
                    isLoading={loading}
                    alignSelf="flex-end"
                >
                    Sauvegarder
                </Button>

            </VStack>

        </Box>
    );
}