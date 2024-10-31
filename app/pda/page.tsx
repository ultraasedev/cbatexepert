"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  useToast,
  Badge
} from "@chakra-ui/react";
import { ChevronDownIcon, DownloadIcon, 
  EditIcon, 
  DeleteIcon  } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../lib/auth";
import type { User } from "../lib/auth";
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
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données formatées");
    }

    const data = await response.json();
    const formattedPDA = data.data;
    // Fonction pour formater les nombres avec une virgule
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(num);
    };

    // Configuration initiale du PDF
    const doc = new jsPDF();

    // En-tête du document
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("PLAN D'AIDE À L'HABITAT", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Référence: ${formattedPDA._id}`, 105, 30, { align: "center" });

    // Rectangle "Éligible" en vert
    doc.setFillColor(34, 197, 94); // Vert
    doc.rect(150, 35, 40, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("ÉLIGIBLE", 170, 42, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Section Bénéficiaire
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BÉNÉFICIAIRE", 20, 60);
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 63, 190, 63);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Nom complet:", 20, 73);
    doc.text(formattedPDA.details.beneficiary.name, 80, 73);
    doc.text("Téléphone:", 20, 83);
    doc.text(formattedPDA.details.beneficiary.phone, 80, 83);
    doc.text("Adresse:", 20, 93);
    doc.text(formattedPDA.details.beneficiary.address, 80, 93);

    // Section Nature des Travaux
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NATURE DES TRAVAUX", 20, 113);
    doc.line(20, 116, 190, 116);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(formattedPDA.details.typeOfImprovement, 20, 126);

    // Section Données Financières
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DONNÉES FINANCIÈRES", 20, 146);
    doc.line(20, 149, 190, 149);

    // Fonction pour dessiner les cadres financiers
    const drawFinanceBox = (
      x: number,
      label: string,
      value: number,
      r: number,
      g: number,
      b: number
    ) => {
      doc.setFillColor(r, g, b);
      doc.rect(x, 156, 55, 25, "F");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(label, x + 27.5, 164, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      const formattedValue = formatNumber(value).replace(/\u202f/g, " ");
      doc.text(formattedValue, x + 27.5, 174, { align: "center" });
    };

    // Afficher les montants dans des cadres colorés
    drawFinanceBox(
      20,
      "Revenu fiscal",
      formattedPDA.details.fiscalIncome,
      235,
      245,
      255
    );
    drawFinanceBox(
      85,
      "Coût estimé",
      formattedPDA.details.estimatedCost,
      240,
      240,
      240
    );
    drawFinanceBox(
      150,
      "Montant de l'aide",
      formattedPDA.details.grantAmount,
      240,
      250,
      240
    );

    // Pied de page
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Date de création: ${new Date(formattedPDA.createdAt).toLocaleDateString(
        "fr-FR"
      )}`,
      20,
      270
    );
    doc.text(
      `Document généré le ${new Date().toLocaleDateString("fr-FR")}`,
      190,
      270,
      { align: "right" }
    );
    doc.line(20, 265, 190, 265);

    return doc.output("blob");
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw error;
  }
};

