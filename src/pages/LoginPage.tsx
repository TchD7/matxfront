//LoginPage.tsx
import { useState } from 'react';
import { HiOutlineUserCircle } from "react-icons/hi2";
import { 
  Box, 
  Text, 
  Flex, 
  VStack, 
  Image, 
  HStack, 
  Button, 
  useColorModeValue 
} from '@chakra-ui/react';
import LoginUsername from '../components/forms/LoginUsername';
import LoginPassword from '../components/forms/LoginPassword';
import ResetPassword from '../components/forms/ResetPassword'; 
import MatxLogo from '../assets/matx-logo.svg';

export default function LoginPage() {
    const [step, setStep] = useState<"username" | "password" | "resetPassword">("username");
    const [username, setUsername] = useState("");

    const bgColor = useColorModeValue('white', 'gray.700');
    const pageBg = useColorModeValue('gray.50', 'gray.800');

    return (
        <Flex minH="100vh" align="center" justify="center" bg={pageBg} px={4}>
            <Box maxW="420px" w="full" p={8} bg={bgColor} shadow="2xl" rounded="2xl">
                <VStack spacing={6} align="stretch">
                    <VStack spacing={1}>
                        <Image src={MatxLogo} alt="Matx Logo" htmlWidth="160px" />
                        
                    </VStack>

                    <Box py={2}>
                        {step === "username" ? (
                            <Text textAlign="center" color="gray.500" fontSize="sm">
                                Connectez-vous à votre espace Matx
                            </Text>
                        ) : (
                            <HStack spacing={0.5} justify="center" py={2}>
                                <HiOutlineUserCircle size="22px" color="gray.600" />
                                <Text fontWeight="bold" fontSize="md" color="blackAlpha.600" textTransform="uppercase" letterSpacing="0.5px">
                                    {username}
                                </Text>
                            </HStack>
                        )}
                    </Box>

                    {/* Step handling for login/reset */}
                    {step === "username" ? (
                        <LoginUsername 
                            onNext={(u) => { 
                                setUsername(u); 
                                setStep("password"); 
                            }} 
                        />
                    ) : step === "password" ? (
                        <LoginPassword 
                            username={username} 
                            onSuccess={() => alert("Connecté !")} 
                            onBack={() => setStep("username")}
                        />
                    ) : (
                        <ResetPassword username={username} onBack={() => setStep("password")} />
                    )}
                </VStack>
            </Box>
        </Flex>
    );
}
