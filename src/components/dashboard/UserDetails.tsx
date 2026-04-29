import {
  Box,
  VStack,
  Text,
  Avatar,
  Spinner,
  Center,
  HStack,
  Badge,
  Button,
  Flex,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import { RiArrowLeftLine, RiPrinterLine } from 'react-icons/ri';
import api from '../../api/apiClient';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface UserDetailsProps {
  userId?: string | number | null;
  onBack?: () => void;
}

type FilterType = 'day' | 'week' | 'month';

export default function UserDetails({ userId, onBack }: UserDetailsProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('week');

  const [kpiData, setKpiData] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const url = userId
          ? `/api/v1/customers/users/${userId}/`
          : '/api/v1/customers/users/me/';

        const res = await api.get(url);
        setUser(res.data.data || res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // 🔥 DATA DYNAMIQUE (mock → remplace par API)
  useEffect(() => {
    if (filter === 'day') {
      setKpiData([
        { name: '08h', value: 2 },
        { name: '10h', value: 5 },
        { name: '12h', value: 3 },
        { name: '14h', value: 7 },
        { name: '16h', value: 4 },
        { name: '18h', value: 6 },
        { name: '20h', value: 3 },
        { name: '22h', value: 1 },
        { name: '24h', value: 1 },
        { name: '2h', value: 1 },
        { name: '4h', value: 1 },
        { name: '6h', value: 1 },

      ]);

      setConsumables([
        { name: 'Câble', qty: 5 },
        { name: 'Disjoncteur', qty: 2 },
      ]);
    }

    if (filter === 'week') {
      setKpiData([
        { name: 'Lun', value: 5 },
        { name: 'Mar', value: 8 },
        { name: 'Mer', value: 6 },
        { name: 'Jeu', value: 10 },
        { name: 'Ven', value: 7 },
        { name: 'Sam', value: 9 },
        { name: 'Dim', value: 4 },
      ]);

      setConsumables([
        { name: 'Câble', qty: 20 },
        { name: 'Disjoncteur', qty: 8 },
        { name: 'Prise', qty: 12 },
        { name: 'Prise', qty: 12 },
        { name: 'Prise', qty: 12 },
        { name: 'Prise', qty: 15 },
        { name: 'Prise', qty: 12 },
      ]);
    }

    if (filter === 'month') {
      setKpiData([
        { name: 'Jan', value: 20 },
        { name: 'Fév', value: 35 },
        { name: 'Mar', value: 28 },
        { name: 'Avr', value: 40 },
        { name: 'Mai', value: 32 },
        { name: 'Juin', value: 45 },
        { name: 'Juil', value: 38 },
        { name: 'Aoû', value: 50 },
        { name: 'Sep', value: 42 },
        { name: 'Oct', value: 55 },
        { name: 'Nov', value: 48 },
        { name: 'Déc', value: 60 },
      ]);

      setConsumables([
        { name: 'Câble', qty: 80 },
        { name: 'Disjoncteur', qty: 25 },
        { name: 'Prise', qty: 40 },
      ]);
    }
  }, [filter]);


  const totalConsommation = consumables.reduce((acc, item) => acc + item.qty, 0);

  if (loading) {
    return (
      <Center h="full">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  const isTechnician = user?.role === 'technician';

  return (
    <Box w="full" h="full" overflow="hidden">
      <Flex direction="column" h="full">

        {/* ZONE SCROLLABLE UNIQUE */}
        <Box flex="1" overflowY="auto" pr={2} css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '24px' },
        }}>

          {/* HEADER */}
          <Flex justify="space-between" align="center" mb={6} pt={2}>
            <HStack>
              {onBack && (
                <Button
                  leftIcon={<RiArrowLeftLine />}
                  variant="ghost"
                  onClick={onBack}
                  size="sm"
                >
                  Retour
                </Button>
              )}
            </HStack>

            <HStack spacing={3}>
              <Text fontSize="md" fontWeight="semibold" color="gray.600">
                Profil utilisateur
              </Text>
              <IconButton
                aria-label="Imprimer"
                icon={<RiPrinterLine />}
                size="sm"
                variant="outline"
                onClick={() => window.print()}
              />
            </HStack>
          </Flex>

          {/* PROFIL */}
          <Box
            bg="white"
            borderRadius="xl"
            p={6}
            mb={6}
            border="1px solid"
            borderColor="gray.100"
            shadow="sm"
          >
            <Flex gap={6} align="center" direction={{ base: 'column', md: 'row' }}>
              <Avatar
                size="xl"
                name={`${user?.first_name} ${user?.last_name}`}
                src={user?.profile_picture || undefined}
              />

              <Box flex="1" textAlign={{ base: 'center', md: 'left' }}>
                <Text fontSize="xl" fontWeight="bold">
                  {user?.first_name} {user?.last_name}
                  <Badge ml={3} colorScheme="purple" variant="subtle">
                    {user?.role?.toUpperCase()}
                  </Badge>
                </Text>
                <Text color="gray.500" fontSize="sm">@{user?.username}</Text>

                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6} mt={5}>
                  <InfoBlock label="Email" value={user?.email} />
                  <InfoBlock label="Téléphone" value={user?.phone_number || '-'} />
                  <InfoBlock label="Équipe" value={user?.team_code || '-'} />
                </SimpleGrid>
              </Box>
            </Flex>
          </Box>

          {/* PERFORMANCE */}
          {isTechnician && (
            <Box
              bg="white"
              borderRadius="xl"
              p={6}
              border="1px solid"
              borderColor="gray.100"
              shadow="sm"
              mb={4}
            >
              <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                <Text fontSize="lg" fontWeight="semibold">Performance</Text>
                <HStack spacing={2}>
                  {['day', 'week', 'month'].map((f) => (
                    <Button
                      key={f}
                      size="xs"
                      variant={filter === f ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setFilter(f as FilterType)}
                      textTransform="capitalize"
                    >
                      {f === 'day' ? 'Jour' : f === 'week' ? 'Semaine' : 'Mois'}
                    </Button>
                  ))}
                </HStack>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <KpiCard label="Interventions" value="24" />
                <KpiCard label="Taux réussite" value="92%" />
                <KpiCard label="Temps moyen" value="1.4h" />
              </SimpleGrid>

              {/* GRID PRINCIPAL */}
              <Flex gap={6} direction={{ base: 'column', lg: 'row' }} h={{ lg: "400px" }}>
                {/* CHART - Hauteur fixe pour éviter de pousser le reste */}
                <Box flex="2" h={{ base: "300px", lg: "100%" }} bg="gray.50" p={4} borderRadius="xl">
                  <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#805AD5" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </Box>

                {/* TABLE CONSO - Scroll interne uniquement ici */}
                <Box
                  flex="1"
                  h={{ base: "300px", lg: "100%" }}
                  bg="gray.50"
                  borderRadius="xl"
                  p={4}
                  display="flex"
                  flexDirection="column"
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={3}>Consommables</Text>

                  {/* Cette zone absorbe le surplus de données */}
                  <Box flex="1" overflowY="auto" pr={2} css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: '10px' },
                  }}>
                    <VStack spacing={2} align="stretch">
                      {consumables.map((item, i) => (
                        <Flex key={i} justify="space-between" p={2} bg="white" borderRadius="md" shadow="xs">
                          <Text fontSize="sm">{item.name}</Text>
                          <Badge colorScheme="purple" variant="flat">{item.qty}</Badge>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>

                  <Flex justify="space-between" mt={4} pt={2} borderTop="1px solid" borderColor="gray.200">
                    <Text fontWeight="bold" fontSize="sm">Total</Text>
                    <Text fontWeight="bold" color="purple.600">{totalConsommation}</Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider">{label}</Text>
      <Text fontWeight="medium" fontSize="sm" isTruncated>{value}</Text>
    </Box>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.100">
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Text fontSize="xl" fontWeight="bold" color="gray.700">{value}</Text>
    </Box>
  );
}