import {
  Box, Flex, HStack, IconButton, Avatar, Text, Button, Menu, MenuButton,
  MenuList, MenuItem, Divider, useBreakpointValue, Circle,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser, HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';
import { FiPlus } from 'react-icons/fi';
import SearchBar from './SearchBar';

// --- Types ---
interface NotificationItem { id: string; title: string; isRead: boolean; }

interface NavbarProps {
  user: any;
  notifications?: NotificationItem[];
  onNotificationClick?: (id: string) => void;
  onOpenSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onSearch?: (query: string) => void;
  onCreateTicket?: () => void;
  onViewTickets?: () => void;
  onViewLogs?: () => void;
  showCreateTicketButton?: boolean;
  showViewTicketsButton?: boolean;
  showLogsButton?: boolean;
}

export default function Navbar({
  user, notifications = [], onNotificationClick, onOpenSidebar, onProfileClick,
  onLogout, onSearch, onCreateTicket, onViewTickets, onViewLogs,
  showCreateTicketButton, showViewTicketsButton, showLogsButton
}: NavbarProps) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: true, lg: false });
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setShowMobileSearch(false);
    }
  };

  return (
    <Box bg="white" px={{ base: 4, md: 6 }} py={3} borderBottom="1px solid" borderColor="gray.100" position="sticky" top="0" zIndex="1000">
      <Flex align="center" justify="space-between">

        {/* --- Left Section --- */}
        {!showMobileSearch && (
          <HStack spacing={4}>
            {isMobile && <IconButton aria-label="Menu" icon={<HiOutlineMenu />} variant="ghost" onClick={onOpenSidebar} />}
            <Text fontSize="lg" fontWeight="bold" color="purple.600" cursor="pointer" onClick={() => window.location.href = '/'}>MATX</Text>

          </HStack>

        )}
        {/* <Flex align="center" justify="center" flex={1}> */}
        {showLogsButton && onViewLogs && !isTablet && (
          <Button size="sm" variant="ghost" onClick={onViewLogs} borderRadius="full">Logs</Button>
        )}
        {/* </Flex> */}


        {/* --- Center Section (Search) --- */}
        {(!isMobile || showMobileSearch) && (
          <Flex flex={1} maxW={isMobile ? "100%" : "500px"} mx={isMobile ? 0 : { md: 4, lg: 10 }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} onSubmit={handleSearch} onClear={() => setSearchQuery('')} mb={0} />
          </Flex>
        )}

        {/* --- Right Section --- */}
        {!showMobileSearch && (
          <HStack spacing={3}>
            {isMobile && <IconButton aria-label="Search" icon={<HiOutlineSearch />} variant="ghost" size="sm" onClick={() => setShowMobileSearch(true)} />}
            {showViewTicketsButton && onViewTickets && !isTablet && <Button size="sm" variant="ghost" onClick={onViewTickets} borderRadius="full">Liste Tickets</Button>}
            {showCreateTicketButton && onCreateTicket && (
              <Button size="sm" colorScheme="purple" onClick={onCreateTicket} leftIcon={<FiPlus />} borderRadius="full">
                {!isMobile && "Nouveau Ticket"}
              </Button>
            )}

            {/* Notifications */}
            <Menu isLazy>
              <MenuButton as={IconButton} aria-label="Notifications" icon={<Box position="relative"><HiOutlineBell size="22px" />{unreadCount > 0 && <Circle position="absolute" top="-2px" right="-2px" bg="red.500" color="white" fontSize="10px" size="16px">{unreadCount}</Circle>}</Box>} variant="ghost" borderRadius="full" size="sm" />
              <MenuList borderRadius="xl" shadow="xl" minW="280px">
                <Box px={4} py={2}><Text fontSize="xs" color="gray.400" fontWeight="bold">NOTIFICATIONS ({unreadCount})</Text></Box>
                <Divider />
                {notifications.length === 0 ? <Box p={4} textAlign="center"><Text fontSize="sm" color="gray.500">Aucune notification</Text></Box> :
                  notifications.map(n => <MenuItem key={n.id} onClick={() => onNotificationClick?.(n.id)} bg={n.isRead ? 'transparent' : 'purple.50'}>{n.title}</MenuItem>)
                }
              </MenuList>
            </Menu>

            {/* Profile */}
            <Menu isLazy>
              <MenuButton as={Button} variant="ghost" borderRadius="full" px={1}>
                <HStack spacing={2} px={1}>
                  <Avatar size="sm" name={user?.username} src={user?.profile_picture} />
                  {!isMobile && <Text fontSize="sm" isTruncated maxW="100px">{user?.username || 'Utilisateur'}</Text>}
                </HStack>
              </MenuButton>
              <MenuList borderRadius="xl" shadow="xl" minW="200px">
                <MenuItem icon={<HiOutlineUser />} onClick={onProfileClick}>Mon profil</MenuItem>
                <Divider my={1} />
                <MenuItem icon={<HiOutlineLogout />} color="red.500" onClick={onLogout} fontWeight="bold">Déconnexion</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        )}
      </Flex>
    </Box>
  );
}