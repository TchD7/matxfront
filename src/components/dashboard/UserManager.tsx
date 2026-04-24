import {
  Box,
  Button,
  Heading,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Spinner,
  Center,
  Text,
  HStack,
  useBreakpointValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  Container,
  Alert,
  AlertIcon,
  Divider,
  Select,
  Checkbox,
  FormErrorMessage,
} from '@chakra-ui/react';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  RiMore2Fill,
  RiUserAddLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiSearchLine,
  RiKeyLine,
  RiEyeLine,
} from 'react-icons/ri';

import { jwtDecode } from 'jwt-decode'; 
import api, { getAccessToken } from '../../api/apiClient';

// ================= INTERFACES =================

interface User {
  id: string | number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'technician' | 'dispatcher' | 'viewer' | 'admin';
  team_number: number | null;
  can_login_web: boolean;
  display_name: string;
  team_code: string;
}

interface FormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'technician' | 'dispatcher' | 'viewer' | 'admin';
  team_number: number | null;
  can_login_web: boolean;
}

interface FormErrors {
  [key: string]: string;
}

type ActionType = 'create' | 'edit' | null;

// ================= CONSTANTES =================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email: string): boolean => EMAIL_REGEX.test(email.trim());

const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  technician: 'blue',
  dispatcher: 'purple',
  viewer: 'gray',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  technician: 'Technicien',
  dispatcher: 'Dispatcher',
  viewer: 'Spectateur',
};

