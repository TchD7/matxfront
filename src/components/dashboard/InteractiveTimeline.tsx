import {
    Box,
    Text,
    Spinner,
    Center,
    Flex,
    Tooltip
} from '@chakra-ui/react';

import { useEffect, useMemo, useState } from 'react';

const HOUR_WIDTH = 150;
const ROW_HEIGHT = 70;
const TIMELINE_WIDTH = 24 * HOUR_WIDTH;

interface Ticket {
    id: string | number;
    equipment_name: string;
    technician_id?: string | number;
    technician_name?: string;
    status?: string;
    planned_at?: string;
    started_at?: string;
    ended_at?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: 'gray.100', text: 'gray.700', border: 'gray.300' },
    planned: { bg: 'purple.50', text: 'purple.700', border: 'purple.300' },
    in_progress: { bg: 'blue.50', text: 'blue.700', border: 'blue.300' },
    completed: { bg: 'green.50', text: 'green.700', border: 'green.300' },
    closed: { bg: 'orange.50', text: 'orange.700', border: 'orange.300' },
};

const parseHour = (dateString?: string) => {
    if (!dateString) return null;
    if (dateString.includes(':') && !dateString.includes('-') && !dateString.includes('T')) {
        const parts = dateString.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        return isNaN(h) ? null : h + m / 60;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.getHours() + d.getMinutes() / 60;
};

const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    if (dateString.includes(':') && !dateString.includes('-')) {
        return dateString.substring(0, 5);
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function InteractiveTimeline({
    technicianId,
    tickets = []
}: {
    date?: string;
    technicianId?: string | null | number;
    tickets: Ticket[];
}) {
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    const filteredTickets = useMemo(() => {
        if (!technicianId) return [];

        // LOG TEMPORAIRE POUR VOIR LA STRUCTURE REÇUE DE L'API
        if (tickets.length > 0) {
            console.log("👉 STRUCTURE DU PREMIER TICKET :", tickets[0]);
        } else {
            console.log("⚠ Le tableau 'tickets' reçu par la Timeline est complètement VIDE !");
        }

        const result = tickets.filter(t => {
            // Test 1: t.technician_id direct
            if (t.technician_id && String(t.technician_id) === String(technicianId)) return true;

            // Test 2: Objet imbriqué t.technician.id
            const nestedTech = (t as any).technician;
            if (nestedTech && nestedTech.id && String(nestedTech.id) === String(technicianId)) return true;

            // Test 3: Clé alternative t.user_id ou t.technicien_id
            if ((t as any).user_id && String((t as any).user_id) === String(technicianId)) return true;
            if ((t as any).technicien_id && String((t as any).technicien_id) === String(technicianId)) return true;

            return false;
        });

        console.log("=== DEBUG FILTRAGE FLUIDE ===");
        console.log("ID recherché :", technicianId);
        console.log("Tickets trouvés après ce filtre :", result);

        return result;
    }, [tickets, technicianId]);

    useEffect(() => {
        setLoading(false);
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Center h="300px">
                <Spinner color="purple.500" size="xl" thickness="4px" />
            </Center>
        );
    }

    const currentHour = now.getHours() + now.getMinutes() / 60;

    return (
        <Box overflowX="auto" borderWidth="1px" borderRadius="xl" bg="gray.50" position="relative" boxShadow="inner">
            <Box position="relative" w={`${TIMELINE_WIDTH}px`} minH={`${Math.max(filteredTickets.length * ROW_HEIGHT + 100, 300)}px`}>
                {/* GRILLE HORAIRE */}
                {Array.from({ length: 24 }).map((_, i) => (
                    <Box key={i} position="absolute" left={`${i * HOUR_WIDTH}px`} top="0" w={`${HOUR_WIDTH}px`} h="100%" borderLeft="1px dashed" borderColor="gray.200" bg={i % 2 === 0 ? 'whiteAlpha.400' : 'transparent'}>
                        <Box h="35px" borderBottom="1px solid" borderColor="gray.200" bg="gray.50" display="flex" alignItems="center" px={2}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500">{String(i).padStart(2, '0')}:00</Text>
                        </Box>
                    </Box>
                ))}

                {/* TEMPS RÉEL */}
                <Box position="absolute" left={`${currentHour * HOUR_WIDTH}px`} top="0" h="100%" borderLeft="2px solid" borderColor="red.400" zIndex={3} _after={{ content: '""', position: 'absolute', top: 0, left: '-4px', w: '10px', h: '10px', borderRadius: 'full', bg: 'red.400' }} />

                {/* CARTES DES TICKETS */}
                {!technicianId ? (
                    <Center position="absolute" left="0" right="0" top="120px">
                        <Text color="gray.400" fontSize="sm" fontStyle="italic">Sélectionnez un technicien à gauche pour visualiser son planning.</Text>
                    </Center>
                ) : filteredTickets.length === 0 ? (
                    <Center position="absolute" left="0" right="0" top="120px">
                        <Text color="gray.400" fontSize="sm" fontStyle="italic">Aucune tâche planifiée trouvée pour ce technicien aujourd'hui.</Text>
                    </Center>
                ) : (
                    filteredTickets.map((t, index) => {
                        const startHour = parseHour(t.started_at || t.planned_at);
                        const endHour = parseHour(t.ended_at);

                        if (startHour === null) return null;

                        let duration = endHour !== null ? endHour - startHour : 1.5;
                        if (duration <= 0) duration = 1.5;

                        const leftPosition = startHour * HOUR_WIDTH;
                        const cardWidth = duration * HOUR_WIDTH;
                        const style = STATUS_COLORS[t.status || 'draft'] || STATUS_COLORS.draft;

                        return (
                            <Box key={t.id} position="absolute" top={`${index * ROW_HEIGHT + 65}px`} left={`${leftPosition}px`} w={`${cardWidth}px`} h="50px" px="4px" zIndex={2}>
                                <Tooltip label={`${t.equipment_name} (${t.status || 'draft'}) - De ${formatTime(t.started_at || t.planned_at)} à ${formatTime(t.ended_at)}`} aria-label="Détails" hasArrow borderRadius="md">
                                    <Flex direction="column" justify="center" h="100%" w="100%" bg={style.bg} color={style.text} borderLeft="4px solid" borderColor={style.border} borderRadius="md" px={3} boxShadow="sm" cursor="pointer" transition="all 0.2s" _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}>
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{t.equipment_name || "Sans nom"}</Text>
                                        <Text fontSize="10px" opacity={0.8}>{formatTime(t.started_at || t.planned_at)} - {formatTime(t.ended_at)}</Text>
                                    </Flex>
                                </Tooltip>
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}