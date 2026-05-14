import {
  Table, Thead, Tbody, Tr, Th, Td, 
  Box, Button, Flex, Badge, IconButton, 
  useDisclosure, useToast, Text, Spinner, Center
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCpu } from 'react-icons/fi';
import api from '../../api/apiClient'; // Ton instance Axios
import EquipmentModal from './EquipmentModal';

export default function EquipmentTable() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/equipments/');
      setEquipments(res.data.results || res.data);
    } catch (err) {
      toast({ title: "Erreur de chargement", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const handleEdit = (eq) => {
    setSelectedEquipment(eq);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedEquipment(null);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cet équipement ?")) {
      try {
        await api.delete(`/api/v1/equipments/${id}/`);
        toast({ title: "Équipement supprimé", status: "success" });
        fetchEquipments();
      } catch (err) {
        toast({ title: "Erreur lors de la suppression", status: "error" });
      }
    }
  };

  if (loading) return <Center p={10}><Spinner color="purple.500" /></Center>;

  return (
    <Box bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontWeight="bold" fontSize="lg">Liste du Parc ({equipments.length})</Text>
        <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={handleAdd} size="sm">
          Nouvel Équipement
        </Button>
      </Flex>

      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Code</Th>
            <Th>Désignation</Th>
            <Th>Localisation</Th>
            <Th textAlign="center">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {equipments.length === 0 ? (
            <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.400">Aucun équipement enregistré</Td></Tr>
          ) : (
            equipments.map((eq: any) => (
              <Tr key={eq.id} _hover={{ bg: 'gray.50' }}>
                <Td>
                  <Badge colorScheme="purple" variant="subtle">{eq.code}</Badge>
                </Td>
                <Td fontWeight="medium">
                  <Flex align="center">
                    <FiCpu style={{ marginRight: '8px' }} color="#805AD5" />
                    {eq.name}
                  </Flex>
                </Td>
                <Td color="gray.600">{eq.location || "Non spécifié"}</Td>
                <Td>
                  <Flex justify="center" gap={2}>
                    <IconButton 
                      aria-label="Edit" icon={<FiEdit2 />} size="xs" variant="ghost" colorScheme="blue"
                      onClick={() => handleEdit(eq)}
                    />
                    <IconButton 
                      aria-label="Delete" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red"
                      onClick={() => handleDelete(eq.id)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      <EquipmentModal 
        isOpen={isOpen} 
        onClose={onClose} 
        equipment={selectedEquipment} 
        onSuccess={fetchEquipments} 
      />
    </Box>
  );
}