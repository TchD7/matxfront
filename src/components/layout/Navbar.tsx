import {
  Box,
  Flex,
  HStack,
  IconButton,
  Avatar,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useBreakpointValue,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
} from '@chakra-ui/react';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser, HiOutlineSearch } from 'react-icons/hi';
import { FiPlus } from 'react-icons/fi';

interface NavbarProps {
  user: any;
  onOpenSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onSearch?: (query: string) => void; // Déclenché lors de la validation (Entrée ou Loupe)
  onCreateTicket?: () => void;
  onViewTickets?: () => void;
  showCreateTicketButton?: boolean;
  showViewTicketsButton?: boolean;
}

export default function Navbar({
  user,
  onOpenSidebar,
  onProfileClick,
  onLogout,
  onSearch,
  onCreateTicket,
  onViewTickets,
  showCreateTicketButton = false,
  showViewTicketsButton = false,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Breakpoints pour adapter l'affichage
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: true, lg: false });

  // Gestion de la recherche
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      // On envoie la requête nettoyée (trim) à la fonction parente
      onSearch(searchQuery.trim());
    }
  };

  const username = user?.username || user?.email || 'Utilisateur';
  const avatarSrc = user?.profile_picture || user?.avatar || '';

  return (
    <Box
      bg="white"
      px={{ base: 4, md: 6 }}
      py={3}
      borderBottom="1px solid"
      borderColor="gray.100"
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Flex align="center" justify="space-between">

        {/* --- PARTIE GAUCHE : Logo & Toggle Menu --- */}
        <HStack spacing={4} align="center" flexShrink={0}>
          {isMobile && (
            <IconButton
              aria-label="Ouvrir le menu"
              icon={<HiOutlineMenu />}
              variant="ghost"
              size="md"
              onClick={onOpenSidebar}
            />
          )}

          <Text
            fontSize="lg"
            fontWeight="bold"
            color="purple.600"
            letterSpacing="tight"
            cursor="pointer"
            onClick={() => window.location.href = '/'}
          >
            MATX
          </Text>
        </HStack>

        {/* --- PARTIE CENTRALE : Barre de recherche (Masquée sur Mobile) --- */}
        {!isMobile && (
          <Flex
            as="form"
            onSubmit={handleSearchSubmit}
            flex={1}
            maxW="500px"
            mx={{ md: 4, lg: 10 }}
          >
            <FormControl>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <HiOutlineSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Rechercher un n° de ticket (ex: TCK-000001)..."
                  bg="gray.50"
                  border="none"
                  borderRadius="lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  _focus={{
                    bg: 'white',
                    ring: 2,
                    ringColor: 'purple.200',
                    border: '1px solid',
                    borderColor: 'purple.600'
                  }}
                  transition="all 0.2s"
                />
              </InputGroup>
            </FormControl>
          </Flex>
        )}

        {/* --- PARTIE DROITE : Actions & Profil --- */}
        <HStack spacing={3} align="center" flexShrink={0}>

          {/* Icône Loupe seule sur Mobile */}
          {isMobile && (
            <IconButton
              aria-label="Rechercher"
              icon={<HiOutlineSearch />}
              variant="ghost"
              size="sm"
              borderRadius="full"
            />
          )}

          {showViewTicketsButton && onViewTickets && !isTablet && (
            <Button size="sm" variant="ghost" onClick={onViewTickets} borderRadius="full">
              Liste Tickets
            </Button>
          )}

          {showCreateTicketButton && onCreateTicket && (
            <Button
              size="sm"
              colorScheme="purple"
              variant="solid"
              onClick={onCreateTicket}
              leftIcon={<FiPlus />}
              borderRadius="full"
              boxShadow="sm"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            >
              {!isMobile ? "Nouveau Ticket" : ""}
            </Button>
          )}

          {/* Menu Utilisateur */}
          <Menu isLazy>
            <MenuButton>
              <HStack
                spacing={3}
                px={2}
                py={1}
                borderRadius="full"
                _hover={{ bg: 'gray.50' }}
                transition="0.2s"
              >
                <Avatar
                  size="sm"
                  name={username}
                  src={avatarSrc}
                  border="2px solid white"
                  boxShadow="sm"
                />
                {!isMobile && (
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" maxW="120px" isTruncated>
                    {username}
                  </Text>
                )}
              </HStack>
            </MenuButton>

            <MenuList borderRadius="xl" shadow="xl" py={2} minW="200px" border="none">
              <Box px={4} py={2}>
                <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
                  Compte
                </Text>
              </Box>

              <MenuItem icon={<HiOutlineUser size="18px" />} onClick={onProfileClick} fontWeight="medium">
                Mon profil
              </MenuItem>

              <Divider my={2} />

              <MenuItem
                icon={<HiOutlineLogout size="18px" />}
                color="red.500"
                onClick={onLogout}
                fontWeight="bold"
              >
                Déconnexion
              </MenuItem>
            </MenuList>
          </Menu>

        </HStack>
      </Flex>
    </Box>
  );
}