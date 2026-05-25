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
  Circle,
} from '@chakra-ui/react';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser, HiOutlineSearch, HiX, HiOutlineBell } from 'react-icons/hi';
import { FiPlus } from 'react-icons/fi';

interface NotificationItem {
  id: string;
  title: string;
  isRead: boolean;
}

interface NavbarProps {
  user: any;
  notifications?: NotificationItem[]; // Liste des notifications passée par le parent
  onNotificationClick?: (id: string) => void;
  onOpenSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onSearch?: (query: string) => void;
  onCreateTicket?: () => void;
  onViewTickets?: () => void;
  showCreateTicketButton?: boolean;
  showViewTicketsButton?: boolean;
}

export default function Navbar({
  user,
  notifications = [], // Valeur par défaut : tableau vide
  onNotificationClick,
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: true, lg: false });

  // Calcul du nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowMobileSearch(false);
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
        {!showMobileSearch && (
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
        )}

        {/* --- PARTIE CENTRALE : Barre de recherche --- */}
        {(!isMobile || showMobileSearch) && (
          <Flex
            as="form"
            onSubmit={handleSearchSubmit}
            flex={1}
            maxW={isMobile ? "100%" : "500px"}
            mx={isMobile ? 0 : { md: 4, lg: 10 }}
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
                {isMobile && (
                  <IconButton
                    aria-label="Fermer la recherche"
                    icon={<HiX />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMobileSearch(false)}
                    ml={2}
                  />
                )}
              </InputGroup>
            </FormControl>
          </Flex>
        )}

        {/* --- PARTIE DROITE : Actions, Notifications & Profil --- */}
        {!showMobileSearch && (
          <HStack spacing={3} align="center" flexShrink={0}>

            {isMobile && (
              <IconButton
                aria-label="Afficher la barre de recherche"
                icon={<HiOutlineSearch />}
                variant="ghost"
                size="sm"
                borderRadius="full"
                onClick={() => setShowMobileSearch(true)}
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

            {/* --- NOUVEAU COMPOSANT : Système de Notification --- */}
            <Menu isLazy>
              <MenuButton
                as={IconButton}
                aria-label="Notifications"
                icon={
                  <Box position="relative">
                    <HiOutlineBell size="22px" />
                    {unreadCount > 0 && (
                      <Circle
                        position="absolute"
                        top="-2px"
                        right="-2px"
                        bg="red.500"
                        color="white"
                        fontSize="10px"
                        fontWeight="bold"
                        size="16px"
                      >
                        {unreadCount}
                      </Circle>
                    )}
                  </Box>
                }
                variant="ghost"
                borderRadius="full"
                size="sm"
              />
              <MenuList borderRadius="xl" shadow="xl" py={2} minW="280px" maxW="320px" border="none">
                <Box px={4} py={2}>
                  <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
                    Notifications ({unreadCount})
                  </Text>
                </Box>
                <Divider my={1} />

                {notifications.length === 0 ? (
                  <Box px={4} py={3} textAlign="center">
                    <Text fontSize="sm" color="gray.500">Aucune notification</Text>
                  </Box>
                ) : (
                  notifications.map((notif) => (
                    <MenuItem
                      key={notif.id}
                      onClick={() => onNotificationClick?.(notif.id)}
                      bg={notif.isRead ? 'transparent' : 'purple.50'}
                      _hover={{ bg: 'gray.50' }}
                      py={2.5}
                    >
                      <Text fontSize="sm" fontWeight={notif.isRead ? 'normal' : 'semibold'} isTruncated>
                        {notif.title}
                      </Text>
                    </MenuItem>
                  ))
                )}
              </MenuList>
            </Menu>

            {/* Menu Profil */}
            <Menu isLazy>
              <MenuButton
                as={Button}
                variant="ghost"
                p={1}
                borderRadius="full"
                height="auto"
                _hover={{ bg: 'gray.50' }}
                _active={{ bg: 'gray.100' }}
              >
                <HStack spacing={3} px={1}>
                  <Avatar size="sm" name={username} src={avatarSrc} border="2px solid white" boxShadow="sm" />
                  {!isMobile && (
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" maxW="120px" isTruncated>
                      {username}
                    </Text>
                  )}
                </HStack>
              </MenuButton>

              <MenuList borderRadius="xl" shadow="xl" py={2} minW="200px" border="none">
                <Box px={4} py={2}>
                  <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Compte</Text>
                </Box>
                <MenuItem icon={<HiOutlineUser size="18px" />} onClick={onProfileClick} fontWeight="medium">
                  Mon profil
                </MenuItem>
                <Divider my={2} />
                <MenuItem icon={<HiOutlineLogout size="18px" />} color="red.500" onClick={onLogout} fontWeight="bold">
                  Déconnexion
                </MenuItem>
              </MenuList>
            </Menu>

          </HStack>
        )}
      </Flex>
    </Box>
  );
}