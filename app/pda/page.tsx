'use client';

import { useEffect, useState } from 'react';
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
  title: string;
  beneficiaryName: string;
  createdAt: string;
  status: string;
  grantAmount: number;
  createdBy: string;
}

// Fonction pour télécharger un PDF
const downloadPDF = async (plan: PdaSummary): Promise<Blob> => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Plan d'Aide à l'Habitat", 20, 20);

  doc.setFontSize(12);
  doc.text(`Bénéficiaire: ${plan.beneficiaryName}`, 20, 40);
  doc.text(`Montant de l'aide: ${plan.grantAmount ? plan.grantAmount.toLocaleString() : 'N/A'} €`, 20, 50);
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

  // Hook pour charger les plans et agents uniquement une fois après authentification de l'utilisateur
  useEffect(() => {
    if (!user) return; // Si l'utilisateur n'est pas authentifié, ne rien faire

    const loadPlansAndAgents = async () => {
      setLoading(true);
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
        const data: PdaSummary[] = result.data; // Récupérer uniquement les données
        console.log("Plans d'aide reçus:", data);
        setPlans(data);
        setFilteredPlans(user.role === 'admin' ? data : data.filter((plan: PdaSummary) => plan.createdBy === user.id));

        // Si l'utilisateur est admin, charger les agents
        if (user.role === 'admin') {
          const userList = await getAllUsers();
          setAgents(userList.filter((u) => u.role === 'user'));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false); // Fin du chargement
      }
    };

    loadPlansAndAgents();
  }, [user, getAllUsers, toast]); // Dépendance à 'user', 'getAllUsers', 'toast'

  // Gestion du filtrage par agent
  const handleAgentFilter = (agentEmail: string) => {
    setSelectedAgent(agentEmail);
    if (agentEmail) {
      setFilteredPlans(plans.filter(plan => plan.createdBy === agentEmail));
    } else {
      setFilteredPlans(plans);
    }
  };

  // Fonction pour télécharger un PDF
  const handleDownloadPDF = async (plan: PdaSummary) => {
    try {
      const pdfBlob = await downloadPDF(plan);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan_aide_${plan.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
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

  // Fonction pour modifier un plan
  const handleEdit = (planId: string) => {
    router.push(`/pda/edit/${planId}`);
  };

  // Fonction pour gérer la suppression
  const handleDeleteClick = (planId: string) => {
    setPlanToDelete(planId);
    onOpen();
  };

  // Confirmation de suppression
  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      try {
        const response = await fetch(`/api/pda/${planToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression du plan');
        }

        setPlans(plans.filter(plan => plan.id !== planToDelete));
        setFilteredPlans(filteredPlans.filter(plan => plan.id !== planToDelete));
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
      }
    }
    onClose();
    setPlanToDelete(null);
  };

  // Affichage pendant le chargement
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

  // Affichage de la page avec les PDAs et actions
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
            <Select placeholder="Filtrer par agent" onChange={(e) => handleAgentFilter(e.target.value)} value={selectedAgent}>
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
                  <Tr key={plan.id}>
                    <Td>{plan.title}</Td>
                    <Td>{plan.beneficiaryName || 'Non spécifié'}</Td>
                    <Td>{new Date(plan.createdAt).toLocaleDateString()}</Td>
                    <Td>{plan.status}</Td>
                    <Td>{plan.grantAmount ? plan.grantAmount.toLocaleString() : 'N/A'} €</Td>
                    {user?.role === 'admin' && <Td>{plan.createdBy}</Td>}
                    <Td>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem onClick={() => handleDownloadPDF(plan)}>Télécharger en PDF</MenuItem>
                          <MenuItem onClick={() => handleEdit(plan.id)}>Modifier</MenuItem>
                          <MenuItem onClick={() => handleDeleteClick(plan.id)} color="red.500">Supprimer</MenuItem>
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

      {/* Modal de confirmation de suppression */}
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

