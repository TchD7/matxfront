import type{ FieldDefinition } from './types';

export function wouldCreateCycle(
    fields: FieldDefinition[],
    sourceFieldId: string | number,
    targetFieldId: string | number | null
): boolean {
    if (!targetFieldId) return false;

    const graph = new Map<string | number, string | number | null>();

    fields.forEach((field) => {
        graph.set(field.id, field.depends_on_field_id || null);
    });

    graph.set(sourceFieldId, targetFieldId);

    let current = targetFieldId;
    const visited = new Set();

    while (current) {
        if (current === sourceFieldId) {
            return true;
        }

        if (visited.has(current)) {
            break;
        }

        visited.add(current);
        current = graph.get(current) || null;
    }

    return false;
}