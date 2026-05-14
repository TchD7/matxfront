import {
    Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
    Icon, HStack, Text, VStack
} from '@chakra-ui/react';
import { FiTool, FiSettings } from 'react-icons/fi';
import EquipmentTable from './EquipmentTable';
import InterventionTypeTable from './InterventionTypeTable';

export default function CockpitManager() {
    return (
        <Box>
            <VStack align="start" spacing={1} mb={6}>
                <Heading size="lg" color="gray.800">Cockpit Technique</Heading>
                <Text color="gray.500">Gérez votre parc machine et vos catégories d'intervention</Text>
            </VStack>

            <Tabs variant="enclosed" colorScheme="purple">
                <TabList bg="white" borderRadius="lg" p={1} border="none" shadow="sm">
                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiTool} />
                            <Text>Équipements</Text>
                        </HStack>
                    </Tab>
                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiSettings} />
                            <Text>Types d'Intervention</Text>
                        </HStack>
                    </Tab>
                </TabList>

                <TabPanels mt={4}>
                    <TabPanel p={0}>
                        {/* On va coder ce composant juste après */}
                        <EquipmentTable />
                    </TabPanel>

                    <TabPanel p={0}>
                        {/* On va coder ce composant ensuite */}
                        <InterventionTypeTable />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}