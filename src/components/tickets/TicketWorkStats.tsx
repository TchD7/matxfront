import { SimpleGrid, Stat, StatLabel, StatNumber, Card, CardBody } from '@chakra-ui/react';
// 1. Import de Ticket au lieu de TicketDetail
import type { Ticket } from './types/ticket';
// 2. Import de la fonction depuis le bon dossier utils
import { formatDuration } from '../../utils/timeHelpers';

interface Props {
  // 3. Utilisation de l'interface Ticket unique
  ticket: Pick<Ticket, 'total_work_minutes' | 'pause_minutes' | 'pause_count' | 'start_delay_minutes'>;
}

export const TicketWorkStats = ({ ticket }: Props) => {
  const stats = [
    { label: 'Temps de travail réel', value: formatDuration(ticket.total_work_minutes) },
    { label: 'Temps de pause', value: formatDuration(ticket.pause_minutes) },
    { label: 'Nombre de pauses', value: ticket.pause_count?.toString() || '0' },
    { label: 'Retard accusé', value: formatDuration(ticket.start_delay_minutes) },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
      {stats.map((stat, index) => (
        <Card key={index} variant="outline">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500">{stat.label}</StatLabel>
              <StatNumber fontSize="xl">{stat.value}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};