import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    Button,
    FormControl,
    FormLabel,
    useToast,
    InputGroup,
    InputRightElement,
    IconButton,
    List,
    ListItem,
    Alert,
    AlertIcon,
    Divider,
    Badge,
    Select,
} from '@chakra-ui/react';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../../api/apiClient';

// ================= TYPES =================
interface Technician {
    id: number;
    first_name: string;
    last_name: string;
    team_code: string;
    is_active: boolean;
}

interface TicketPlanningFormProps {
    ticketId: string;
    currentStatus: string;
    onPlanningComplete: () => void;
}

// ================= COMPONENT =================
export default function TicketPlanningForm({
    ticketId,
    currentStatus,
    onPlanningComplete
}: TicketPlanningFormProps) {

    const toast = useToast();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [step, setStep] = useState<'drafting' | 'review'>('drafting');

    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const [plannedDate, setPlannedDate] = useState('');
    const [plannedTime, setPlannedTime] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState(60);
    const [file, setFile] = useState<File | null>(null);

    // ================= TODAY MIN DATE =================
    const today = new Date().toISOString().split('T')[0];

    // ================= FETCH TECHNICIANS =================
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/v1/technicians/');
                const raw = res.data?.results || res.data;
                setTechnicians(Array.isArray(raw) ? raw : []);
            } catch (e) {
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les techniciens',
                    status: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTechnicians();
    }, [toast]);

    // ================= FORMAT TECH =================
    const getTechLabel = (tech: Technician) => {
        const fullName = `${tech.last_name} ${tech.first_name}`.trim();
        return tech.team_code
            ? `${tech.team_code}-${fullName}`
            : fullName;
    };

    // ================= SEARCH (NAME + TEAM CODE) =================
    const filteredTechnicians = useMemo(() => {
        return technicians.filter(t => {
            const label = getTechLabel(t).toLowerCase();

            return (
                label.includes(searchQuery.toLowerCase()) ||
                t.team_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.last_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [technicians, searchQuery]);

    const isValid = selectedTechnician && plannedDate && plannedTime;

    // ================= OUTSIDE CLICK =================
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // ================= SUBMIT =================
    const handleSubmit = async () => {
        if (!isValid || !selectedTechnician) return;

        try {
            setSubmitting(true);

            const plannedAt = `${plannedDate}T${plannedTime}:00`;

            const formData = new FormData();
            formData.append('technician', String(selectedTechnician.id));
            formData.append('planned_at', plannedAt);
            formData.append('estimated_duration', String(estimatedDuration));

            if (file) formData.append('file', file);

            await api.post(`/api/v1/tickets/${ticketId}/assign/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast({
                title: 'Planification réussie',
                status: 'success'
            });

            onPlanningComplete();

        } catch (e: any) {
            toast({
                title: 'Erreur',
                description: e?.response?.data?.detail || 'Erreur serveur',
                status: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!['draft', 'open', 'planned'].includes(currentStatus?.toLowerCase())) {
        return null;
    }

    return (
        <Box p={6} bg="white" borderRadius="lg" border="1px solid #eee">

            <VStack spacing={4} align="stretch">

                <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">
                        Planifier intervention
                    </Text>

                    <Badge colorScheme={step === 'review' ? 'green' : 'purple'}>
                        {step === 'review' ? 'Validation' : 'Informations'}
                    </Badge>
                </HStack>

                <Divider />

                {/* ================= TECH ================= */}
                {step === 'drafting' && (
                    <>
                        <FormControl isRequired>
                            <FormLabel>Technicien</FormLabel>

                            <Box ref={dropdownRef} position="relative">

                                <InputGroup>
                                    <Input
                                        value={
                                            selectedTechnician
                                                ? getTechLabel(selectedTechnician)
                                                : searchQuery
                                        }
                                        placeholder="Rechercher (nom ou code équipe)"
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsOpen(true);
                                        }}
                                        onFocus={() => setIsOpen(true)}
                                    />

                                    {(selectedTechnician || searchQuery) && (
                                        <InputRightElement>
                                            <IconButton
                                                size="xs"
                                                aria-label="clear"
                                                icon={<FiX />}
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSelectedTechnician(null);
                                                }}
                                            />
                                        </InputRightElement>
                                    )}
                                </InputGroup>

                                {isOpen && filteredTechnicians.length > 0 && (
                                    <Box
                                        position="absolute"
                                        bg="white"
                                        w="100%"
                                        border="1px solid #ddd"
                                        borderRadius="md"
                                        maxH="200px"
                                        overflowY="auto"
                                        zIndex={10}
                                    >
                                        <List>
                                            {filteredTechnicians.map(t => (
                                                <ListItem
                                                    key={t.id}
                                                    p={2}
                                                    cursor="pointer"
                                                    _hover={{ bg: 'gray.100' }}
                                                    onClick={() => {
                                                        setSelectedTechnician(t);
                                                        setSearchQuery('');
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    {getTechLabel(t)}
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}

                            </Box>
                        </FormControl>

                        {/* DATE */}
                        <HStack>
                            <FormControl isRequired>
                                <FormLabel>Date</FormLabel>
                                <Input
                                    type="date"
                                    min={today}
                                    value={plannedDate}
                                    onChange={(e) => setPlannedDate(e.target.value)}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Heure</FormLabel>
                                <Input
                                    type="time"
                                    value={plannedTime}
                                    onChange={(e) => setPlannedTime(e.target.value)}
                                />
                            </FormControl>
                        </HStack>

                        {/* DURÉE */}
                        <FormControl>
                            <FormLabel>Durée</FormLabel>
                            <Select
                                value={estimatedDuration}
                                onChange={(e) =>
                                    setEstimatedDuration(Number(e.target.value))
                                }
                            >
                                <option value={30}>30 min</option>
                                <option value={60}>1h</option>
                                <option value={90}>1h30</option>
                                <option value={120}>2h</option>
                            </Select>
                        </FormControl>

                        <Button
                            colorScheme="purple"
                            isDisabled={!isValid}
                            onClick={() => setStep('review')}
                            w="100%"
                        >
                            Continuer
                        </Button>
                    </>
                )}

                {/* ================= REVIEW ================= */}
                {step === 'review' && (
                    <VStack spacing={4} align="stretch">

                        <Alert status="success">
                            <AlertIcon />
                            Vérification finale
                        </Alert>

                        <Box p={3} bg="gray.50" borderRadius="md">
                            <Text>
                                <b>Technicien :</b>{' '}
                                {selectedTechnician && getTechLabel(selectedTechnician)}
                            </Text>
                            <Text>
                                <b>Date :</b> {plannedDate} {plannedTime}
                            </Text>
                            <Text>
                                <b>Durée :</b> {estimatedDuration} min
                            </Text>
                        </Box>

                        <Input
                            type="file"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                        />

                        <HStack>
                            <Button
                                onClick={() => setStep('drafting')}
                                variant="outline"
                            >
                                Modifier
                            </Button>

                            <Button
                                colorScheme="green"
                                onClick={handleSubmit}
                                isLoading={submitting}
                            >
                                Confirmer
                            </Button>
                        </HStack>

                    </VStack>
                )}

            </VStack>

        </Box>
    );
}