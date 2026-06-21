import {
  Box,
  Flex,
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
import { useNavigate, useSearchParams, Outlet, useLocation } from 'react-router-dom';

import api, { logout as apiLogout } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import UserManager from '../components/dashboard/UserManager';
import UserDetails from '../components/dashboard/UserDetails';
import TicketModal from '../components/dashboard/TicketModal';
import DashboardHome from '../components/dashboard/DashboardHome';
import CockpitManager from '../components/cockpit/CockpitManager';
import Logs from './Logs';
import GlobalSearchPage from '../components/layout/GlobalSearchPage';

// ================= TYPES =================
type DashboardView = 'home' | 'profile' | 'users' | 'user-detail' | 'tickets' | 'ticket-detail' | 'cockpit' | 'logs' | 'search';

// ================= COMPONENT =================
export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Ajout pour suivre l'URL
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // État pour les IDs sélectionnés (hors tickets qui utilisent désormais useParams)
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(() => localStorage.getItem('selected_user_id'));

  // État pour la vue actuelle
  const [view, setViewState] = useState<DashboardView>(() => (localStorage.getItem('dashboard_view') as DashboardView) || 'home');

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketRefreshTrigger, setTicketRefreshTrigger] = useState(0);
  const q = searchParams.get('q') || '';
  const isTicketRoute = location.pathname.includes('/tickets');

  // Synchronisation search
  useEffect(() => {
    if (q && view !== 'search') setView('search');
    else if (!q && view === 'search') setView('home');
  }, [q, view]);

  // Synchronisation de la Sidebar avec React Router (Pour garder le bouton "Tickets" en surbrillance)
  useEffect(() => {
    if (location.pathname.includes('/dashboard/tickets')) {
      setViewState('tickets');
    }
  }, [location.pathname]);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    finally {
      logout();
      localStorage.removeItem('dashboard_view');
      localStorage.removeItem('selected_user_id');
      navigate('/');
    }
  };

  // ================= NAVIGATION UNIFORMISÉE =================
  const setView = (newView: DashboardView, id: string | number | null = null) => {
    // Navigation gérée par React Router
    if (newView === 'tickets') {
      navigate('/dashboard/tickets');
      onClose();
      return;
    }
    if (newView === 'ticket-detail' && id) {
      navigate(`/dashboard/tickets/${id}`);
      onClose();
      return;
    }

    // NOUVEAU : Si on clique sur une autre page, on doit "vider" l'URL des tickets
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    // Gestion à l'ancienne (Pour les autres pages non migrées)
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

  const handleTicketSuccess = (createdId?: string | number) => {
    setIsTicketModalOpen(false);
    setTicketRefreshTrigger((prev) => prev + 1);

    // Redirection propre via React Router après création
    if (createdId) {
      navigate(`/dashboard/tickets/${createdId}`);
    } else {
      navigate('/dashboard/tickets');
    }
  };

  // ================= FETCH USER =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/customers/users/me/');
        setUser(res.data.data || res.data);
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <Center h="100vh" bg="gray.50"><Spinner size="xl" color="purple.500" /></Center>;

  return (
    <Flex direction="column" h="100vh" bg="gray.50">
      <Navbar
        user={user}
        onProfileClick={() => setView('profile')}
        onOpenSidebar={onOpen}
        onLogout={handleLogout}
        onSearch={(s) => { if (s.trim()) { setSearchParams({ q: s.trim() }); setView('search'); } }}
        onCreateTicket={() => setIsTicketModalOpen(true)}
        onViewTickets={() => navigate('/dashboard/tickets')} // Forcé sur navigate
        onViewLogs={() => setView('logs')}
        showCreateTicketButton={true}
        showViewTicketsButton={true}
        showLogsButton={true}
      />

      <Flex flex="1" overflow="hidden">
        <Box display={{ base: 'none', md: 'block' }} w="260px" bg="white" borderRight="1px solid" borderColor="gray.100">
          <Sidebar user={user} view={view} onViewChange={setView} />
        </Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}><Sidebar user={user} view={view} onViewChange={(v) => { setView(v); onClose(); }} /></DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box flex="1" overflowY="auto" p={{ base: 4, md: 8 }}>

          {/* L'Outlet s'occupe UNIQUEMENT des tickets grâce à l'URL */}
          <Outlet />

          {/* On désactive TOUT le reste si on est sur la page d'un ticket */}
          {!isTicketRoute && (
            <>
              {view === 'home' && <DashboardHome user={user} />}

              {view === 'users' && <UserManager onUserClick={(id) => setView('user-detail', id)} />}

              {view === 'user-detail' && selectedUserId && (
                <UserDetails userId={selectedUserId} onBack={() => setView('users')} />
              )}

              {view === 'profile' && <UserDetails onBack={() => setView('home')} />}

              {view === 'cockpit' && <CockpitManager />}

              {view === 'search' && <GlobalSearchPage query={q} />}

              {view === 'logs' && <Logs onBack={() => setView('home')} />}
            </>
          )}
        </Box>
      </Flex>

      {/* J'ai conservé le trigger au cas où TicketManager est monté via l'Outlet et a besoin de ce refresh. 
          Idéalement, avec React Query on ferait un `queryClient.invalidateQueries()`, 
          mais cela permet de ne pas casser votre code actuel. */}
      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onSuccess={handleTicketSuccess} />
    </Flex>
  );
}