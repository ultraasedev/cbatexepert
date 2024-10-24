'use client'

import { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  useToast, 
  Select,
  InputGroup,
  InputRightElement,
  IconButton,
  Text
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export default function CreateUser() {
  const [userData, setUserData] = useState({ name: '', email: '', role: 'user', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to:', '/api/users');
      console.log('Request data:', userData);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      toast({ title: "Utilisateur créé avec succès", status: "success" });
      setUserData({ name: '', email: '', role: 'user', password: '' });
    } catch (error: any) {
      console.error('Error details:', error);
      setError(error.message);
      toast({ title: "Erreur", description: error.message, status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Box maxWidth="400px" margin="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nom</FormLabel>
            <Input 
              name="name"
              value={userData.name} 
              onChange={handleInputChange}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input 
              name="email"
              type="email"
              value={userData.email} 
              onChange={handleInputChange}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Rôle</FormLabel>
            <Select 
              name="role"
              value={userData.role} 
              onChange={handleInputChange}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Mot de passe</FormLabel>
            <InputGroup>
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={userData.password}
                onChange={handleInputChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={togglePasswordVisibility}
                  variant="ghost"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          {error && (
            <Text color="red.500" fontSize="sm">
              Erreur: {error}
            </Text>
          )}
          <Button 
            type="submit" 
            colorScheme="blue" 
            width="full" 
            isLoading={isLoading}
            loadingText="Création en cours..."
          >
            Créer l'utilisateur
          </Button>
        </VStack>
      </form>
    </Box>
  );
}