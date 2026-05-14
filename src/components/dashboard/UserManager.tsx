import {
  Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr, Badge, useToast,
  IconButton, Menu, MenuButton, MenuList, MenuItem, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, FormControl, FormLabel, Input, VStack, Spinner, Center,
  Text, HStack, useBreakpointValue, AlertDialog, AlertDialogBody,
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup, InputLeftElement, Container, Alert, AlertIcon, Divider,
  Select, Checkbox, FormErrorMessage, ButtonGroup, Flex
} from '@chakra-ui/react';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  RiMore2Fill, RiUserAddLine, RiDeleteBin6Line, RiEditLine,
  RiSearchLine, RiKeyLine, RiEyeLine, RiArrowLeftSLine, RiArrowRightSLine
} from 'react-icons/ri';

import { jwtDecode } from 'jwt-decode';
import api, { getAccessToken } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';

// ============================================================
// Extraction des messages d'erreur depuis le backend
// ============================================================
function extractErrorMessage(error: any): string {
  const data = error?.response?.data;
  if (!data) return "Erreur serveur";
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];
  if (Array.isArray(firstValue)) return firstValue[0];
  return firstValue || "Erreur inconnue";
}

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
  is_active: boolean;
}

interface FormData {
  username: string; email: string; first_name: string; last_name: string;
  phone_number: string; role: 'technician' | 'dispatcher' | 'viewer' | 'admin';
  team_number: number | null; can_login_web: boolean; is_active: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'red', technician: 'blue', dispatcher: 'purple', viewer: 'gray',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur', technician: 'Technicien', dispatcher: 'Dispatcher', viewer: 'Spectateur',
};

