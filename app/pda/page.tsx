'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Heading, Text, VStack, Spinner, Table, Thead, Tbody, Tr, Th, Td, Button, Select,
  Menu, MenuButton, MenuList, MenuItem, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useToast
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../lib/auth';
import type { User } from '../lib/auth';
import { jsPDF } from "jspdf";

interface PdaSummary {
  id: string;
  _id: string;  // Ajout de _id car MongoDB l'utilise
  title: string;
  details: {
    beneficiary: {
      name: string;
      address: string;
      phone: string;
    };
    typeOfImprovement: string;
    fiscalIncome: number;
    estimatedCost: number;
    grantAmount: number;
  };
  createdAt: string;
  status: string;
  createdBy: string;
}

const downloadPDF = async (plan: PdaSummary): Promise<Blob> => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Plan d'Aide à l'Habitat", 20, 20);
  doc.setFontSize(12);
  doc.text(`Bénéficiaire: ${plan.details.beneficiary.name}`, 20, 40);
  doc.text(`Montant de l'aide: ${plan.details.grantAmount ? plan.details.grantAmount.toLocaleString() : 'N/A'} €`, 20, 50);
  doc.text(`Prestation envisagée: ${plan.title}`, 20, 60);
  doc.text(`Date de création: ${new Date(plan.createdAt).toLocaleDateString()}`, 20, 70);
  return doc.output('blob');
};

export default function PdaPlansList() {
  const [plans, setPlans] = useState<PdaSummary[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PdaSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user, getAllUsers } = useAuth();
  const toast = useToast();
  const isInitialMount = useRef(true);

  // Charger les plans une seule fois au montage initial
  useEffect(() => {
    const loadPlans = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/pda', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des plans d\'aide');
        }

        const result = await response.json();
        const data: PdaSummary[] = result.data;
        setPlans(data);
        setFilteredPlans(user.role === 'admin' ? data : data.filter(plan => plan.createdBy === user.id));
      } catch (error) {
        console.error('Erreur lors du chargement des plans:', error);
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

    // Ne charger qu'au montage initial
    if (isInitialMount.current && user) {
      loadPlans();
      isInitialMount.current = false;
    }
  }, [user, toast]);

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

  const handleAgentFilter = useCallback((agentEmail: string) => {
    setSelectedAgent(agentEmail);
    setFilteredPlans(agentEmail 
      ? plans.filter(plan => plan.createdBy === agentEmail)
      : plans
    );
  }, [plans]);

  const handleDownloadPDF = async (plan: PdaSummary) => {
    try {
      const pdfBlob = await downloadPDF(plan);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan_aide_${plan.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "Le PDF a été téléchargé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
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
    if (!planToDelete) return;
    
    try {
      const response = await fetch(`/api/pda/${planToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du plan');
      }

      // Utiliser _id pour la suppression car c'est l'identifiant MongoDB
      setPlans(prevPlans => prevPlans.filter(plan => plan._id !== planToDelete));
      setFilteredPlans(prevFiltered => prevFiltered.filter(plan => plan._id !== planToDelete));
      
      toast({
        title: "Plan supprimé",
        description: "Le plan d'aide a été supprimé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      toast({
        title: "Erreur de suppression",
        description: "Une erreur est survenue lors de la suppression du plan.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setPlanToDelete(null);
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
            <Heading>Plans d'aide réalisés</Heading>
            <Button colorScheme="blue" onClick={() => router.push('/pda/new')}>
              Nouveau Plan d'aide
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
                <option key={agent.email} value={agent.email}>{agent.name}</option>
              ))}
            </Select>
          )}

          {filteredPlans.length === 0 ? (
            <Text>Aucun plan d'aide n'a été réalisé pour le moment.</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Titre</Th>
                  <Th>Bénéficiaire</Th>
                  <Th>Date de création</Th>
                  <Th>Statut</Th>
                  <Th>Montant de l'aide</Th>
                  {user?.role === 'admin' && <Th>Créé par</Th>}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPlans.map((plan) => (
                  <Tr key={plan._id}>
                    <Td>{plan.title}</Td>
                    <Td>{plan.details.beneficiary.name}</Td>
                    <Td>{new Date(plan.createdAt).toLocaleDateString()}</Td>
                    <Td>{plan.status}</Td>
                    <Td>{plan.details.grantAmount ? plan.details.grantAmount.toLocaleString() : 'N/A'} €</Td>
                    {user?.role === 'admin' && <Td>{plan.createdBy}</Td>}
                    <Td>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem onClick={() => handleDownloadPDF(plan)}>Télécharger en PDF</MenuItem>
                          <MenuItem onClick={() => router.push(`/pda/edit/${plan._id}`)}>Modifier</MenuItem>
                          <MenuItem onClick={() => { setPlanToDelete(plan._id); onOpen(); }} color="red.500">
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
            Êtes-vous sûr de vouloir supprimer ce plan d'aide ? Cette action est irréversible.
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