export default function UserManager({ onUserClick }: { onUserClick: (id: string | number) => void }) {
  // ================= ÉTATS =================
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const cancelRef = useRef(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'technician',
    team_number: null,
    can_login_web: true,
  });

  const isMobile = useBreakpointValue({ base: true, md: false });

  // ================= LOGIQUE D'IDENTIFICATION & FILTRAGE =================

  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.user_id || decoded.id || decoded.sub;
    } catch (e) {
      return null;
    }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => String(u.id) !== String(currentUserId));
  }, [users, currentUserId]);

  // ================= CHARGEMENT DES DONNÉES =================

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/customers/users/', {
        params: { search: searchTerm },
      });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Impossible de récupérer la liste');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ================= ACTIONS CRUD =================

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.username.trim()) errors.username = 'Requis';
    if (!formData.email.trim() || !validateEmail(formData.email)) errors.email = 'Email invalide';
    if (!formData.first_name.trim()) errors.first_name = 'Requis';
    if (!formData.last_name.trim()) errors.last_name = 'Requis';
    if (formData.role !== 'admin' && !formData.team_number) errors.team_number = 'Numéro d\'équipe requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setActionType('create');
    setFormData({ username: '', email: '', first_name: '', last_name: '', phone_number: '', role: 'technician', team_number: null, can_login_web: true });
    setFormErrors({});
    onOpen();
  };

  const handleOpenEdit = (user: User) => {
    setActionType('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      role: user.role,
      team_number: user.team_number,
      can_login_web: user.can_login_web,
    });
    setFormErrors({});
    onOpen();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'team_number' ? (value ? parseInt(value, 10) : null) : val,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        team_number: formData.role === 'admin' ? null : formData.team_number,
      };

      if (actionType === 'create') {
        await api.post('/api/v1/customers/users/', payload);
        toast({ title: 'Utilisateur créé', status: 'success', duration: 3000 });
      } else {
        await api.put(`/api/v1/customers/users/${selectedUser?.id}/`, payload);
        toast({ title: 'Utilisateur mis à jour', status: 'success', duration: 3000 });
      }
      loadUsers();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/v1/customers/users/${selectedUser.id}/`);
      toast({ title: 'Supprimé avec succès', status: 'success' });
      loadUsers();
      onDeleteClose();
    } catch (err: any) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/v1/customers/users/${userToReset.id}/reset-password/`, {});
      toast({ title: 'Lien envoyé', status: 'info' });
      onResetClose();
    } catch (err) {
      toast({ title: 'Erreur', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <Center p={10} minH="400px">
        <VStack>
          <Spinner color="purple.500" size="xl" />
          <Text>Chargement des utilisateurs...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="full" py={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" flexWrap="wrap" spacing={4}>
          <Heading size="lg">Gestion des Utilisateurs</Heading>
          <Button leftIcon={<RiUserAddLine />} colorScheme="purple" onClick={handleOpenCreate} size={isMobile ? "sm" : "md"}>
            Nouvel Utilisateur
          </Button>
        </HStack>

        <InputGroup>
          <InputLeftElement pointerEvents="none"><RiSearchLine color="gray.300" /></InputLeftElement>
          <Input 
            placeholder="Rechercher par nom ou email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            variant="filled" 
          />
        </InputGroup>

        {error && <Alert status="error"><AlertIcon />{error}</Alert>}

        {!isMobile ? (
          /* VERSION DESKTOP */
          <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" borderWidth="1px">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={4}>Nom Complet</Th>
                  <Th>Email</Th>
                  <Th>Rôle</Th>
                  <Th>Équipe</Th>
                  <Th textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.length === 0 ? (
                  <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Aucun utilisateur trouvé</Td></Tr>
                ) : (
                  filteredUsers.map((user) => (
                    <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="medium">{user.display_name || `${user.first_name} ${user.last_name}`}</Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <Badge colorScheme={ROLE_COLORS[user.role]} variant="subtle" px={2} borderRadius="md">
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </Td>
                      <Td>{user.team_code || user.team_number || '-'}</Td>
                      <Td textAlign="center">
                        <Menu isLazy>
                          <MenuButton as={IconButton} icon={<RiMore2Fill />} variant="ghost" size="sm" />
                          <MenuList shadow="lg" py={2}>
                            <MenuItem icon={<RiEyeLine />} onClick={() => onUserClick(user.id)}>Voir les détails</MenuItem>
                            <MenuItem icon={<RiEditLine />} onClick={() => handleOpenEdit(user)}>Modifier</MenuItem>
                            <MenuItem icon={<RiKeyLine />} onClick={() => { setUserToReset(user); onResetOpen(); }} color="orange.600">Réinitialiser MDP</MenuItem>
                            <Divider my={2} />
                            <MenuItem icon={<RiDeleteBin6Line />} color="red.600" onClick={() => { setSelectedUser(user); onDeleteOpen(); }}>Supprimer</MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        ) : (
          /* VERSION MOBILE */
          <VStack spacing={4}>
            {filteredUsers.length === 0 ? (
                <Text py={10} color="gray.500">Aucun utilisateur trouvé</Text>
            ) : (
                filteredUsers.map((user) => (
                    <Box key={user.id} bg="white" borderWidth="1px" borderRadius="xl" p={4} w="full" shadow="sm">
                        <HStack justify="space-between" mb={2}>
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="md">{user.display_name || `${user.first_name} ${user.last_name}`}</Text>
                                <Text fontSize="xs" color="gray.500">{user.email}</Text>
                            </VStack>
                            <Badge colorScheme={ROLE_COLORS[user.role]} fontSize="xs">{ROLE_LABELS[user.role]}</Badge>
                        </HStack>
                        
                        <Divider my={3} />
                        
                        <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.500">Équipe: {user.team_code || user.team_number || 'N/A'}</Text>
                            <Menu isLazy>
                                <MenuButton as={Button} size="xs" rightIcon={<RiMore2Fill />} variant="outline" colorScheme="gray">
                                    Actions
                                </MenuButton>
                                <MenuList>
                                    <MenuItem icon={<RiEyeLine />} onClick={() => onUserClick(user.id)}>Détails</MenuItem>
                                    <MenuItem icon={<RiEditLine />} onClick={() => handleOpenEdit(user)}>Modifier</MenuItem>
                                    <MenuItem icon={<RiKeyLine />} onClick={() => { setUserToReset(user); onResetOpen(); }}>Reset Password</MenuItem>
                                    <Divider my={2} />
                                    <MenuItem icon={<RiDeleteBin6Line />} color="red.600" onClick={() => { setSelectedUser(user); onDeleteOpen(); }}>Supprimer</MenuItem>
                                </MenuList>
                            </Menu>
                        </HStack>
                    </Box>
                ))
            )}
          </VStack>
        )}
      </VStack>

      {/* --- MODALS (Code inchangé pour la logique, prêt à l'emploi) --- */}
      
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>{actionType === 'create' ? 'Nouvel Utilisateur' : 'Modifier l\'utilisateur'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!formErrors.username} isRequired>
                <FormLabel fontSize="sm">Nom d'utilisateur</FormLabel>
                <Input name="username" value={formData.username} onChange={handleInputChange} isReadOnly={actionType === 'edit'} />
                <FormErrorMessage>{formErrors.username}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!formErrors.email} isRequired>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
                <FormErrorMessage>{formErrors.email}</FormErrorMessage>
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Prénom</FormLabel>
                  <Input name="first_name" value={formData.first_name} onChange={handleInputChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nom</FormLabel>
                  <Input name="last_name" value={formData.last_name} onChange={handleInputChange} />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm">Téléphone</FormLabel>
                <Input name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="+228..." />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Rôle</FormLabel>
                <Select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="technician">Technicien</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Spectateur</option>
                  <option value="admin">Administrateur</option>
                </Select>
              </FormControl>

              {formData.role !== 'admin' && (
                <FormControl isInvalid={!!formErrors.team_number} isRequired>
                  <FormLabel fontSize="sm">Numéro d'équipe</FormLabel>
                  <Input name="team_number" type="number" value={formData.team_number || ''} onChange={handleInputChange} />
                  <FormErrorMessage>{formErrors.team_number}</FormErrorMessage>
                </FormControl>
              )}

              <FormControl display="flex" alignItems="center" pt={2}>
                <Checkbox name="can_login_web" isChecked={formData.can_login_web} onChange={handleInputChange} colorScheme="purple">
                  Autoriser l'accès Web
                </Checkbox>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50" borderBottomRadius="md">
            <Button variant="ghost" mr={3} onClick={onClose} size="sm">Annuler</Button>
            <Button colorScheme="purple" onClick={handleSubmit} isLoading={isSubmitting} size="sm">Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Suppression</AlertDialogHeader>
          <AlertDialogBody>
            Êtes-vous sûr ? Cette action est irréversible pour <strong>{selectedUser?.first_name}</strong>.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onDeleteClose} size="sm">Annuler</Button>
            <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isSubmitting} size="sm">Supprimer</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog isOpen={isResetOpen} leastDestructiveRef={cancelRef} onClose={onResetClose}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">Réinitialisation</AlertDialogHeader>
          <AlertDialogBody>Envoyer un email de réinitialisation de mot de passe ?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onResetClose} size="sm">Annuler</Button>
            <Button colorScheme="orange" onClick={handleResetPassword} ml={3} isLoading={isSubmitting} size="sm">Confirmer</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}