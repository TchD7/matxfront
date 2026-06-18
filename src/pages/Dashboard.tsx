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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

import api, { logout as apiLogout } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import UserManager from '../components/dashboard/UserManager';
import UserDetails from '../components/dashboard/UserDetails';
import TicketManager from '../components/dashboard/TicketManager';
import TicketDetailPage from './TicketDetailPage';
import TicketModal from '../components/dashboard/TicketModal';
import DashboardHome from '../components/dashboard/DashboardHome';
import CockpitManager from '../components/cockpit/CockpitManager';
import Logs from './Logs';
import GlobalSearchPage from '../components/layout/GlobalSearchPage';


// ================= TYPES =================
type DashboardView = 'home' | 'profile' | 'users' | 'user-detail' | 'tickets' | 'ticket-detail' | 'cockpit' | 'logs' | 'search';

// ================= COMPONENT =================
export default function Dashboard() {
  // ✅ HOOKS
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // État pour l'ID utilisateur sélectionné (conservation au rafraîchissement)
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(() => {
    return localStorage.getItem('selected_user_id');
  });

  // État pour l'ID du ticket sélectionné
  const [selectedTicketId, setSelectedTicketId] = useState<string | number | null>(null);

  // État pour la vue actuelle (conservation au rafraîchissement)
  const [view, setViewState] = useState<DashboardView>(() =>
    (localStorage.getItem('dashboard_view') as DashboardView) || 'home'
  );
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketRefreshTrigger, setTicketRefreshTrigger] = useState(0);
  const q = searchParams.get('q') || '';

  useEffect(() => {
    if (q && view !== 'search') {
      setView('search');
    } else if (!q && view === 'search') {
      setView('home');
    }
  }, [q, view]);
  const handleDuplicateSuccess = (
    duplicatedTicketId: string | number
) => {
    setView('ticket-detail', duplicatedTicketId);
};
  // ================= LOGOUT CLEAN =================
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      logout();
      localStorage.removeItem('dashboard_view');
      localStorage.removeItem('selected_user_id');
      navigate('/');
    }
  };

  // ================= NAVIGATION =================
  const setView = (newView: DashboardView, id: string | number | null = null) => {
    setViewState(newView);
    localStorage.setItem('dashboard_view', newView);

    // Gestion spécifique pour le détail utilisateur
    if (newView === 'user-detail' && id) {
      setSelectedUserId(id);
      localStorage.setItem('selected_user_id', id.toString());
    } else if (newView !== 'user-detail') {
      setSelectedUserId(null);
      localStorage.removeItem('selected_user_id');
    }

    // Gestion spécifique pour le détail de ticket
    if (newView === 'ticket-detail' && id) {
      setSelectedTicketId(id);
    } else if (newView !== 'ticket-detail') {
      setSelectedTicketId(null);
    }

    onClose(); // Ferme le drawer mobile si ouvert
  };

  const openCreateTicketModal = () => {
    setIsTicketModalOpen(true);
  };

  const goToTicketsView = () => {
    setView('tickets');
  };

  const goToLogsView = () => {
    setView('logs');
  };

  const goToSearchView = (search: string) => {
    if (search.trim()) {
      setSearchParams({ q: search.trim() });
      setView('search');
    }
  };

  const handleTicketSuccess = (createdId?: string | number) => {
    setIsTicketModalOpen(false);
    setTicketRefreshTrigger((prev) => prev + 1);

    // Si l'API a renvoyé l'ID du ticket créé, naviguer vers la vue détail
    if (createdId) {
      setView('ticket-detail', createdId);
    }
  };

  // ================= FETCH AUTHENTICATED USER =================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/customers/users/me/');
        // On s'adapte à la structure de réponse (data wrapper ou direct)
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

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <Spinner size="xl" color="purple.500" thickness="4px" />
      </Center>
    );
  }

  // ================= UI RENDERING =================
  return (
    <Flex direction="column" h="100vh" bg="gray.50">
      {/* NAVBAR : Identité utilisateur et actions rapides */}
      <Navbar
        user={user}
        onProfileClick={() => setView('profile')}
        onOpenSidebar={onOpen}
        onLogout={handleLogout}
        onSearch={goToSearchView}
        onCreateTicket={openCreateTicketModal}
        onViewTickets={goToTicketsView}
        onViewLogs={goToLogsView}
        showCreateTicketButton={true}
        showViewTicketsButton={true}
        showLogsButton={true}
      />

      <Flex flex="1" overflow="hidden">
        {/* SIDEBAR DESKTOP : Navigation latérale fixe */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w="260px"
          bg="white"
          borderRight="1px solid"
          borderColor="gray.100"
        >
          <Sidebar user={user} view={view} onViewChange={setView} />
        </Box>

        {/* SIDEBAR MOBILE : Menu escamotable */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <Sidebar
                user={user}
                view={view}
                onViewChange={(v: DashboardView) => {
                  setView(v);
                  onClose();
                }}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* MAIN CONTENT AREA */}
        <Box flex="1" overflowY="auto" p={{ base: 4, md: 8 }}>
          {/* Remplacez toute votre logique de rendu conditionnel (if view === ...) par ceci : */}



          {/* HOME */}
          {view === 'home' && (

            <DashboardHome
              user={user}
            />

          )}

          {/* VUE : GESTION DES TICKETS (CRUD) */}
          {view === 'tickets' && (
            <TicketManager
              ticketRefreshTrigger={ticketRefreshTrigger}
              onTicketClick={(id) => setView('ticket-detail', id)}
            />
          )}

          {/* VUE : DÉTAILS D'UN TICKET */}
          {view === 'ticket-detail' && selectedTicketId && (
            <TicketDetailPage
              ticketId={selectedTicketId}
              onBack={() => setView('tickets')}
              onDuplicateSuccess={handleDuplicateSuccess}

            />
          )}

          {/* VUE : GESTION DES UTILISATEURS */}
          {view === 'users' && (
            <UserManager onUserClick={(id) => setView('user-detail', id)} />
          )}

          {/* VUE : DÉTAILS D'UN UTILISATEUR */}
          {view === 'user-detail' && (
            <UserDetails
              userId={selectedUserId}
              onBack={() => setView('users')}
            />
          )}

          {/* VUE : PROFIL PERSONNEL (Réutilise UserDetails sans ID pour le "Me") */}
          {view === 'profile' && <UserDetails onBack={() => setView('home')} />}

          {/* VUE : COCKPIT (Équipements & Interventions) */}
          {view === 'cockpit' && (
            <CockpitManager />
          )}

          {/* VUE : SEARCH GLOBALE */}
          {view === 'search' && (
            <GlobalSearchPage query={q} />
          )}

          {/* VUE : LOGS (tickets draft) */}
          {view === 'logs' && (
            <Logs onBack={() => setView('home')} />
          )}


        </Box>
      </Flex>

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSuccess={handleTicketSuccess}
      />
    </Flex>
  );
}