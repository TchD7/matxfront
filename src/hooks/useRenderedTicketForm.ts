import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/apiClient';
import type { RenderField, RenderSection } from '../types/formRender.types';

const DEFAULT_DEBOUNCE_MS = 700;

// --- Interfaces correspondant au backend Django DRF ---
interface TicketFieldValueApi {
    id: number | string;
    field_id: number | string; // Clé métier corrigée
    ticket?: string | number;
    code?: string;
    label?: string;
    field_type?: string;
    value: any;
}

// --- Fonctions Utilitaires ---

const normalizeTicketValue = (field: RenderField, rawValue: any) => {
    if (field.type === 'checkbox') {
        return rawValue === true || rawValue === 'true';
    }

    if (field.type === 'multi_select') {
        if (Array.isArray(rawValue)) return rawValue;
        if (typeof rawValue === 'string') {
            try {
                return rawValue.startsWith('[') && rawValue.endsWith(']')
                    ? JSON.parse(rawValue)
                    : rawValue.split(',').map((item) => item.trim()).filter(Boolean);
            } catch {
                return rawValue.split(',').map((item) => item.trim()).filter(Boolean);
            }
        }
        return [];
    }

    return rawValue ?? '';
};

const formatValueForApi = (field: RenderField, value: any) => {
    if (field.type === 'checkbox') return Boolean(value);
    if (field.type === 'multi_select') {
        return Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);
    }
    return value;
};

const buildRenderSectionsFromResponse = (data: any): RenderSection[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.sections && Array.isArray(data.sections)) return data.sections;
    return [];
};

const getFieldById = (sections: RenderSection[]) => {
    const fieldMap = new Map<string, RenderField>();
    sections.forEach((section) => section.fields?.forEach((field) => fieldMap.set(String(field.id), field)));
    return fieldMap;
};

const getDefaultValueForType = (field: RenderField) => {
    if (field.type === 'checkbox') return false;
    if (field.type === 'multi_select') return [];
    return '';
};

// --- Hook Principal ---

