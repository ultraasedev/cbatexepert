"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  Badge,
} from "@chakra-ui/react";
import { ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useAuth, User } from "../lib/auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { debounce } from "lodash";

interface Expertise {
  _id: string;
  typeLogement: string;
  beneficiaire: {
    nom: string;
    adresse: string;
  };
  createdAt: string;
  createdBy: string;
  status: string;
  evaluations?: {
    global?: {
      condition: string;
      score: number;
    };
  };
}

export default function ExpertiseList() {
  const [expertises, setExpertises] = useState<Expertise[]>([]);
  const [filteredExpertises, setFilteredExpertises] = useState<Expertise[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [expertiseToDelete, setExpertiseToDelete] = useState<string | null>(
    null
  );
  const isInitialMount = useRef(true);
  const isInitialUserLoad = useRef(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user, getAllUsers, getAuthHeaders } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const debouncedLoadExpertises = debounce(async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch("/api/expertises", {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des expertises");
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setExpertises(result.data);
          setFilteredExpertises(result.data);
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les expertises.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms de délai

    if (isInitialMount.current && user) {
      debouncedLoadExpertises();
      isInitialMount.current = false;
    }

    return () => {
      debouncedLoadExpertises.cancel();
    };
  }, [user, getAuthHeaders, toast]);

  const loadUsers = useCallback(async () => {
    if (user?.role === "admin" && isInitialUserLoad.current) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre que la connexion MongoDB soit établie
        const allUsers = await getAllUsers();
        setAgents(allUsers);
        isInitialUserLoad.current = false;
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
    if (user?.role === "admin" && isInitialUserLoad.current) {
      loadUsers();
    }
  }, [loadUsers, user?.role]);

  useEffect(() => {
    const handleUnauthorized = (error: any) => {
      if (error.status === 401) {
        router.push("/login");
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    // Ajouter aux gestionnaires d'erreur existants
    const loadExpertises = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch("/api/expertises", {
          headers: getAuthHeaders(),
        });

        if (!response.ok)
          throw new Error("Erreur lors de la récupération des expertises");

        const result = await response.json();
        console.log("Expertises chargées:", result.data); // Ajout du log
        if (result.success && Array.isArray(result.data)) {
          setExpertises(result.data);
          setFilteredExpertises(result.data);
        }
      } catch (error) {
        // ...
      }
    };
  }, [router, toast]);

  const handleAgentFilter = (agentId: string) => {
    console.log("Filtrage par agent:", agentId);
    setSelectedAgent(agentId);

    if (!agentId || agentId === "") {
      setFilteredExpertises(expertises);
    } else {
      const filtered = expertises.filter((exp) => exp.createdBy === agentId);
      setFilteredExpertises(filtered);
    }
  };
  const handleDownloadPDF = async (expertiseId: string) => {
    try {
      const response = await fetch(`/api/expertises/${expertiseId}/pdf`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
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
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la génération du PDF"
        );
      }
    } catch (error: any) {
      console.error("Erreur de téléchargement:", error);
      toast({
        title: "Erreur de téléchargement",
        description:
          error.message ||
          "Une erreur est survenue lors du téléchargement du PDF.",
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
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setExpertises((prev) =>
        prev.filter((exp) => exp._id !== expertiseToDelete)
      );
      setFilteredExpertises((prev) =>
        prev.filter((exp) => exp._id !== expertiseToDelete)
      );

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
        description:
          "Une erreur est survenue lors de la suppression de l'expertise",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onClose();
      setExpertiseToDelete(null);
    }
  };

  const getConditionColor = (condition?: string, score?: number) => {
    console.log("Score reçu:", score); // Pour debug

    const numScore = Number(score);
    if (isNaN(numScore)) return "gray";

    switch (numScore) {
      case 5:
        return "green";
      case 3:
        return "yellow";
      case 1:
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box
          flex="1"
          p={8}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDir={{ base: "column", md: "row" }}>
      <Sidebar />
      <Box
        flex="1"
        p={{ base: 2, sm: 4, md: 8 }}
        width={{ base: "100%", md: "auto" }}
      >
        <VStack align="stretch" spacing={{ base: 4, md: 6 }}>
          <Box
            display="flex"
            flexDir={{ base: "column", sm: "row" }}
            gap={4}
            justifyContent="space-between"
            alignItems={{ base: "stretch", sm: "center" }}
          >
            <Heading size={{ base: "md", md: "lg" }}>
              Expertises réalisées
            </Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => router.push("/expertises/new")}
              width={{ base: "100%", sm: "auto" }}
            >
              Nouvelle Expertise
            </Button>
          </Box>

          {user?.role === "admin" && (
            <Select
              id="agent-filter"
              name="agent-filter"
              placeholder="Filtrer par utilisateur"
              onChange={(e) => handleAgentFilter(e.target.value)}
              value={selectedAgent}
              maxW={{ base: "100%", md: "300px" }}
            >
              <option value="">Tous les utilisateurs</option>
              {agents.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          )}

          {filteredExpertises.length === 0 ? (
            <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
              <Text>Aucune expertise n'a été réalisée pour le moment.</Text>
            </Box>
          ) : (
            <Box
              overflowX="auto"
              mx={{ base: -2, sm: -4, md: 0 }}
              sx={{
                "@media screen and (max-width: 48em)": {
                  ".responsive-table": {
                    display: "block",
                    tr: {
                      display: "block",
                      marginBottom: "1rem",
                      boxShadow: "sm",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "gray.200",
                    },
                    td: {
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderBottom: "1px solid",
                      borderColor: "gray.200",
                      "&:before": {
                        content: "attr(data-label)",
                        fontWeight: "bold",
                        marginRight: "1rem",
                      },
                    },
                    th: {
                      display: "none",
                    },
                  },
                },
              }}
            >
              <Table variant="simple" className="responsive-table">
                <Thead display={{ base: "none", md: "table-header-group" }}>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Bénéficiaire</Th>
                    <Th>Adresse</Th>
                    <Th>État</Th>
                    {user?.role === "admin" && <Th>Utilisateur</Th>}
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredExpertises.map((expertise) => (
                    <Tr key={expertise._id}>
                      <Td>
                        {format(new Date(expertise.createdAt), "dd/MM/yyyy", {
                          locale: fr,
                        })}
                      </Td>
                      <Td>{expertise.typeLogement}</Td>
                      <Td>{expertise.beneficiaire.nom}</Td>
                      <Td>{expertise.beneficiaire.adresse}</Td>
                      <Td>
                        <Badge
                          colorScheme={getConditionColor(
                            expertise.evaluations?.global?.condition,
                            expertise.evaluations?.global?.score
                          )}
                        >
                          {expertise.evaluations?.global?.condition ===
                          "Favorable"
                            ? "Bon"
                            : expertise.evaluations?.global?.condition ===
                              "Correct"
                            ? "Moyen"
                            : expertise.evaluations?.global?.condition ===
                              "Critique"
                            ? "Mauvais"
                            : "Non évalué"}
                        </Badge>
                      </Td>
                      {user?.role === "admin" && (
                        <Td>
                          {agents.find((u) => u.id === expertise.createdBy)
                            ?.name || "N/A"}
                        </Td>
                      )}
                      <Td data-label="Actions">
                        <Menu>
                          <MenuButton
                            id={`actions-${expertise._id}`}
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            width={{ base: "100%", md: "auto" }}
                          >
                            Actions
                          </MenuButton>
                          <MenuList>
                            <MenuItem
                              onClick={() => handleDownloadPDF(expertise._id)}
                            >
                              Télécharger en PDF
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                router.push(`/expertises/edit/${expertise._id}`)
                              }
                            >
                              Modifier
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                setExpertiseToDelete(expertise._id);
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Êtes-vous sûr de vouloir supprimer cette expertise ? Cette action
            est irréversible.
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