export default function UserManager({ onUserClick }: { onUserClick: (id: string | number) => void }) {
  const { user: contextUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'create' | 'edit' | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();

  const cancelRef = useRef(null);

  const [formData, setFormData] = useState<FormData>({
    username: '', email: '', first_name: '', last_name: '',
    phone_number: '', role: 'technician', team_number: null, can_login_web: true, is_active: true,
  });

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const handler = setTimeout(() => setSearchTerm(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.user_id || decoded.id;
    } catch (e) { return null; }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      String(u.id) !== String(currentUserId) &&
      (u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, currentUserId, searchTerm]);

  const loadUsers = useCallback(async (cursorUrl?: string | null) => {
    setLoading(true);
    try {
      const response = await api.get(cursorUrl || '/api/v1/customers/users/', {
        params: !cursorUrl ? { search: searchTerm, page_size: pageSize } : {},
      });
      const apiData = response.data.data || response.data;
      setUsers(apiData.results || []);
      setNextCursor(apiData.pagination?.next);
      setPrevCursor(apiData.pagination?.previous);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pageSize]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'team_number' ? (value ? parseInt(value) : null) : value)
    }));
  };

  const handleOpenCreate = () => {
    setActionType('create');
    setFormData({ username: '', email: '', first_name: '', last_name: '', phone_number: '', role: 'technician', team_number: null, can_login_web: true, is_active: true });
    onOpen();
  };

  const handleOpenEdit = (user: User) => {
    setActionType('edit');
    setSelectedUser(user);
    setFormData({ ...user });
    onOpen();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (actionType === 'create') {
        await api.post('/api/v1/customers/users/', formData);
        toast({ title: 'Utilisateur créé', status: 'success' });
      } else {
        await api.put(`/api/v1/customers/users/${selectedUser?.id}/`, formData);
        toast({ title: 'Mis à jour', status: 'success' });
      }
      loadUsers();
      onClose();
    } catch (err) {
      toast({ title: 'Erreur', description: extractErrorMessage(err), status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/v1/customers/users/${selectedUser.id}/`);
      toast({ title: 'Supprimé', status: 'success' });
      loadUsers();
      onDeleteClose();
    } catch (e) {
      toast({ title: 'Erreur', description: extractErrorMessage(e), status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/v1/customers/users/${userToReset.id}/reset-password/`, {});
      toast({ title: 'Email envoyé', status: 'info' });
      onResetClose();
    } catch (err) {
      toast({ title: 'Erreur', description: extractErrorMessage(err), status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="full" py={0} px={0} h="full">
      <Flex direction="column" h="calc(100vh - 150px)">

        {/* HEADER FIXE */}
        <Box mb={6}>
          <HStack justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Heading size="lg" color="gray.800">Utilisateurs</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>Gérez vos utilisateurs et leurs rôles</Text>
            </Box>
            <Button
              leftIcon={<RiUserAddLine />}
              colorScheme="purple"
              onClick={handleOpenCreate}
              size="md"
              borderRadius="lg"
            >
              Ajouter un utilisateur
            </Button>
          </HStack>

          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none"><RiSearchLine color="gray.400" size={18} /></InputLeftElement>
            <Input
              placeholder="Rechercher..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              bg="white"
              borderRadius="lg"
            />
          </InputGroup>
        </Box>

        {/* ZONE SCROLLABLE */}
        <Box flex="1" overflowY="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white">
          {loading ? (
            <Center p={10}><Spinner color="purple.500" /></Center>
          ) : (
            <>
              {!isMobile ? (
                <Table variant="simple" size="md">
                  <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                    <Tr><Th py={4} px={6}>Nom</Th><Th px={6}>Email</Th><Th px={6}>Rôle</Th><Th px={6}>Équipe</Th><Th px={6} textAlign="center">Actions</Th></Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id} borderBottom="1px solid" borderColor="gray.200" _hover={{ bg: 'gray.50' }}>
                        <Td py={4} px={6} fontWeight="500">{user.display_name || `${user.first_name} ${user.last_name}`}</Td>
                        <Td px={6} fontSize="sm" color="gray.600">{user.email}</Td>
                        <Td px={6}><Badge colorScheme={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge></Td>
                        <Td px={6} fontSize="sm">{user.team_code || '-'}</Td>
                        <Td px={6} textAlign="center">
                          <Menu isLazy>
                            <MenuButton as={IconButton} icon={<RiMore2Fill />} variant="ghost" size="sm" />
                            <MenuList boxShadow="0 4px 12px rgba(0,0,0,0.1)">
                              <MenuItem icon={<RiEyeLine />} onClick={() => onUserClick(user.id)}>Détails</MenuItem>
                              <MenuItem icon={<RiEditLine />} onClick={() => handleOpenEdit(user)}>Modifier</MenuItem>
                              <MenuItem icon={<RiKeyLine />} onClick={() => { setUserToReset(user); onResetOpen(); }} color="orange.500">Réinitialiser MDP</MenuItem>
                              <MenuItem icon={<RiDeleteBin6Line />} color="red.500" onClick={() => { setSelectedUser(user); onDeleteOpen(); }}>Supprimer</MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <VStack spacing={3} p={4} align="stretch">
                  {filteredUsers.map(user => (
                    <Box key={user.id} p={4} bg="white" w="full" borderRadius="lg" border="1px solid" borderColor="gray.200">
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="600">{user.first_name} {user.last_name}</Text>
                        <Badge colorScheme={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" mb={3}>{user.email}</Text>
                      <HStack justify="flex-end" spacing={2}>
                        <IconButton size="sm" icon={<RiEyeLine />} onClick={() => onUserClick(user.id)} variant="ghost" aria-label="Voir" />
                        <IconButton size="sm" icon={<RiEditLine />} onClick={() => handleOpenEdit(user)} variant="ghost" aria-label="Modifier" />
                        <IconButton size="sm" colorScheme="orange" icon={<RiKeyLine />} onClick={() => { setUserToReset(user); onResetOpen(); }} variant="ghost" aria-label="Reset" />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </>
          )}
        </Box>

        {/* PAGINATION FIXE */}
        <HStack justify="space-between" mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
          <Select w="100px" size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} bg="white">
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </Select>
          <ButtonGroup isAttached size="sm" variant="outline">
            <Button isDisabled={!prevCursor} onClick={() => loadUsers(prevCursor)} leftIcon={<RiArrowLeftSLine />}>Précédent</Button>
            <Button isDisabled={!nextCursor} onClick={() => loadUsers(nextCursor)} rightIcon={<RiArrowRightSLine />}>Suivant</Button>
          </ButtonGroup>
        </HStack>
      </Flex>

      {/* MODAL CRÉER / MODIFIER (INTÉGRAL) */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>{actionType === 'create' ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Nom d'utilisateur</FormLabel>
                <Input name="username" value={formData.username} onChange={handleInputChange} isReadOnly={actionType === 'edit'} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
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
              <FormControl isRequired>
                <FormLabel fontSize="sm">Rôle</FormLabel>
                <Select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="technician">Technicien</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Administrateur</option>
                </Select>
              </FormControl>
              {formData.role !== 'admin' && (
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Numéro d'équipe</FormLabel>
                  <Input name="team_number" type="number" value={formData.team_number || ''} onChange={handleInputChange} />
                </FormControl>
              )}
              <VStack align="start" w="full" spacing={3} pt={2}>
                <FormControl display="flex" alignItems="center">
                  <Checkbox name="is_active" isChecked={formData.is_active} onChange={handleInputChange} colorScheme="green">
                    <Text fontSize="sm" ml={2}>Compte actif (autoriser l'utilisation)</Text>
                  </Checkbox>
                </FormControl>
                <FormControl display="flex" alignItems="center" pt={2}>
                  <Checkbox name="can_login_web" isChecked={formData.can_login_web} onChange={handleInputChange} colorScheme="purple">
                    <Text fontSize="sm" ml={2}>Autoriser la connexion à l'interface Web</Text>
                  </Checkbox>
                </FormControl>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="purple" onClick={handleSubmit} isLoading={isSubmitting}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL RESET PASSWORD (INTÉGRAL) */}
      <AlertDialog isOpen={isResetOpen} leastDestructiveRef={cancelRef} onClose={onResetClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Réinitialiser le mot de passe ?</AlertDialogHeader>
            <AlertDialogBody>Envoyer un lien de reset à {userToReset?.email} ?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onResetClose}>Annuler</Button>
              <Button colorScheme="orange" onClick={handleResetPassword} ml={3} isLoading={isSubmitting}>Confirmer</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* ALERT DIALOG DELETE (INTÉGRAL) */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Supprimer l'utilisateur</AlertDialogHeader>
            <AlertDialogBody>Êtes-vous sûr ? Cette action est irréversible pour {selectedUser?.username}.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>Annuler</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isSubmitting}>Supprimer</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Container>
  );
}