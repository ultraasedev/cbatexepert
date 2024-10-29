'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth, User } from '../lib/auth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Expertise {
  _id: string;
  typeLogement: string;
  beneficiaire: {
    nom: string;
    adresse: string;
  };
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  status: string;
  evaluations?: {
    global?: {
      condition: string;
    };
  };
}

export default function ExpertiseList() {
  const [expertises, setExpertises] = useState<Expertise[]>([]);
  const [filteredExpertises, setFilteredExpertises] = useState<Expertise[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [expertiseToDelete, setExpertiseToDelete] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user, getAllUsers, getAuthHeaders } = useAuth();
  const toast = useToast();
  const isInitialMount = useRef(true);

  // Charger les expertises une seule fois au montage initial
  useEffect(() => {
    const loadExpertises = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/expertises', {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des expertises');
        }

        const result = await response.json();
        const data: Expertise[] = result.data;
        setExpertises(data);
        setFilteredExpertises(user.role === 'admin' ? data : data.filter(exp => exp.createdBy.id === user.id));
      } catch (error) {
        console.error('Erreur lors du chargement des expertises:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isInitialMount.current && user) {
      loadExpertises();
      isInitialMount.current = false;
    }
  }, [user, toast, getAuthHeaders]);

  // Charger les agents une seule fois si admin
  useEffect(() => {
    const loadAgents = async () => {
      if (user?.role === 'admin' && isInitialMount.current) {
        try {
          const userList = await getAllUsers();
          setAgents(userList.filter(u => u.role === 'user'));
        } catch (error) {
          console.error('Erreur lors du chargement des agents:', error);
        }
      }
    };

    loadAgents();
  }, [user?.role, getAllUsers]);

  const handleAgentFilter = (agentId: string) => {
    setSelectedAgent(agentId);
    setFilteredExpertises(agentId 
      ? expertises.filter(expertise => expertise.createdBy.id === agentId)
      : expertises
    );
  };

  const handleDownloadPDF = async (expertiseId: string) => {
    try {
      const response = await fetch(`/api/expertises/${expertiseId}/pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expertise-${expertiseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Téléchargement réussi",
        description: "Le PDF a été téléchargé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur est survenue lors du téléchargement du PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expertiseToDelete) return;
    
    try {
      const response = await fetch(`/api/expertises/${expertiseToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setExpertises(prev => prev.filter(exp => exp._id !== expertiseToDelete));
      setFilteredExpertises(prev => prev.filter(exp => exp._id !== expertiseToDelete));
      
      toast({
        title: "Expertise supprimée",
        description: "L'expertise a été supprimée avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erreur de suppression",
        description: "Une erreur est survenue lors de la suppression de l'expertise",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setExpertiseToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <VStack align="stretch" spacing={6}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading>Expertises réalisées</Heading>
            <Button 
              colorScheme="blue" 
              onClick={() => router.push('/expertises/new')}
            >
              Nouvelle Expertise
            </Button>
          </Box>

          {user?.role === 'admin' && (
            <Select 
              placeholder="Filtrer par agent" 
              onChange={(e) => handleAgentFilter(e.target.value)} 
              value={selectedAgent}
            >
              <option value="">Tous les agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </Select>
          )}

          {filteredExpertises.length === 0 ? (
            <Text>Aucune expertise n'a été réalisée pour le moment.</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Bénéficiaire</Th>
                  <Th>Adresse</Th>
                  <Th>État</Th>
                  {user?.role === 'admin' && <Th>Agent</Th>}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredExpertises.map((expertise) => (
                  <Tr key={expertise._id}>
                    <Td>{format(new Date(expertise.createdAt), 'dd/MM/yyyy', { locale: fr })}</Td>
                    <Td>{expertise.typeLogement}</Td>
                    <Td>{expertise.beneficiaire.nom}</Td>
                    <Td>{expertise.beneficiaire.adresse}</Td>
                    <Td>{expertise.evaluations?.global?.condition || 'Non évalué'}</Td>
                    {user?.role === 'admin' && <Td>{expertise.createdBy.name}</Td>}
                    <Td>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem onClick={() => handleDownloadPDF(expertise._id)}>
                            Télécharger en PDF
                          </MenuItem>
                          <MenuItem onClick={() => router.push(`/expertises/edit/${expertise._id}`)}>
                            Modifier
                          </MenuItem>
                          <MenuItem 
                            onClick={() => { setExpertiseToDelete(expertise._id); onOpen(); }} 
                            color="red.500"
                          >
                            Supprimer
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Êtes-vous sûr de vouloir supprimer cette expertise ? Cette action est irréversible.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}