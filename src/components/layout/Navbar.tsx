import {
  Box,
  Flex,
  HStack,
  IconButton,
  Avatar,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react';

import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';

interface NavbarProps {
  user: any;
  onOpenSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  onOpenSidebar,
  onProfileClick,
  onLogout,
}: NavbarProps) {

  const isMobile = useBreakpointValue({ base: true, md: false });

  const username =
    user?.username ||
    user?.email ||
    'Utilisateur';

  const avatarSrc =
    user?.profile_picture ||
    user?.avatar ||
    '';

  return (
    <Box
      bg="white"
      px={{ base: 4, md: 6 }}
      py={3}
      borderBottom="1px solid"
      borderColor="gray.100"
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Flex align="center" justify="space-between">

        {/* LEFT */}
        <HStack spacing={3} align="center">
          {isMobile && (
            <IconButton
              aria-label="menu"
              icon={<HiOutlineMenu />}
              variant="ghost"
              size="md"
              onClick={onOpenSidebar}
            />
          )}

          <Text
            fontSize="lg"
            fontWeight="bold"
            color="gray.800"
            letterSpacing="tight"
          >
            MATX
          </Text>
        </HStack>

        {/* RIGHT */}
        <HStack spacing={3} align="center">

          {/* USER MENU */}
          <Menu>
            <MenuButton>
              <HStack
                spacing={3}
                px={2}
                py={1}
                borderRadius="lg"
                _hover={{ bg: 'gray.50' }}
                transition="0.2s"
              >
                <Avatar
                  size="sm"
                  name={username}
                  src={avatarSrc}
                />

                {/* Username visible desktop only */}
                {!isMobile && (
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    maxW="140px"
                    isTruncated
                  >
                    {username}
                  </Text>
                )}
              </HStack>
            </MenuButton>

            <MenuList
              borderRadius="xl"
              shadow="lg"
              py={2}
              minW="180px"
            >
              <MenuItem
                icon={<HiOutlineUser />}
                onClick={onProfileClick}
              >
                Mon profil
              </MenuItem>

              <Divider my={1} />

              <MenuItem
                icon={<HiOutlineLogout />}
                color="red.500"
                onClick={onLogout}
              >
                Déconnexion
              </MenuItem>
            </MenuList>
          </Menu>

        </HStack>
      </Flex>
    </Box>
  );
}