import { 
    Box, Flex, VStack, Text, Button, Divider, Spinner, Center, 
    IconButton, Drawer, DrawerBody, DrawerOverlay, 
    DrawerContent, DrawerCloseButton, useDisclosure 
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiDashboardLine, RiUserLine, RiTeamLine, RiLogoutBoxRLine, RiMenuLine } from 'react-icons/ri';
import api, { logout } from '../api/apiClient';
import UserManager from '../components/dashboard/UserManager';
import UserDetails from '../components/dashboard/UserDetails'; 

// Définition des types de vues
type DashboardView = 'home' | 'profile' | 'users' | 'user-detail';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Initialisation de l'ID depuis le localStorage pour survivre au rafraîchissement
    const [selectedUserId, setSelectedUserId] = useState<string | number | null>(() => {
        return localStorage.getItem('selected_user_id');
    });

    // Initialisation de la vue depuis le localStorage
    const [view, setViewState] = useState<DashboardView>(() => 
        (localStorage.getItem('dashboard_view') as DashboardView) || 'home'
    );
    
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

    // Fonction de navigation améliorée
    const setView = (newView: DashboardView, id: string | number | null = null) => {
        setViewState(newView);
        localStorage.setItem('dashboard_view', newView);

        if (newView === 'user-detail' && id) {
            setSelectedUserId(id);
            localStorage.setItem('selected_user_id', id.toString());
        } else if (newView !== 'user-detail') {
            // Si on change de module, on nettoie l'ID utilisateur
            setSelectedUserId(null);
            localStorage.removeItem('selected_user_id');
        }
        onClose(); // Ferme le menu mobile si ouvert
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/v1/customers/users/me/'); 
                setUser(res.data);
            } catch (err) {
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = async () => {
        localStorage.removeItem('dashboard_view');
        localStorage.removeItem('selected_user_id');
        await logout();
    };

    if (loading) return <Center h="100vh"><Spinner size="xl" color="purple.500" /></Center>;

    const SidebarContent = () => (
        <VStack h="full" bg="gray.900" color="white" p={5} align="stretch" spacing={4}>
            <Box mb={8} px={2}>
                <Text fontSize="2xl" fontWeight="bold" color="purple.400">MATX</Text>
                <Text fontSize="xs" color="gray.500">{user?.client_name}</Text>
            </Box>

            <VStack align="stretch" spacing={2} flex="1">
                <NavButton 
                    icon={<RiDashboardLine />} 
                    label="Tableau de bord" 
                    isActive={view === 'home'} 
                    onClick={() => setView('home')} 
                />
                {user?.role === 'admin' && (
                    <NavButton 
                        icon={<RiTeamLine />} 
                        label="Utilisateurs" 
                        isActive={view === 'users' || view === 'user-detail'} 
                        onClick={() => setView('users')} 
                    />
                )}
            </VStack>

            <Divider borderColor="gray.700" />
            <NavButton 
                icon={<RiUserLine />} 
                label="Mon Profil" 
                isActive={view === 'profile'} 
                onClick={() => setView('profile')} 
            />
            <Button 
                leftIcon={<RiLogoutBoxRLine />} 
                variant="ghost" 
                colorScheme="red" 
                onClick={handleLogout} 
                justifyContent="start"
            >
                Déconnexion
            </Button>
        </VStack>
    );

    return (
        <Flex h="100vh" overflow="hidden" direction="column">
            {/* Header Mobile */}
            <Flex 
                display={{ base: "flex", md: "none" }} 
                bg="gray.900" 
                p={4} 
                color="white" 
                align="center" 
                justify="space-between"
            >
                <Text fontWeight="bold" color="purple.400">MATX</Text>
                <IconButton 
                    aria-label="Open Menu" 
                    icon={<RiMenuLine />} 
                    onClick={onOpen} 
                    variant="ghost" 
                    colorScheme="whiteAlpha"
                />
            </Flex>

            <Flex flex="1" overflow="hidden">
                {/* Sidebar Desktop */}
                <Box display={{ base: "none", md: "block" }} w="260px" h="full">
                    <SidebarContent />
                </Box>

                {/* Drawer Mobile */}
                <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                    <DrawerOverlay />
                    <DrawerContent bg="gray.900" p={0}>
                        <DrawerCloseButton color="white" zIndex="overlay" />
                        <DrawerBody p={0}>
                            <SidebarContent />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {/* Zone de contenu dynamique */}
                <Box flex="1" bg="gray.50" overflowY="auto" p={{ base: 4, md: 8 }}>
                    
                    {/* Accueil */}
                    {view === 'home' && (
                        <Center h="full">
                            <VStack spacing={4} textAlign="center">
                                <Text fontSize="xl" color="gray.400">Bienvenue dans votre espace de gestion</Text>
                                <Text color="gray.500">Les modules de maintenance (Matx) apparaîtront ici bientôt.</Text>
                            </VStack>
                        </Center>
                    )}

                    {/* Liste des utilisateurs */}
                    {view === 'users' && (
                        <UserManager onUserClick={(id) => setView('user-detail', id)} />
                    )}

                    {/* Détails d'un utilisateur sélectionné */}
                    {view === 'user-detail' && (
                        <UserDetails 
                            userId={selectedUserId} 
                            onBack={() => setView('users')} 
                        />
                    )}

                    {/* Mon propre Profil (Appel sans ID pour charger /me/) */}
                    {view === 'profile' && <UserDetails />}

                </Box>
            </Flex>
        </Flex>
    );
}

interface NavButtonProps {
    icon: React.ReactElement;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
    return (
        <Button 
            leftIcon={icon} 
            variant={isActive ? 'solid' : 'ghost'} 
            colorScheme={isActive ? 'purple' : 'whiteAlpha'}
            justifyContent="start"
            onClick={onClick}
            w="full"
            _hover={{ bg: isActive ? 'purple.600' : 'whiteAlpha.200' }}
        >
            {label}
        </Button>
    );
}