export function useRenderedTicketForm(
    ticketId: string | number | null,
    interventionTypeId?: string | number | null
) {
    const [sections, setSections] = useState<RenderSection[]>([]);
    const [values, setValues] = useState<Record<string, any>>({});
    const [recordIds, setRecordIds] = useState<Record<string, string | number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSavedValues, setHasSavedValues] = useState(false);

    // Remplacement du timeout global par un dictionnaire pour supporter les saisies simultanées
    const debounceRefs = useRef<Record<string, number>>({});

    const loadRender = useCallback(async () => {
        if (!ticketId) return;
        setIsLoading(true);
        setError(null);

        try {
            const [renderResponse, valuesResponse] = await Promise.all([
                api.get(`/api/v1/tickets/${ticketId}/render/`),
                api.get(`/api/v1/ticket-field-values/?ticket_id=${ticketId}`),
            ]);

            const renderData = buildRenderSectionsFromResponse(renderResponse.data);
            const valuesData: TicketFieldValueApi[] = valuesResponse.data.results || valuesResponse.data || [];

            const fieldMap = getFieldById(renderData);
            const updatedValues: Record<string, any> = {};
            const updatedRecordIds: Record<string, string | number> = {};

            // Initialisation des valeurs par défaut depuis le rendu
            renderData.forEach((section) => {
                section.fields?.forEach((field) => {
                    updatedValues[String(field.id)] = getDefaultValueForType(field);
                });
            });

            // Écrasement par les valeurs existantes en base (ciblage strict sur field_id)
            valuesData.forEach((item) => {
                if (!item.field_id) return;
                
                const key = String(item.field_id);
                const field = fieldMap.get(key);
                
                updatedValues[key] = field ? normalizeTicketValue(field, item.value) : item.value;
                updatedRecordIds[key] = item.id; // Stockage de l'ID de la ligne pour les futurs PATCH
            });

            setSections(renderData);
            setValues(updatedValues);
            setRecordIds(updatedRecordIds);
            setHasSavedValues(valuesData.length > 0);
        } catch (err: any) {
            const title = err?.response?.status === 404 ? 'Point de rendu absent' : 'Erreur de rendu du ticket';
            console.warn('[useRenderedTicketForm] ', title, err?.response?.data || err.message);
            setError(err?.response?.data?.detail || err?.message || 'Impossible de charger le rendu .');
        } finally {
            setIsLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        loadRender();
    }, [loadRender]);

    const refresh = useCallback(async () => {
        await loadRender();
    }, [loadRender]);

    const saveFieldValue = useCallback(
        async (fieldId: string | number, value: any) => {
            if (!ticketId) return;
            setIsSaving(true);
            setError(null);

            try {
                const fieldKey = String(fieldId);
                const field = getFieldById(sections).get(fieldKey);
                const payloadValue = field ? formatValueForApi(field, value) : value;
                const existingRecordId = recordIds[fieldKey];

                // Logique métier respectée : PATCH si existant, POST en dernier recours
                if (existingRecordId) {
                    await api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, {
                        value: payloadValue,
                    });
                } else {
                    const response = await api.post('/api/v1/ticket-field-values/', {
                        ticket: ticketId,
                        field_definition: fieldId, // Selon l'API de création, si elle exige toujours field_definition au POST
                        value: payloadValue,
                    });
                    
                    // Mise à jour locale de l'ID en cas de création exceptionnelle pour forcer les prochains appels en PATCH
                    if (response.data?.id) {
                        setRecordIds((prev) => ({ ...prev, [fieldKey]: response.data.id }));
                    }
                }
                return true;
            } catch (err: any) {
                setError(err?.response?.data?.detail || err?.message || 'Erreur de sauvegarde du champ.');
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [ticketId, recordIds, sections]
    );

    const updateFieldValue = useCallback(
        (fieldId: string | number, value: any) => {
            const fieldKey = String(fieldId);
            setValues((prev) => ({ ...prev, [fieldKey]: value }));

            if (!ticketId) return;

            // Debounce par champ spécifique pour ne pas bloquer les saisies multiples
            if (debounceRefs.current[fieldKey]) {
                window.clearTimeout(debounceRefs.current[fieldKey]);
            }

            debounceRefs.current[fieldKey] = window.setTimeout(() => {
                saveFieldValue(fieldId, value);
            }, DEFAULT_DEBOUNCE_MS);
        },
        [saveFieldValue, ticketId]
    );

    // Nettoyage de tous les chronomètres au démontage du composant
    useEffect(() => {
        return () => {
            Object.values(debounceRefs.current).forEach((timeoutId) => {
                window.clearTimeout(timeoutId);
            });
        };
    }, []);

    const saveAllValues = useCallback(async () => {
        if (!ticketId) return false;
        setIsSaving(true);
        setError(null);

        try {
            const fieldMap = getFieldById(sections);
            const savePromises = Object.entries(values).map(([fieldKey, value]) => {
                const existingRecordId = recordIds[fieldKey];
                const field = fieldMap.get(fieldKey);
                const payloadValue = field ? formatValueForApi(field, value) : value;

                if (existingRecordId) {
                    return api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, { value: payloadValue });
                }

                return api.post('/api/v1/ticket-field-values/', {
                    ticket: ticketId,
                    field_definition: fieldKey,
                    value: payloadValue,
                });
            });

            await Promise.all(savePromises);
            await refresh();
            return true;
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.message || 'Erreur lors de la sauvegarde des valeurs.');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [ticketId, recordIds, refresh, sections, values]);

    const fieldsById = useMemo(() => getFieldById(sections), [sections]);

    return {
        sections,
        values,
        recordIds,
        fieldsById,
        isLoading,
        isSaving,
        error,
        hasSavedValues,
        updateFieldValue,
        saveFieldValue,
        saveAllValues,
        refresh,
    };
}