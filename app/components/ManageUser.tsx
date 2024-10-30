// components/ManageUser.tsx
'use client';

import { useEffect, useState } from 'react';
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
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface UserFormData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  password?: string;
  confirmPassword?: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserFormData>({
    id: '',
    name: '',
    email: '',
    role: 'user',
    password: '',
    confirmPassword: ''
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { getAuthHeaders } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setSelectedUser({
      id: '',
      name: '',
      email: '',
      role: 'user',
      password: '',
      confirmPassword: ''
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const headers = getAuthHeaders();

      const response = await fetch('/api/user', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        console.error('Erreur lors de la récupération des utilisateurs:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      console.log('Liste des utilisateurs récupérée:', data); // Cela doit afficher la structure complète
      if (data.success) {
        setUsers(data.data); // Mettez à jour l'état des utilisateurs avec data.data
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
      password: '',
      confirmPassword: ''
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
      errors.forEach(error => {
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
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: 'updateUser',
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          ...(selectedUser.password ? { password: selectedUser.password } : {})
        }),
      });

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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?`)) {
      return;
    }

    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "L'utilisateur a été supprimé avec succès",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        fetchUsers();
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

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
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
    <Container maxW="container.xl" py={5}>
      <Box overflowX="auto" bg="white" shadow="md" rounded="lg">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Nom</Th>
              <Th>Email</Th>
              <Th>Rôle</Th>
              <Th textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
          {users.length === 0 ? ( // Vérifiez si le tableau est vide
            <Tr>
              <Td colSpan={4} textAlign="center">Aucun utilisateur trouvé</Td>
            </Tr>
          ) : (
            users.map((user) => (
              <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                <Td fontWeight="medium">{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Badge
                    colorScheme={user.role === 'admin' ? 'red' : 'green'}
                    px={2}
                    py={1}
                    rounded="full"
                  >
                    {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2} justify="center">
                    <IconButton
                      aria-label="Modifier l'utilisateur"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEditUser(user)}
                    />
                    <IconButton
                      aria-label="Supprimer l'utilisateur"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedUser.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    name: e.target.value
                  })}
                  placeholder="Nom complet"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    email: e.target.value
                  })}
                  placeholder="email@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Rôle</FormLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    role: e.target.value as 'user' | 'admin'
                  })}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  {selectedUser.id ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                </FormLabel>
                <Input
                  type="password"
                  value={selectedUser.password}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    password: e.target.value
                  })}
                  placeholder={selectedUser.id ? "Laisser vide pour ne pas modifier" : "Minimum 6 caractères"}
                />
              </FormControl>

              {selectedUser.password && (
                <FormControl>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <Input
                    type="password"
                    value={selectedUser.confirmPassword}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirmer le mot de passe"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onClose();
              resetForm();
            }}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Sauvegarder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}