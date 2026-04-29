import { VStack, Text, Box, Spacer } from '@chakra-ui/react';

export default function Sidebar({ view, onViewChange, user }) {
  const Item = ({ label, value }) => (
    <Box
      w="full"
      px={4}
      py={2}
      borderRadius="lg"
      cursor="pointer"
      bg={view === value ? 'purple.50' : 'transparent'}
      color={view === value ? 'purple.600' : 'gray.600'}
      fontWeight={view === value ? 'semibold' : 'normal'}
      _hover={{ bg: 'gray.50' }}
      onClick={() => onViewChange(value)}
    >
      {label}
    </Box>
  );

  return (
    <VStack align="start" h="full" spacing={2} p={4}>
      
      {/* MENU */}
      <Item label="Accueil" value="home" />
      <Item label="Cockpit" value="cockpit" />
      <Item label="Utilisateurs" value="users" />
      <Item label="Indicateurs" value="stats" />

      <Spacer />

      {/* FOOTER CLIENT */}
      <Box
        w="full"
        p={3}
        borderTop="1px solid"
        borderColor="gray.100"
      >
        <Text fontSize="xs" color="gray.400">
          Organisation
        </Text>
        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
          {user?.client_name || "Client inconnu"}
        </Text>
      </Box>
    </VStack>
  );
}