// components/Sidebar.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box, 
  VStack, 
  Text, 
  IconButton, 
  Tooltip, 
  useMediaQuery, 
  Collapse, 
  Avatar,
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem as ChakraMenuItem, 
  Portal, 
  Badge, 
  useDisclosure, 
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast
} from '@chakra-ui/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import {
  MdDashboard,
  MdAssignment,
  MdAddBox,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
  MdMenu,
  MdExpandMore,
  MdCameraAlt,
  MdEdit,
  MdExitToApp
} from 'react-icons/md';
import { IconType } from 'react-icons';

interface MenuItemProps {
  icon: IconType;
  label: string;
  onClick: () => void;
  count?: number;
}

export default function Sidebar() {
  const { user, logout, updateEmail, updateProfilePicture } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const menuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // États pour les modals
  const { isOpen: isEmailModalOpen, onOpen: onEmailModalOpen, onClose: onEmailModalClose } = useDisclosure();
  const { isOpen: isPictureModalOpen, onOpen: onPictureModalOpen, onClose: onPictureModalClose } = useDisclosure();
  const [newEmail, setNewEmail] = useState('');
  const [newPicture, setNewPicture] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar);

  useEffect(() => {
    setAvatarSrc(user?.avatar);
  }, [user?.avatar]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const toggleUserManagement = () => setIsUserManagementOpen(!isUserManagementOpen);

  const handleUpdateEmail = async () => {
    try {
      await updateEmail(newEmail);
      toast({
        title: "Email mis à jour",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onEmailModalClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      toast({
        title: "Erreur lors de la mise à jour de l'email",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePicture = async () => {
    if (newPicture) {
      try {
        const updatedUser = await updateProfilePicture(newPicture);
        setAvatarSrc(updatedUser.avatar);
        toast({
          title: "Photo de profil mise à jour",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onPictureModalClose();
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la photo de profil:', error);
        toast({
          title: "Erreur lors de la mise à jour de la photo de profil",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick, count }) => {
    const isActive = pathname === onClick.toString();

    return (
      <Tooltip label={isCollapsed ? label : ''} placement="right" isDisabled={!isCollapsed}>
        <Box 
          display="flex" 
          alignItems="center" 
          w="100%" 
          py={2}
          px={4} 
          cursor="pointer"
          bg={isActive ? '#000091' : 'transparent'}
          color={isActive ? 'white' : '#161616'}
          _hover={{ bg: isActive ? '#000091' : 'gray.100' }}
          onClick={onClick}
          role="group"
        >
          <Icon 
            size={20} 
            style={{ 
              marginRight: '12px', 
              color: isActive ? 'white' : '#000091',
            }} 
          />
          <Text 
            flex={1} 
            fontSize="sm" 
            fontWeight={isActive ? 'bold' : 'normal'}
          >
            {label}
          </Text>
          {count !== undefined && (
            <Badge colorScheme={isActive ? 'white' : 'green'} borderRadius="full" px={2} fontSize="xs">
              {count}
            </Badge>
          )}
        </Box>
      </Tooltip>
    )
  }

  const sidebarContent = (
    <VStack align="stretch" spacing={1} height="100%">
      <Box mb={6}>
        <Text fontSize="xl" fontWeight="bold" color="#000091">ExpertBat</Text>
      </Box>

      <Text fontSize="xs" fontWeight="bold" color="#1212FF" mb={2} pl={4}>GENERAL</Text>
      
      <MenuItem icon={MdDashboard} label="Dashboard" onClick={() => router.push('/dashboard')}  />
      <MenuItem icon={MdAssignment} label="Expertises" onClick={() => router.push('/expertises')} />
      <MenuItem icon={MdAddBox} label="Nouvelle Expertise" onClick={() => router.push('/expertises/new')} />
      <MenuItem icon={MdAssignment} label="Plans d'aide" onClick={() => router.push('/pda')} />
      <MenuItem icon={MdAddBox} label="Nouveau Plan d'aide" onClick={() => router.push('/pda/new')} />

      {user?.role === 'admin' && (
        <>
          <Text fontSize="xs" fontWeight="bold" color="#1212FF" mt={4} mb={2} pl={4}>ADMIN</Text>
          <MenuItem icon={MdSettings} label="Gérer les Users" onClick={toggleUserManagement} />
          <Collapse in={isUserManagementOpen || isCollapsed}>
            <MenuItem icon={MdAddBox} label="Créer un Agent" onClick={() => router.push('/guser/create')} />
            <MenuItem icon={MdSettings} label="Mes Agents" onClick={() => router.push('/guser/manage')} />
          </Collapse>
    
        </>
      )}

      <Box flex="1" />

      <Box 
        display="flex" 
        alignItems="center" 
        p={2}
        borderTop="1px solid"
        borderColor="gray.200"
        mt={2}
      >
        <Avatar size="xs" name={user?.name} src={avatarSrc} />
        <Box ml={2} flex={1}>
          <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="#1212FF" >{user?.name}</Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>{user?.email}</Text>
        </Box>
        <Menu isOpen={isOpen} onClose={onClose}>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<MdExpandMore />}
            variant="ghost"
            size="sm"
            onClick={onOpen}
          />
          <Portal>
            <MenuList onMouseEnter={onOpen} onMouseLeave={onClose} ref={menuRef}>
              <ChakraMenuItem icon={<MdCameraAlt />} onClick={onPictureModalOpen}>
                Changer la photo de profil
              </ChakraMenuItem>
              <ChakraMenuItem icon={<MdEdit />} onClick={onEmailModalOpen}>
                Changer l'email
              </ChakraMenuItem>
              <ChakraMenuItem icon={<MdExitToApp />} onClick={logout}>
                Se déconnecter
              </ChakraMenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
    </VStack>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          aria-label="Open menu"
          icon={<MdMenu />}
          position="fixed"
          top={4}
          left={4}
          zIndex={20}
          onClick={toggleMobileSidebar}
        />
        <Box
          position="fixed"
          left={0}
          top={0}
          w="full"
          h="full"
          bg="rgba(0, 0, 0, 0.4)"
          zIndex={10}
          display={isMobileOpen ? "block" : "none"}
          onClick={toggleMobileSidebar}
        />
        <Box
          position="fixed"
          left={isMobileOpen ? 0 : "-250px"}
          top={0}
          w="250px"
          h="full"
          bg="white"
          zIndex={15}
          transition="left 0.3s"
          boxShadow="lg"
          p={4}
          overflowY="auto"
        >
          {sidebarContent}
        </Box>
      </>
    );
  }

  return (
    <>
      <Box
        w={isCollapsed ? "60px" : "250px"}
        bg="white"
        minH="100vh"
        boxShadow="lg"
        p={4}
        position="relative"
        transition="width 0.3s"
        overflowY="auto"
      >
        {sidebarContent}
        <IconButton
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
          position="absolute"
          top={2}
          right={0}
          zIndex={2}
          size="sm"
          boxShadow="md"
          onClick={toggleSidebar}
        />
      </Box>

      {/* Modal pour changer l'email */}
      <Modal isOpen={isEmailModalOpen} onClose={onEmailModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Changer l'adresse email</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nouvelle adresse email</FormLabel>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateEmail}>
              Sauvegarder
            </Button>
            <Button variant="ghost" onClick={onEmailModalClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pour changer la photo de profil */}
      <Modal isOpen={isPictureModalOpen} onClose={onPictureModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Changer la photo de profil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nouvelle photo de profil</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPicture(e.target.files?.[0] || null)}
              />
            </FormControl>
            {newPicture && (
              <Box mt={4}>
                <img
                  src={URL.createObjectURL(newPicture)}
                  alt="Aperçu"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdatePicture}>
              Sauvegarder
            </Button>
            <Button variant="ghost" onClick={onPictureModalClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}