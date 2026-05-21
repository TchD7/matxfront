import {
    Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
    Icon, HStack, Text, VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiTool, FiSettings, FiList, FiPackage } from 'react-icons/fi'; // Ajout de FiPackage

import EquipmentTable from './EquipmentTable';
import InterventionTypeTable from './InterventionTypeTable';
import FieldDefinitionTable from './FieldDefinitionTable';
import ConsumablesTable from './ConsumablesTable'; // Notre nouveau composant CRUD + Excel

export default function CockpitManager() {
    // 1. On initialise l'état de l'onglet en allant lire d'abord dans le localStorage.
    // Si rien n'est stocké (première visite), on affiche l'onglet 0 (Équipements).
    const [tabIndex, setTabIndex] = useState(() => {
        const savedIndex = localStorage.getItem('active_cockpit_tab');
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    // 2. Dès que l'utilisateur change d'onglet, on enregistre l'index en local
    const handleTabChange = (index: number) => {
        setTabIndex(index);
        localStorage.setItem('active_cockpit_tab', index.toString());
    };

    return (
        <Box>
            <VStack align="start" spacing={1} mb={6}>
                <Heading size="lg" color="gray.800">Cockpit Technique</Heading>
                <Text color="gray.500">
                    Gérez votre parc machine, vos configurations d’interventions et votre catalogue de stock.
                </Text>
            </VStack>

            {/* 3. On passe l'index et le gestionnaire de changement à Chakra UI */}
            <Tabs index={tabIndex} onChange={handleTabChange} variant="enclosed" colorScheme="purple">
                <TabList bg="white" borderRadius="lg" p={1} shadow="sm">

                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiTool} />
                            <Text>Équipements</Text>
                        </HStack>
                    </Tab>

                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiSettings} />
                            <Text>Types d'intervention</Text>
                        </HStack>
                    </Tab>

                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiList} />
                            <Text>Champs dynamiques</Text>
                        </HStack>
                    </Tab>

                    {/* --- NOUVEL ONGLET CONSOMMABLES --- */}
                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiPackage} />
                            <Text>Consommables</Text>
                        </HStack>
                    </Tab>

                </TabList>

                <TabPanels mt={4}>
                    <TabPanel p={0}>
                        <EquipmentTable />
                    </TabPanel>

                    <TabPanel p={0}>
                        <InterventionTypeTable />
                    </TabPanel>

                    <TabPanel p={0}>
                        {/* C'est ton composant de déploiement réécrit ensemble */}
                        <FieldDefinitionTable />
                    </TabPanel>

                    {/* --- PANNEAU DU CONTENU CONSOMMABLES --- */}
                    <TabPanel p={0}>
                        <ConsumablesTable />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}