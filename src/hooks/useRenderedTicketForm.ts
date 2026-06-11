import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/apiClient';
import type { RenderField, RenderSection, TicketFieldValueRecord } from '../types/formRender.types';

const DEFAULT_DEBOUNCE_MS = 700;

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

const formatValueForApi = (field: RenderField, value: any) => {
    if (field.type === 'checkbox') {
        return Boolean(value);
    }
    if (field.type === 'multi_select') {
        return Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);
    }
    return value;
};

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

    const saveTimeoutRef = useRef<number | null>(null);

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
            const valuesData = valuesResponse.data.results || valuesResponse.data || [];

            const fieldMap = getFieldById(renderData);
            const defaults: Record<string, any> = {};
            renderData.forEach((section) => {
                section.fields?.forEach((field) => {
                    defaults[String(field.id)] = getDefaultValueForType(field);
                });
            });

            const updatedValues = { ...defaults };
            const updatedRecordIds: Record<string, string | number> = {};

            valuesData.forEach((item: any) => {
                const fieldDefId = item.field_definition?.id ?? item.field_definition ?? item.field_definition_id;
                if (!fieldDefId) return;
                const key = String(fieldDefId);
                const field = fieldMap.get(key);
                updatedValues[key] = field ? normalizeTicketValue(field, item.value) : item.value;
                updatedRecordIds[key] = item.id;
            });

            setSections(renderData);
            setValues(updatedValues);
            setRecordIds(updatedRecordIds);
            setHasSavedValues(valuesData.length > 0);
        } catch (renderError: any) {
            const title = renderError?.response?.status === 404 ? 'Point de rendu absent' : 'Erreur de rendu du ticket';
            console.warn('[useRenderedTicketForm] ', title, renderError?.response?.data || renderError.message);
            setError(renderError?.response?.data?.detail || renderError?.message || 'Impossible de charger le rendu backend.');
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
                if (existingRecordId) {
                    await api.patch(`/api/v1/ticket-field-values/${existingRecordId}/`, {
                        value: payloadValue,
                    });
                } else {
                    await api.post('/api/v1/ticket-field-values/', {
                        ticket: ticketId,
                        field_definition: fieldId,
                        value: payloadValue,
                    });
                }

                await refresh();
                return true;
            } catch (saveError: any) {
                setError(saveError?.response?.data?.detail || saveError?.message || 'Erreur de sauvegarde du champ.');
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [ticketId, recordIds, refresh, sections]
    );

    const updateFieldValue = useCallback(
        (fieldId: string | number, value: any) => {
            setValues((prev) => ({ ...prev, [String(fieldId)]: value }));

            if (!ticketId) return;
            if (saveTimeoutRef.current) {
                window.clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = window.setTimeout(() => {
                saveFieldValue(fieldId, value);
            }, DEFAULT_DEBOUNCE_MS);
        },
        [saveFieldValue, ticketId]
    );

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                window.clearTimeout(saveTimeoutRef.current);
            }
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
        } catch (saveAllError: any) {
            setError(saveAllError?.response?.data?.detail || saveAllError?.message || 'Erreur lors de la sauvegarde des valeurs.');
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
