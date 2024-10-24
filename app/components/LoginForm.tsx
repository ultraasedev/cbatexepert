// app/components/LoginForm.tsx
import { useState } from 'react';
import { 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  Heading,
  InputGroup, 
  InputRightElement, 
  IconButton,
  useToast
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Submitting with:', { email, password }); // Log pour débogage
      await onSubmit(email, password);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Erreur de connexion',
        description: 'Veuillez vérifier vos identifiants',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch" width="100%">
        <Heading as="h1" size="lg" textAlign="center">
          Connectez-vous à votre compte
        </Heading>
        <FormControl>
          <FormLabel>Adresse email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormControl>
        <FormControl>
          <FormLabel>Mot de passe</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputRightElement width="4.5rem">
              <IconButton
                h="1.75rem"
                size="sm"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Button 
          type="submit" 
          colorScheme="purple" 
          size="lg"
          isLoading={isLoading}
        >
          Se connecter
        </Button>
      </VStack>
    </form>
  );
}