// app/expertises/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Badge,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Icon,
  HStack,
  Select,
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { FaHome, FaBuilding, FaDownload } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../lib/auth';
import { jsPDF } from "jspdf";
import type { User } from '../lib/auth';

interface ExpertiseListItem {
  _id: string;
  buildingType: 'maison' | 'appartement';
  details: {
    beneficiary: {
      firstName: string;
      lastName: string;
      address: string;
      phone: string;
    };
    construction: {
      year: number;
      area: number;
      floors: number;
    };
    rooms: Array<{
      id: string;
      type: string;
      floor: number;
      windows: {
        count: number;
        type: string;
        installationYear: number;
      };
      heating: {
        types: string[];
        installationYear: number;
      };
      ventilation: string[];
      humidity: number;
    }>;
  };
  evaluations: {
    rooms: {
      [key: string]: {
        windows: number;
        heating: number;
        humidity: number;
        ventilation: number;
      };
    };
    global: {
      score: number;
      condition: 'Favorable' | 'Correct' | 'Critique';
      comment: string;
    };
  };
  createdAt: string;
  createdBy: string;
}

const downloadPDF = async (expertise: ExpertiseListItem): Promise<Blob> => {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 255);
  doc.text("Rapport d'expertise habitat", 20, 20);
  
  // Informations générales
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Informations générales", 20, 40);
  doc.setFontSize(12);
  doc.text(`Type de bâtiment: ${expertise.buildingType === 'maison' ? 'Maison' : 'Appartement'}`, 25, 50);
  doc.text(`Bénéficiaire: ${expertise.details.beneficiary.firstName} ${expertise.details.beneficiary.lastName}`, 25, 60);
  doc.text(`Adresse: ${expertise.details.beneficiary.address}`, 25, 70);
  doc.text(`Téléphone: ${expertise.details.beneficiary.phone}`, 25, 80);
  
  // Caractéristiques du bâtiment
  doc.setFontSize(14);
  doc.text("Caractéristiques du bâtiment", 20, 100);
  doc.setFontSize(12);
  doc.text(`Année de construction: ${expertise.details.construction.year}`, 25, 110);
  doc.text(`Surface: ${expertise.details.construction.area} m²`, 25, 120);
  doc.text(`Nombre d'étages: ${expertise.details.construction.floors}`, 25, 130);

  // Évaluation par pièce
  doc.setFontSize(14);
  doc.text("Évaluation par pièce", 20, 150);
  doc.setFontSize(12);
  let yPos = 160;
  expertise.details.rooms.forEach(room => {
    const evaluation = expertise.evaluations.rooms[room.id];
    if (evaluation) {
      doc.text(`${room.type} (Étage ${room.floor})`, 25, yPos);
      yPos += 10;
      if (room.windows.count > 0) {
        doc.text(`- Ouvrants: ${evaluation.windows}/5`, 30, yPos);
        yPos += 10;
      }
      if (room.heating.types.length > 0) {
        doc.text(`- Chauffage: ${evaluation.heating}/5`, 30, yPos);
        yPos += 10;
      }
      doc.text(`- Humidité: ${evaluation.humidity}/5`, 30, yPos);
      yPos += 10;
      if (room.ventilation.length > 0) {
        doc.text(`- Ventilation: ${evaluation.ventilation}/5`, 30, yPos);
        yPos += 10;
      }
    }
    yPos += 5;
  });

  // Évaluation globale
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(14);
  doc.text("Évaluation globale", 20, yPos);
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Score global: ${expertise.evaluations.global.score.toFixed(1)}/5`, 25, yPos);
  yPos += 10;
  doc.text(`État: ${expertise.evaluations.global.condition}`, 25, yPos);
  yPos += 10;

  // Commentaire
  doc.setFontSize(14);
  doc.text("Recommandations", 20, yPos + 10);
  doc.setFontSize(12);
  const splitComment = doc.splitTextToSize(expertise.evaluations.global.comment, 170);
  doc.text(splitComment, 25, yPos + 20);

  // Date de création
  doc.setFontSize(10);
  doc.text(`Date de création: ${new Date(expertise.createdAt).toLocaleDateString()}`, 20, doc.internal.pageSize.height - 10);

  return doc.output('blob');
};

export default function ExpertiseList() {
  const [expertises, setExpertises] = useState<ExpertiseListItem[]>([]);
  const [filteredExpertises, setFilteredExpertises] = useState<ExpertiseListItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [expertiseToDelete, setExpertiseToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user, getAllUsers } = useAuth();
  const toast = useToast();
  const dataLoaded = useRef(false);

  const fetchExpertises = useCallback(async () => {
    if (!user || dataLoaded.current) return;

    try {
      const response = await fetch('/api/expertise', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des expertises');
      }

      const result = await response.json();
      const data = result.data;
      setExpertises(data);
      setFilteredExpertises(user.role === 'admin' ? data : data.filter((exp: ExpertiseListItem) => exp.createdBy === user.id));
      dataLoaded.current = true;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les expertises',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const loadAgents = useCallback(async () => {
    if (user?.role !== 'admin' || dataLoaded.current) return;
    
    try {
      const userList = await getAllUsers();
      setAgents(userList.filter((u) => u.role === 'user'));
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
    }
  }, [user?.role, getAllUsers]);

  useEffect(() => {
    if (user && !dataLoaded.current) {
      fetchExpertises();
      if (user.role === 'admin') {
        loadAgents();
      }
    }

    return () => {
      dataLoaded.current = false;
    };
  }, [user, fetchExpertises, loadAgents]);

  const handleAgentFilter = useCallback((agentEmail: string) => {
    setSelectedAgent(agentEmail);
    setFilteredExpertises(agentEmail 
      ? expertises.filter(expertise => expertise.createdBy === agentEmail)
      : expertises
    );
  }, [expertises]);

  const handleDownloadPDF = async (expertise: ExpertiseListItem) => {
    try {
      const pdfBlob = await downloadPDF(expertise);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expertise_${expertise._id}.pdf`);
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

  const handleDeleteClick = (id: string) => {
    setExpertiseToDelete(id);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!expertiseToDelete) return;

    try {
      const response = await fetch(`/api/expertise/${expertiseToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'expertise");
      }

      setExpertises(prev => prev.filter(exp => exp._id !== expertiseToDelete));
      setFilteredExpertises(prev => prev.filter(exp => exp._id !== expertiseToDelete));
      
      toast({
        title: 'Succès',
        description: 'Expertise supprimée avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'expertise",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
      setExpertiseToDelete(null);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Favorable':
        return 'green';
      case 'Correct':
        return 'yellow';
      case 'Critique':
        return 'red';
      default:
        return 'gray';
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
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading>Expertises réalisées</Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => router.push('/expertises/new')}
            >
              Nouvelle expertise
            </Button>
          </Flex>

          {user?.role === 'admin' && (
            <Select 
              placeholder="Filtrer par agent" 
              onChange={(e) => handleAgentFilter(e.target.value)} 
              value={selectedAgent}
              maxW="300px"
            >
              <option value="">Tous les agents</option>
              {agents.map((agent) => (
                <option key={agent.email} value={agent.email}>{agent.name}</option>
              ))}
            </Select>
          )}

          {filteredExpertises.length === 0 ? (
            <Text fontSize="lg" textAlign="center" color="gray.500" py={8}>
              Aucune expertise n'a été réalisée pour le moment.
            </Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Type</Th>
                  <Th>Bénéficiaire</Th>
                  <Th>Adresse</Th>
                  <Th>Surface</Th>
                  <Th>État</Th>
                  <Th>Date</Th>
                  {user?.role === 'admin' && <Th>Créé par</Th>}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredExpertises.map((expertise) => (
                  <Tr key={expertise._id}>
                    <Td>
                      <HStack>
                        <Icon
                          as={expertise.buildingType === 'maison' ? FaHome : FaBuilding}
                          w={5}
                          h={5}
                        />
                        <Text>
                          {expertise.buildingType === 'maison' ? 'Maison' : 'Appartement'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      {expertise.details.beneficiary.firstName} {expertise.details.beneficiary.lastName}
                    </Td>
                    <Td>{expertise.details.beneficiary.address}</Td>
                    <Td>{expertise.details.construction.area} m²</Td>
                    <Td>
                      <Badge
                        colorScheme={getConditionColor(expertise.evaluations.global.condition)}
                        p={2}
                        borderRadius="full"
                      >
                        {expertise.evaluations.global.condition}
                        {' '}({expertise.evaluations.global.score.toFixed(1)}/5)
                      </Badge>
                    </Td>
                    <Td>{new Date(expertise.createdAt).toLocaleDateString()}</Td>
                    {user?.role === 'admin' && <Td>{expertise.createdBy}</Td>}
                    <Td>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            icon={<FaDownload />}
                            onClick={() => handleDownloadPDF(expertise)}
                          >
                            Télécharger en PDF
                          </MenuItem>
                          <MenuItem
                            onClick={() => router.push(`/expertises/${expertise._id}`)}
                          >
                            Voir les détails
                          </MenuItem>
                          <MenuItem
                            onClick={() => router.push(`/expertises/edit/${expertise._id}`)}
                          >
                            Modifier
                          </MenuItem>
                          <MenuItem 
                            onClick={() => handleDeleteClick(expertise._id)}
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
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
}