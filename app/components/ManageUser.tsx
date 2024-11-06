import { useEffect, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
  Container,
  Flex,
  Spinner,
  Select,
  Text,
  Badge,
  HStack,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import { useRef } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface UserFormData {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  password?: string;
  confirmPassword?: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserFormData>({
    id: "",
    name: "",
    email: "",
    role: "user",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();

  const toast = useToast();
  const { getAuthHeaders } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setSelectedUser({
      id: "",
      name: "",
      email: "",
      role: "user",
      password: "",
      confirmPassword: "",
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user", {
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }
  
      const data = await response.json();
      if (data.success) {
        console.log('Utilisateurs reçus:', data.data);
        setUsers(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Erreur",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchUsers();
  }, []); 

  const handleEditUser = (user: User) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      confirmPassword: "",
    });
    onOpen();
  };

  const validateForm = () => {
    const errors = [];
    if (!selectedUser.name || selectedUser.name.length < 2) {
      errors.push("Le nom doit contenir au moins 2 caractères");
    }
    if (!selectedUser.email || !/^\S+@\S+\.\S+$/.test(selectedUser.email)) {
      errors.push("L'email n'est pas valide");
    }
    if (selectedUser.password && selectedUser.password.length < 6) {
      errors.push("Le mot de passe doit contenir au moins 6 caractères");
    }
    if (selectedUser.password !== selectedUser.confirmPassword) {
      errors.push("Les mots de passe ne correspondent pas");
    }
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: "Erreur de validation",
          description: error,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: "updateUser",
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          ...(selectedUser.password ? { password: selectedUser.password } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "L'utilisateur a été mis à jour avec succès",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        fetchUsers();
        onClose();
        resetForm();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    console.log('ID à supprimer:', userId);
    setUserToDelete({ id: userId, name: userName });
    onDeleteAlertOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    console.log('Tentative de suppression de l\'utilisateur:', userToDelete);
  
    try {
      // Assurez-vous que les en-têtes sont corrects
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      };
  
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify({ 
          userId: userToDelete.id // Utiliser l'UUID généré
        })
      });
      
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }
  
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "L'utilisateur a été supprimé avec succès",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        fetchUsers(); // Rafraîchir la liste
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteAlertClose();
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <Flex 
      justify="center" 
      align="center" 
      minH={{ base: "30vh", md: "50vh" }}
      p={{ base: 4, md: 8 }}
    >
      <Spinner size="xl" color="blue.500" />
    </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">Erreur : {error}</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 5 }}>
      <Box 
        overflowX="auto" 
        bg="white" 
        shadow="md" 
        rounded="lg"
        mx={{ base: -4, sm: 0 }}
      >
        <Box
          overflowX="auto"
          sx={{
            '@media screen and (max-width: 48em)': {
              '.responsive-table': {
                display: 'block',
                'tbody tr': {
                  display: 'block',
                  marginBottom: '1rem',
                  boxShadow: 'sm',
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'gray.200',
                },
                'td': {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid',
                  borderColor: 'gray.100',
                  '&:before': {
                    content: 'attr(data-label)',
                    fontWeight: 'bold',
                    marginRight: '1rem',
                  },
                },
                'th': {
                  display: 'none',
                },
              },
            },
          }}
        >
          <Table variant="simple" className="responsive-table">
            <Thead display={{ base: 'none', md: 'table-header-group' }}>
              <Tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th textAlign="center">Actions</Th>
              </Tr>
            </Thead>
          <Tbody>
            {users.length === 0 ? (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  Aucun utilisateur trouvé
                </Td>
              </Tr>
            ) : (
              users.map((user) => (
                <Tr key={user.id} _hover={{ bg: "gray.50" }}>
                  <Td data-label="Nom" fontWeight="medium">
                    {user.name}
                  </Td>
                  <Td data-label="Email">
                    {user.email}
                  </Td>
                  <Td data-label="Rôle">
                    <Badge
                      colorScheme={user.role === "admin" ? "red" : "green"}
                      px={2}
                      py={1}
                      rounded="full"
                    >
                      {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                    </Badge>
                  </Td>
                  <Td data-label="Actions">
                    <HStack 
                      spacing={2} 
                      justify={{ base: 'flex-end', md: 'center' }}
                      width="100%"
                    >
                      <IconButton
                        aria-label="Modifier"
                        icon={<EditIcon />}
                        size={{ base: 'xs', md: 'sm' }}
                        colorScheme="blue"
                        onClick={() => handleEditUser(user)}
                      />
                      <IconButton
                        aria-label="Supprimer"
                        icon={<DeleteIcon />}
                        size={{ base: 'xs', md: 'sm' }}
                        colorScheme="red"
                        onClick={() => handleDeleteClick(user.id, user.name)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>

    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size={{ base: "full", md: "md" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent margin={{ base: 0, md: 'auto' }}>
          <ModalHeader fontSize={{ base: "lg", md: "xl" }}>
            {selectedUser.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nom complet"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Rôle</FormLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: e.target.value as "user" | "admin",
                    })
                  }
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  {selectedUser.id
                    ? "Nouveau mot de passe (optionnel)"
                    : "Mot de passe"}
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={selectedUser.password}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        password: e.target.value,
                      })
                    }
                    placeholder={    
                      selectedUser.id
                        ? "Laisser vide pour ne pas modifier"
                        : "Minimum 6 caractères"
                    }
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {selectedUser.password && (
                <FormControl>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={selectedUser.confirmPassword}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirmer le mot de passe"
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                onClose();
                resetForm();
              }}
              size={{ base: "sm", md: "md" }}
            >
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}  size={{ base: "sm", md: "md" }}>
              Sauvegarder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
        <AlertDialogContent margin={{ base: 4, md: 'auto' }}>
        <AlertDialogHeader fontSize={{ base: "lg", md: "xl" }}>
              Confirmer la suppression
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              {userToDelete?.name} ? Cette action est irréversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}   size={{ base: "sm", md: "md" }}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}   size={{ base: "sm", md: "md" }}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
