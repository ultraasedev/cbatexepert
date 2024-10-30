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
  _id: string;
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
  try {
    const response = await fetch(`/api/pda/${plan._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données formatées');
    }

    const data = await response.json();
    const formattedPDA = data.data;
    // Fonction pour formater les nombres avec une virgule
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(num);
    };
        

    // Configuration initiale du PDF
    const doc = new jsPDF();

    // En-tête du document
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("PLAN D'AIDE À L'HABITAT", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Référence: ${formattedPDA._id}`, 105, 30, { align: 'center' });

    // Rectangle "Éligible" en vert
    doc.setFillColor(34, 197, 94); // Vert
    doc.rect(150, 35, 40, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("ÉLIGIBLE", 170, 42, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Section Bénéficiaire
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BÉNÉFICIAIRE', 20, 60);
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 63, 190, 63);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Nom complet:', 20, 73);
    doc.text(formattedPDA.details.beneficiary.name, 80, 73);
    doc.text('Téléphone:', 20, 83);
    doc.text(formattedPDA.details.beneficiary.phone, 80, 83);
    doc.text('Adresse:', 20, 93);
    doc.text(formattedPDA.details.beneficiary.address, 80, 93);

    // Section Nature des Travaux
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NATURE DES TRAVAUX', 20, 113);
    doc.line(20, 116, 190, 116);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(formattedPDA.details.typeOfImprovement, 20, 126);

    // Section Données Financières
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DONNÉES FINANCIÈRES', 20, 146);
    doc.line(20, 149, 190, 149);

    // Fonction pour dessiner les cadres financiers
    const drawFinanceBox = (x: number, label: string, value: number, r: number, g: number, b: number) => {
      doc.setFillColor(r, g, b);
      doc.rect(x, 156, 55, 25, 'F');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(label, x + 27.5, 164, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const formattedValue = formatNumber(value).replace(/\u202f/g, ' ');
      doc.text(formattedValue, x + 27.5, 174, { align: 'center' });
    };

    // Afficher les montants dans des cadres colorés
    drawFinanceBox(20, 'Revenu fiscal', 
      formattedPDA.details.fiscalIncome,
      235, 245, 255);
    drawFinanceBox(85, 'Coût estimé',
      formattedPDA.details.estimatedCost,
      240, 240, 240);
    drawFinanceBox(150, "Montant de l'aide",
      formattedPDA.details.grantAmount,
      240, 250, 240);

    // Pied de page
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Date de création: ${new Date(formattedPDA.createdAt).toLocaleDateString('fr-FR')}`, 20, 270);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 190, 270, { align: 'right' });
    doc.line(20, 265, 190, 265);

    return doc.output('blob');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
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

    if (isInitialMount.current && user) {
      loadPlans();
      isInitialMount.current = false;
    }
  }, [user, toast]);

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
      link.setAttribute('download', `plan_aide_${plan._id}.pdf`);
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