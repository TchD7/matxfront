// components/forms/InternetDetector.tsx
import { Box, Text, Slide, Flex, Icon } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

export default function InternetDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setShowStatus(true);
      
      if (online) {
        const timer = setTimeout(() => setShowStatus(false), 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // On ne rend rien si on est en ligne et que le délai de notification est passé
  if (!showStatus && isOnline) return null;

  return (
    <Slide direction="top" in={showStatus || !isOnline} style={{ zIndex: 9999 }}>
      <Flex
        p={2}
        color="white"
        bg={isOnline ? "green.500" : "orange.500"}
        justify="center"
        align="center"
        shadow="md"
      >
        <Text fontWeight="bold" fontSize="sm">
          {isOnline ? "Connexion rétablie" : " Vous êtes hors ligne"}
        </Text>
      </Flex>
    </Slide>
  );
}
