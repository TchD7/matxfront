import {
    Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel,
    Icon, HStack, Text, VStack
} from '@chakra-ui/react';

import { useState } from 'react';
import { FiTool, FiSettings, FiList, FiPackage, FiAlertTriangle } from 'react-icons/fi';

import EquipmentTable from './EquipmentTable';
import InterventionTypeTable from './InterventionTypeTable';
import FieldBuilderSection from './FieldBuilderSection';
import ConsumablesTable from './ConsumablesTable';

// 👉 NOUVEAU
import FailureReasonTable from './FailureReasonTable';


export default function CockpitManager() {

    const [tabIndex, setTabIndex] = useState(() => {
        const savedIndex = localStorage.getItem('active_cockpit_tab');
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    const handleTabChange = (index: number) => {
        setTabIndex(index);
        localStorage.setItem('active_cockpit_tab', index.toString());
    };

    return (
        <Box>

            <VStack align="start" spacing={1} mb={6}>
                <Heading size="lg" color="gray.800">
                    Cockpit Technique
                </Heading>

                <Text color="gray.500">
                    Gérez votre parc machine, vos configurations d’interventions et votre catalogue de stock.
                </Text>
            </VStack>


            <Tabs
                index={tabIndex}
                onChange={handleTabChange}
                variant="enclosed"
                colorScheme="purple"
            >

                <TabList
                    bg="white"
                    borderRadius="lg"
                    p={1}
                    shadow="sm"
                >

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

                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiPackage} />
                            <Text>Consommables</Text>
                        </HStack>
                    </Tab>

                    {/* 👉 NOUVEAU TAB FAILURE REASONS */}
                    <Tab _selected={{ color: 'purple.600', bg: 'purple.50', fontWeight: 'bold' }}>
                        <HStack spacing={2}>
                            <Icon as={FiAlertTriangle} />
                            <Text>Causes du NOK</Text>
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
                        <FieldBuilderSection />
                    </TabPanel>

                    <TabPanel p={0}>
                        <ConsumablesTable />
                    </TabPanel>

                    {/*  NOUVEAU TAB FAILURE REASONS */}
                    <TabPanel p={0}>
                        <FailureReasonTable />
                    </TabPanel>

                </TabPanels>

            </Tabs>

        </Box>
    );
}