import {
    Box,
    Flex,
    Text,
    HStack,
    Circle,
} from '@chakra-ui/react';

// ================= TYPES =================
interface Props {
    status: string;
}

// ================= WORKFLOW =================
const steps = [
    { key: 'draft', label: 'Qualifié' },
    { key: 'planned', label: 'Planifié' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'completed', label: 'Terminé' },
    { key: 'closed', label: 'Clôturé' },
];

const getStepIndex = (status: string) => {
    return steps.findIndex((s) => s.key === status);
};

// ================= COMPONENT =================
export default function TicketStepper({ status }: Props) {
    const currentIndex = getStepIndex(status);

    return (
        <Box w="full" py={4}>

            <HStack justify="space-between" position="relative">

                {steps.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isDone = index < currentIndex;

                    return (
                        <Flex
                            key={step.key}
                            direction="column"
                            align="center"
                            flex="1"
                            position="relative"
                        >

                            {/* LINE CONNECTOR */}
                            {index !== 0 && (
                                <Box
                                    position="absolute"
                                    top="10px"
                                    left="-50%"
                                    right="50%"
                                    height="2px"
                                    bg={isDone ? 'green.400' : 'gray.200'}
                                />
                            )}

                            {/* STEP CIRCLE */}
                            <Circle
                                size="25px"
                                bg={
                                    isDone
                                        ? 'green.400'
                                        : isActive
                                            ? 'purple.500'
                                            : 'gray.200'
                                }
                                color="white"
                                fontSize="10px"
                                fontWeight="bold"
                                zIndex={1}
                            >
                                {index + 1}
                            </Circle>

                            {/* LABEL */}
                            <Text
                                mt={2}
                                fontSize="xs"
                                fontWeight={isActive ? 'bold' : 'normal'}
                                color={isActive ? 'purple.600' : 'gray.500'}
                                textAlign="center"
                            >
                                {step.label}
                            </Text>

                        </Flex>
                    );
                })}

            </HStack>

        </Box>
    );
}