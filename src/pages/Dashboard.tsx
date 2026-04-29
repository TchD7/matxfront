import {
  Box,
  Flex,
  VStack,
  Text,
  Spinner,
  Center,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api, { logout as apiLogout } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import UserManager from '../components/dashboard/UserManager';
import UserDetails from '../components/dashboard/UserDetails';

// ================= TYPES =================
type DashboardView = 'home' | 'profile' | 'users' | 'user-detail';

// ================= COMPONENT =================
export default function Dashboard() {

  // ✅ HOOKS (TOUJOURS ICI)
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(() => {
    return localStorage.getItem('selected_user_id');
  });

  const [view, setViewState] = useState<DashboardView>(() =>
    (localStorage.getItem('dashboard_view') as DashboardView) || 'home'
  );

  // ================= LOGOUT CLEAN =================
  const handleLogout = async () => {
    try {
      await apiLogout(() => {
        logout(); // 🔥 reset context
      });
    } catch {
      logout();
    } finally {
      localStorage.removeItem('dashboard_view');
      localStorage.removeItem('selected_user_id');
      navigate('/');
    }
  };

  // ================= NAVIGATION =================
  const setView = (newView: DashboardView, id: string | number | null = null) => {
    setViewState(newView);
    localStorage.setItem('dashboard_view', newView);

    if (newView === 'user-detail' && id) {
      setSelectedUserId(id);
      localStorage.setItem('selected_user_id', id.toString());
    } else if (newView !== 'user-detail') {
      setSelectedUserId(null);
      localStorage.removeItem('selected_user_id');
    }

    onClose();
  };

  // ================= FETCH USER =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/customers/users/me/');
        const userData = res.data.data || res.data;
        setUser(userData);
      } catch (err) {
        console.error('❌ User fetch error:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // ================= LOADING =================
  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  // ================= UI =================
  return (
    <Flex direction="column" h="100vh" bg="gray.50">

      {/* NAVBAR */}
      <Navbar
        user={user}
        onProfileClick={() => setView('profile')}
        onOpenSidebar={onOpen}
        onLogout={handleLogout} // ✅ FIX
      />

      <Flex flex="1" overflow="hidden">

        {/* SIDEBAR DESKTOP */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w="260px"
          bg="white"
          borderRight="1px solid"
          borderColor="gray.100"
        >
          <Sidebar
            user={user}
            view={view}
            onViewChange={setView}
          />
        </Box>

        {/* SIDEBAR MOBILE */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <Sidebar
                user={user}
                view={view}
                onViewChange={(v) => {
                  setView(v);
                  onClose();
                }}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* MAIN CONTENT */}
        <Box
          flex="1"
          overflowY="auto"
          p={{ base: 4, md: 8 }}
        >

          {/* HOME */}
          {view === 'home' && (
            <VStack align="start" spacing={6}>
              <Text fontSize="2xl" fontWeight="bold">
                Tableau de bord
              </Text>

              <Box
                w="full"
                p={6}
                bg="white"
                borderRadius="2xl"
                boxShadow="sm"
                border="1px solid"
                borderColor="gray.100"
              >
                <Text fontSize="md" color="gray.600">
                  Bienvenue dans votre plateforme SaaS.
                </Text>
              </Box>
            </VStack>
          )}

          {/* USERS */}
          {view === 'users' && (
            <UserManager onUserClick={(id) => setView('user-detail', id)} />
          )}

          {/* USER DETAIL */}
          {view === 'user-detail' && (
            <UserDetails
              userId={selectedUserId}
              onBack={() => setView('users')}
            />
          )}

          {/* PROFILE */}
          {view === 'profile' && <UserDetails />}

        </Box>
      </Flex>
    </Flex>
  );
}