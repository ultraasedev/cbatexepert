// components/CreateUser.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  Select,
  FormErrorMessage,
  Container,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react';
import Sidebar from './Sidebar';

interface FormData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export default function CreateUser() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Responsive design variables
  const formWidth = useBreakpointValue({
    base: "90%",
    sm: "450px",
    md: "500px",
  });

  const padding = useBreakpointValue({
    base: 4,
    md: 6,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'register',
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Utilisateur créé',
          description: 'L\'utilisateur a été créé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
      } else {
        throw new Error(data.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <Flex width="100%" minHeight="100vh">
      {/* Sidebar - Responsive */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box flex="1" bg="gray.50">
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            minHeight="80vh"
          >
            <Box
              width={formWidth}
              p={padding}
              bg="white"
              borderRadius="lg"
              boxShadow="xl"
              borderWidth={1}
              borderColor="gray.200"
            >
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Entrez le nom"
                    size="lg"
                    bg="white"
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Entrez l'email"
                    size="lg"
                    bg="white"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Mot de passe</FormLabel>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Entrez le mot de passe"
                    size="lg"
                    bg="white"
                  />
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.role}>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    size="lg"
                    bg="white"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </Select>
                  <FormErrorMessage>{errors.role}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isSubmitting}
                  width="full"
                  size="lg"
                  mt={4}
                  onClick={handleSubmit}
                >
                  Créer l'utilisateur
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
}