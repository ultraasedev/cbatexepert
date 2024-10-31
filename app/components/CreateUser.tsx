// components/CreateUser.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Input, 
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  VStack,
  useToast,
  Select,
  FormErrorMessage,
  Container,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <Box minH="100vh" display="flex" flexDir={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <Box 
        flex="1" 
        bg="gray.50" 
        p={{ base: 4, sm: 6, md: 8 }}
        width={{ base: '100%', md: 'auto' }}
      >
        <Container 
          maxW={{ base: "100%", sm: "450px", md: "500px" }}
          py={{ base: 4, md: 8 }}
        >
          <VStack spacing={6} align="stretch">
            <Heading 
              size={{ base: "md", md: "lg" }}
              textAlign={{ base: "center", md: "left" }}
            >
              Créer un nouvel utilisateur
            </Heading>

            <Box
              bg="white"
              p={{ base: 4, sm: 6, md: 8 }}
              borderRadius="lg"
              boxShadow="xl"
              width="100%"
            >
              <VStack spacing={5}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel fontSize={{ base: "sm", md: "md" }}>Nom</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Entrez le nom"
                    size={{ base: "md", md: "lg" }}
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel fontSize={{ base: "sm", md: "md" }}>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Entrez l'email"
                    size={{ base: "md", md: "lg" }}
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel fontSize={{ base: "sm", md: "md" }}>
                    Mot de passe
                  </FormLabel>
                  <InputGroup size={{ base: "md", md: "lg" }}>
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Entrez le mot de passe"
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.role}>
                  <FormLabel fontSize={{ base: "sm", md: "md" }}>Rôle</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    size={{ base: "md", md: "lg" }}
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
                  size={{ base: "md", md: "lg" }}
                  mt={4}
                  onClick={handleSubmit}
                >
                  Créer l'utilisateur
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
