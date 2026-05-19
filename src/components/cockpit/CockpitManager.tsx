import {
    Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
    Icon, HStack, Text, VStack
} from '@chakra-ui/react';

import { FiTool, FiSettings, FiList } from 'react-icons/fi';

import EquipmentTable from './EquipmentTable';
import InterventionTypeTable from './InterventionTypeTable';
import FieldDefinitionTable from './FieldDefinitionTable';

export default function CockpitManager() {
    return (
        <Box>
            <VStack align="start" spacing={1} mb={6}>
                <Heading size="lg" color="gray.800">Cockpit Technique</Heading>
                <Text color="gray.500">
                    Gérez votre parc machine et vos configurations d’interventions
                </Text>
            </VStack>

            <Tabs variant="enclosed" colorScheme="purple">
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

                </TabList>

                <TabPanels mt={4}>
                    <TabPanel p={0}>
                        <EquipmentTable />
                    </TabPanel>

                    <TabPanel p={0}>
                        <InterventionTypeTable />
                    </TabPanel>

                    <TabPanel p={0}>
                        <FieldDefinitionTable />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}