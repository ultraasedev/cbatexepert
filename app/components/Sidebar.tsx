// components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useBreakpointValue,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Divider,
  Image,
  Collapse,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  MdDashboard,
  MdAssignment,
  MdAddBox,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
  MdMenu,
  MdCameraAlt,
  MdEdit,
  MdExitToApp,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdPerson,
  MdGroup,
  MdHome,
} from 'react-icons/md';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  children?: NavItem[];
  adminOnly?: boolean;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPicture, setNewPicture] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState('');

  const drawer = useDisclosure();
  const emailModal = useDisclosure();
  const pictureModal = useDisclosure();

  const { user, logout, updateEmail, updateProfilePicture } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Thème et couleurs
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBgColor = useColorModeValue('blue.50', 'whiteAlpha.100');
  const activeColor = '#000091';
  const textColor = useColorModeValue('gray.700', 'gray.100');

  useEffect(() => {
    if (user?.avatar) {
      setAvatarSrc(user.avatar);
    }
  }, [user?.avatar]);

  const navigation: NavItem[] = [
    {
      icon: MdHome,
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      icon: MdAssignment,
      label: 'Expertises',
      children: [
        { icon: MdAssignment, label: 'Liste des expertises', path: '/expertises' },
        { icon: MdAddBox, label: 'Nouvelle expertise', path: '/expertises/new' }
      ]
    },
    {
      icon: MdAssignment,
      label: "Plans d'aide",
      children: [
        { icon: MdAssignment, label: "Liste des plans", path: '/pda' },
        { icon: MdAddBox, label: "Nouveau plan", path: '/pda/new' }
      ]
    },
    {
      icon: MdGroup,
      label: 'Gestion Users',
      adminOnly: true,
      children: [
        { icon: MdPerson, label: 'Liste des agents', path: '/guser/manage' },
        { icon: MdAddBox, label: 'Créer un agent', path: '/guser/create' }
      ]
    }
  ];

  const handleUpdateEmail = async () => {
    try {
      await updateEmail(newEmail);
      toast({
        title: 'Email mis à jour',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      emailModal.onClose();
      setNewEmail('');
    } catch (error) {
      toast({
        title: "Erreur de mise à jour",
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePicture = async () => {
    if (!newPicture) return;

    try {
      const updatedUser = await updateProfilePicture(newPicture);
      setAvatarSrc(updatedUser.avatar);
      toast({
        title: 'Photo mise à jour',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      pictureModal.onClose();
      setNewPicture(null);
    } catch (error) {
      toast({
        title: "Erreur de mise à jour",
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = item.path ? pathname === item.path : activeGroup === item.label;
    const hasChildren = item.children && item.children.length > 0;
    const isGroupOpen = activeGroup === item.label;
    
    return (
      <Box>
        <MotionBox
          as={Button}
          variant="ghost"
          width="full"
          height="40px"
          display="flex"
          alignItems="center"
          justifyContent={isCollapsed && !isMobile ? "center" : "flex-start"}
          px={isCollapsed && !isMobile ? 0 : 3}
          mb={1}
          cursor="pointer"
          color={isActive ? activeColor : textColor}
          bg={isActive ? `${activeColor}10` : 'transparent'}
          _hover={{ bg: hoverBgColor }}
          onClick={() => {
            if (hasChildren) {
              setActiveGroup(isGroupOpen ? null : item.label);
            } else if (item.path) {
              router.push(item.path);
              if (isMobile) drawer.onClose();
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Box 
            as={item.icon} 
            size={isCollapsed && !isMobile ? "24px" : "20px"} 
            mr={isCollapsed && !isMobile ? 0 : 3} 
          />
          {(!isCollapsed || isMobile) && (
            <>
              <Text flex={1} fontSize="sm" fontWeight={isActive ? 'semibold' : 'normal'}>
                {item.label}
              </Text>
              {hasChildren && (
                <Box 
                  as={isGroupOpen ? MdKeyboardArrowDown : MdKeyboardArrowRight} 
                  size="20px"
                />
              )}
            </>
          )}
        </MotionBox>

        {hasChildren && (!isCollapsed || isMobile) && (
          <Collapse in={isGroupOpen}>
            <VStack align="stretch" pl={6} mt={1} mb={2}>
              {item.children.map((child, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  width="full"
                  height="36px"
                  justifyContent="flex-start"
                  px={3}
                  fontSize="sm"
                  color={pathname === child.path ? activeColor : textColor}
                  bg={pathname === child.path ? `${activeColor}10` : 'transparent'}
                  _hover={{ bg: hoverBgColor }}
                  leftIcon={<Box as={child.icon} size="18px" />}
                  onClick={() => {
                    if (child.path) {
                      router.push(child.path);
                      if (isMobile) drawer.onClose();
                    }
                  }}
                >
                  {child.label}
                </Button>
              ))}
            </VStack>
          </Collapse>
        )}
      </Box>
    );
  };

  const SidebarContent = () => (
    <VStack h="100%" spacing={0}>
      {/* Header */}
      <HStack 
        w="full" 
        h="60px" 
        px={isCollapsed ? 2 : 4} 
        borderBottom="1px solid"
        borderColor={borderColor}
        justify={isCollapsed ? "center" : "space-between"}
        position="relative"
      >
        {!isCollapsed ? (
          <Text fontSize="xl" fontWeight="bold" color={activeColor}>
            ExpertBat
          </Text>
        ) : (
          <Text fontSize="xl" fontWeight="bold" color={activeColor}>
            EB
          </Text>
        )}
        {!isMobile && (
          <IconButton
            aria-label="Toggle sidebar"
            icon={isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
            size="sm"
            variant="ghost"
            position={isCollapsed ? "absolute" : "relative"}
            right={isCollapsed ? "-12px" : "0"}
            top={isCollapsed ? "20px" : "auto"}
            transform={isCollapsed ? "translateX(50%)" : "none"}
            borderRadius="full"
            bg={bgColor}
            boxShadow="sm"
            _hover={{ bg: hoverBgColor }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            zIndex={2}
          />
        )}
      </HStack>

      {/* Profil utilisateur */}
      <Box w="full" p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Menu>
          <MenuButton
            as={Button}
            w="full"
            h="auto"
            p={2}
            variant="ghost"
            _hover={{ bg: hoverBgColor }}
          >
            <HStack 
              spacing={3} 
              justify={isCollapsed ? "center" : "flex-start"}
              w="full"
            >
              <Avatar 
                size={isCollapsed ? "md" : "sm"}
                name={user?.name}
                src={avatarSrc}
              />
              {!isCollapsed && (
                <Box flex={1} textAlign="left">
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium" 
                    noOfLines={1}
                  >
                    {user?.name}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color="gray.500" 
                    noOfLines={1}
                  >
                    {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </Text>
                </Box>
              )}
            </HStack>
          </MenuButton>
          <Portal>
            <MenuList zIndex={1500}>
              <MenuItem 
                icon={<MdCameraAlt />} 
                onClick={pictureModal.onOpen}
                fontSize="sm"
              >
                Changer la photo
              </MenuItem>
              <MenuItem 
                icon={<MdEdit />} 
                onClick={emailModal.onOpen}
                fontSize="sm"
              >
                Changer l'email
              </MenuItem>
              <Divider my={2} />
              <MenuItem 
                icon={<MdExitToApp />} 
                onClick={logout}
                fontSize="sm"
                color="red.500"
                _hover={{ bg: 'red.50' }}
              >
                Se déconnecter
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>

      {/* Navigation */}
      <VStack 
        flex={1} 
        w="full" 
        p={3} 
        spacing={1} 
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: borderColor,
            borderRadius: '24px',
          },
        }}
      >
        {navigation.map((item, idx) => (
          (!item.adminOnly || user?.role === 'admin') && (
            <NavItemComponent key={idx} item={item} />
          )
        ))}
      </VStack>
    </VStack>
  );

  // Version mobile
  if (isMobile) {
    return (
      <>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          h="60px"
          bg={bgColor}
          borderBottom="1px solid"
          borderColor={borderColor}
          px={4}
          display="flex"
          alignItems="center"
          zIndex={1000}
        >
          <IconButton
            aria-label="Menu"
            icon={<MdMenu />}
            onClick={drawer.onOpen}
            variant="ghost"
          />
          <Text ml={3} fontSize="lg" fontWeight="bold" color={activeColor}>
            ExpertBat
          </Text>
        </Box>

        <Drawer
          isOpen={drawer.isOpen}
          placement="left"
          onClose={drawer.onClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <SidebarContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box h="60px" />
      </>
    );
  }

  // Version desktop
  return (
    <>
      <Box
        as="nav"
        h="100vh"
        w={isCollapsed ? "70px" : "260px"}
        bg={bgColor}
        borderRight="1px solid"
        borderColor={borderColor}
        position="sticky"
        top={0}
        transition="all 0.2s"
        zIndex={1000}
      >
        <SidebarContent />
      </Box>

      {/* Modal Email */}
      <Modal 
        isOpen={emailModal.isOpen} 
        onClose={emailModal.onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Changer l'email</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              
            <FormLabel>Nouvel email</FormLabel>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Entrez votre nouvel email"
                size="md"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={handleUpdateEmail}
              isDisabled={!newEmail}
            >
              Sauvegarder
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setNewEmail('');
                emailModal.onClose();
              }}
            >
              Annuler
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Photo de profil */}
      <Modal 
        isOpen={pictureModal.isOpen} 
        onClose={pictureModal.onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Changer la photo de profil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nouvelle photo</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPicture(e.target.files?.[0] || null)}
                  p={1}
                  variant="unstyled"
                />
              </FormControl>
              {newPicture && (
                <Box
                  mt={2}
                  borderRadius="md"
                  overflow="hidden"
                  boxShadow="sm"
                  position="relative"
                  width="100%"
                >
                  <Image
                    src={URL.createObjectURL(newPicture)}
                    alt="Aperçu"
                    maxH="200px"
                    w="full"
                    objectFit="cover"
                  />
                  <IconButton
                    aria-label="Supprimer l'image"
                    icon={<MdExitToApp />}
                    size="sm"
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme="red"
                    onClick={() => setNewPicture(null)}
                  />
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleUpdatePicture}
              isDisabled={!newPicture}
              loadingText="Sauvegarde..."
            >
              Sauvegarder
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setNewPicture(null);
                pictureModal.onClose();
              }}
            >
              Annuler
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}