export default function PdaPlansList() {
  const [plans, setPlans] = useState<PdaSummary[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PdaSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const isUserLoadInitial = useRef(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user, getAllUsers } = useAuth();
  const toast = useToast();

  const loadPlans = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/pda", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok)
        throw new Error("Erreur lors de la récupération des plans d'aide");

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPlans(result.data);
        setFilteredPlans(result.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les plans d'aide.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isInitialMount.current && user) {
      loadPlans();
      isInitialMount.current = false;
    }
  }, [loadPlans, user]);

  const loadUsers = useCallback(async () => {
    if (user?.role === "admin" && isUserLoadInitial.current) {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        isUserLoadInitial.current = false;
      } catch (error) {
        console.error("Erreur chargement users:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [user?.role, getAllUsers, toast]);

  useEffect(() => {
    if (user?.role === "admin" && isUserLoadInitial.current) {
      loadUsers();
    }
  }, [loadUsers, user?.role]);

  const handleUserFilter = useCallback(
    (userId: string) => {
      setSelectedUser(userId);
      if (!userId || userId === "") {
        setFilteredPlans(plans);
      } else {
        const filtered = plans.filter((plan) => plan.createdBy === userId);
        setFilteredPlans(filtered);
      }
    },
    [plans]
  );

  const handleDownloadPDF = async (plan: PdaSummary) => {
    try {
      const pdfBlob = await downloadPDF(plan);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `plan_aide_${plan._id}.pdf`);
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
      console.error("Erreur lors du téléchargement du PDF:", error);
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
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du plan");
      }

      setPlans((prevPlans) =>
        prevPlans.filter((plan) => plan._id !== planToDelete)
      );
      setFilteredPlans((prevFiltered) =>
        prevFiltered.filter((plan) => plan._id !== planToDelete)
      );

      toast({
        title: "Plan supprimé",
        description: "Le plan d'aide a été supprimé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du plan:", error);
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
      <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <Box
        flex="1"
        p={{ base: 4, sm: 6, md: 8 }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH={{ base: 'calc(100vh - 60px)', md: '100vh' }}
      >
        <Spinner size="xl" />
      </Box>
    </Box>
    );
  }

  return (
    <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
    <Sidebar />
    <Box 
      flex="1" 
      p={{ base: 4, sm: 6, md: 8 }}
      width={{ base: '100%', md: 'auto' }}
    >
      <VStack align="stretch" spacing={{ base: 4, md: 6 }}>
        <Box
          display="flex"
          flexDir={{ base: 'column', sm: 'row' }}
          gap={{ base: 4, sm: 0 }}
          justifyContent="space-between"
          alignItems={{ base: 'stretch', sm: 'center' }}
        >
          <Heading size={{ base: 'md', md: 'lg' }}>Plans d'aide réalisés</Heading>
          <Button 
            colorScheme="blue" 
            onClick={() => router.push("/pda/new")}
            width={{ base: '100%', sm: 'auto' }}
          >
            Nouveau Plan d'aide
          </Button>
        </Box>

          {user?.role === "admin" && (
            <Select
              placeholder="Filtrer par utilisateur"
              onChange={(e) => handleUserFilter(e.target.value)}
              value={selectedUser}
              maxW="300px"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          )}

{filteredPlans.length === 0 ? (
            <Box 
              p={6} 
              bg="gray.50" 
              borderRadius="md" 
              textAlign="center"
            >
              <Text>Aucun plan d'aide n'a été réalisé pour le moment.</Text>
            </Box>
          ) : (
            <Box 
              overflowX="auto"
              mx={{ base: -4, sm: -6, md: 0 }}
              sx={{
                '@media screen and (max-width: 48em)': {
                  '.responsive-table': {
                    display: 'block',
                    'tbody tr': {
                      display: 'block',
                      marginBottom: '1rem',
                      boxShadow: 'sm',
                      borderRadius: 'md',
                      border: '1px solid',
                      borderColor: 'gray.200',
                      bg: 'white',
                    },
                    'td': {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: '1px solid',
                      borderColor: 'gray.100',
                      minH: '3rem',
                      wordBreak: 'break-word',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                      '&:before': {
                        content: 'attr(data-label)',
                        fontWeight: 'bold',
                        marginRight: '1rem',
                        flexShrink: 0,
                      },
                    },
                    'th': {
                      display: 'none',
                    },
                  },
                },
              }}
            >
              <Table variant="simple" className="responsive-table">
                <Thead display={{ base: 'none', md: 'table-header-group' }}>
                  <Tr>
                    <Th>Titre</Th>
                    <Th>Bénéficiaire</Th>
                    <Th>Date de création</Th>
                    <Th>Statut</Th>
                    <Th>Montant de l'aide</Th>
                    {user?.role === "admin" && <Th>Créé par</Th>}
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPlans.map((plan) => (
                    <Tr key={plan._id}>
                      <Td data-label="Titre">
                        <Text noOfLines={1}>{plan.title}</Text>
                      </Td>
                      <Td data-label="Bénéficiaire">
                        <Text noOfLines={1}>{plan.details.beneficiary.name}</Text>
                      </Td>
                      <Td data-label="Date de création">
                        {new Date(plan.createdAt).toLocaleDateString('fr-FR')}
                      </Td>
                      <Td data-label="Statut">
                        <Badge 
                          colorScheme={plan.status === 'Validé' ? 'green' : 'blue'}
                        >
                          {plan.status}
                        </Badge>
                      </Td>
                      <Td data-label="Montant de l'aide">
                        {plan.details.grantAmount
                          ? new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(plan.details.grantAmount)
                          : "N/A"}
                      </Td>
                      {user?.role === "admin" && (
                        <Td data-label="Créé par">
                          {users.find(u => u.id === plan.createdBy)?.name || plan.createdBy}
                        </Td>
                      )}
                      <Td data-label="Actions">
                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            width={{ base: '100%', md: 'auto' }}
                            variant="outline"
                          >
                            Actions
                          </MenuButton>
                          <MenuList zIndex={10}>
                            <MenuItem
                              icon={<DownloadIcon />}
                              onClick={() => handleDownloadPDF(plan)}
                            >
                              Télécharger en PDF
                            </MenuItem>
                            <MenuItem
                              icon={<EditIcon />}
                              onClick={() => router.push(`/pda/edit/${plan._id}`)}
                            >
                              Modifier
                            </MenuItem>
                            <MenuItem
                              icon={<DeleteIcon />}
                              onClick={() => {
                                setPlanToDelete(plan._id);
                                onOpen();
                              }}
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
            </Box>
          )}
        </VStack>
      </Box>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent mx={{ base: 4, md: 0 }}>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Êtes-vous sûr de vouloir supprimer ce plan d'aide ? Cette action est
            irréversible.
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
  );
}