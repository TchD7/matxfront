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
const ROW_HEIGHT = 70; // Légèrement augmenté pour aérer l'affichage
const TIMELINE_WIDTH = 24 * HOUR_WIDTH;

interface Ticket {
    id: string;
    equipment_name: string;
    technician_id?: string;
    technician_name?: string;
    status?: string;
    planned_at?: string;
    started_at?: string;
    ended_at?: string;
}

// Couleurs plus modernes et adoucies pour les badges de tickets
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: 'gray.100', text: 'gray.700', border: 'gray.300' },
    planned: { bg: 'purple.50', text: 'purple.700', border: 'purple.300' },
    in_progress: { bg: 'blue.50', text: 'blue.700', border: 'blue.300' },
    completed: { bg: 'green.50', text: 'green.700', border: 'green.300' },
    closed: { bg: 'orange.50', text: 'orange.700', border: 'orange.300' },
};

const parseHour = (dateString?: string) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    // Prise en compte des minutes pour un placement ultra-précis au pixel près
    return d.getHours() + d.getMinutes() / 60;
};

const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function InteractiveTimeline({
    technicianId,
    tickets = []
}: {
    date?: string;
    technicianId?: string;
    tickets: Ticket[];
}) {
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    // Filtrer les tickets pour le technicien actif
    const filteredTickets = useMemo(() => {
        if (!technicianId) return [];
        return tickets.filter(t => String(t.technician_id) === String(technicianId));
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
        <Box
            overflowX="auto"
            borderWidth="1px"
            borderRadius="xl"
            bg="gray.50"
            position="relative"
            boxShadow="inner"
        >
            <Box
                position="relative"
                w={`${TIMELINE_WIDTH}px`}
                minH={`${Math.max(filteredTickets.length * ROW_HEIGHT + 100, 300)}px`}
            >
                {/* 1. GRILLE ET EN-TÊTE DES HEURES */}
                {Array.from({ length: 24 }).map((_, i) => (
                    <Box
                        key={i}
                        position="absolute"
                        left={`${i * HOUR_WIDTH}px`}
                        top="0"
                        w={`${HOUR_WIDTH}px`}
                        h="100%"
                        borderLeft="1px dashed"
                        borderColor="gray.200"
                        bg={i % 2 === 0 ? 'whiteAlpha.400' : 'transparent'}
                    >
                        {/* Bandeau des heures */}
                        <Box
                            h="35px"
                            borderBottom="1px solid"
                            borderColor="gray.200"
                            bg="gray.50"
                            display="flex"
                            alignItems="center"
                            px={2}
                        >
                            <Text fontSize="xs" fontWeight="bold" color="gray.500">
                                {String(i).padStart(2, '0')}:00
                            </Text>
                        </Box>
                    </Box>
                ))}

                {/* 2. LIGNE DU TEMPS RÉEL (ROUGE) */}
                <Box
                    position="absolute"
                    left={`${currentHour * HOUR_WIDTH}px`}
                    top="0"
                    h="100%"
                    borderLeft="2px solid"
                    borderColor="red.400"
                    zIndex={3}
                    _after={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-4px',
                        w: '10px',
                        h: '10px',
                        borderRadius: 'full',
                        bg: 'red.400'
                    }}
                />

                {/* 3. AFFICHAGE DES CARTES DE TICKETS */}
                {filteredTickets.length === 0 ? (
                    <Center position="absolute" left="0" right="0" top="100px">
                        <Text color="gray.400" fontSize="sm" fontStyle="italic">
                            Aucune tâche planifiée pour ce technicien aujourd'hui.
                        </Text>
                    </Center>
                ) : (
                    filteredTickets.map((t, index) => {
                        const startHour = parseHour(t.started_at || t.planned_at);
                        const endHour = parseHour(t.ended_at);

                        // Si aucune heure de début n'est disponible, on ne peut pas afficher la carte
                        if (startHour === null) return null;

                        // Gestion intelligente de la durée par défaut (si pas fini ou pas renseigné = 1.5 heure par défaut)
                        let duration = endHour !== null ? endHour - startHour : 1.5;
                        if (duration <= 0) duration = 1.5;

                        const leftPosition = startHour * HOUR_WIDTH;
                        const cardWidth = duration * HOUR_WIDTH;

                        // Récupération de la palette de couleurs en fonction du statut
                        const style = STATUS_COLORS[t.status || 'draft'] || STATUS_COLORS.draft;

                        return (
                            <Box
                                key={t.id}
                                position="absolute"
                                top={`${index * ROW_HEIGHT + 55}px`}
                                left={`${leftPosition}px`}
                                w={`${cardWidth}px`}
                                h="50px"
                                px="4px" // Petit padding externe pour éviter que 2 tickets collés se touchent
                                zIndex={2}
                            >
                                <Tooltip
                                    label={`${t.equipment_name} (${t.status}) - De ${formatTime(t.started_at || t.planned_at)} à ${formatTime(t.ended_at)}`}
                                    aria-label="Détails du ticket"
                                    hasArrow
                                    borderRadius="md"
                                >
                                    <Flex
                                        direction="column"
                                        justify="center"
                                        h="100%"
                                        w="100%"
                                        bg={style.bg}
                                        color={style.text}
                                        borderLeft="4px solid"
                                        borderColor={style.border}
                                        borderRadius="md"
                                        px={3}
                                        boxShadow="sm"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{
                                            boxShadow: 'md',
                                            transform: 'translateY(-1px)'
                                        }}
                                    >
                                        <Text
                                            fontSize="xs"
                                            fontWeight="bold"
                                            noOfLines={1}
                                        >
                                            {t.equipment_name || "Équipement inconnu"}
                                        </Text>

                                        <Text fontSize="10px" opacity={0.8}>
                                            {formatTime(t.started_at || t.planned_at)} - {formatTime(t.ended_at)}
                                        </Text>
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