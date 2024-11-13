// components/NewPdaForm.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Heading,
  Text,
  useToast,
  Spinner,
  List,
  ListItem,
  Flex,
} from "@chakra-ui/react";
import { useAuth } from "../lib/auth";


interface FormData {
  details: {
    beneficiary: {
      name: string;
      address: string;
      phone: string;
    };
    fiscalIncome: string;
    typeOfImprovement: string;
    estimatedCost: string;
    grantAmount: string;
  };
}

interface AddressSuggestion {
  label: string;
  context: string;
}

export default function NewPdaForm() {
  const [formData, setFormData] = useState<FormData>({
    details: {
      beneficiary: {
        name: "",
        address: "",
        phone: "",
      },
      fiscalIncome: "",
      typeOfImprovement: "",
      estimatedCost: "",
      grantAmount: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [grantAmount, setGrantAmount] = useState<string>("");
  const toast = useToast();
  const { getAuthHeaders, user } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setFormData((prevData) => {
      let newData = { ...prevData };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    if (name === "details.beneficiary.address") {
      fetchAddressSuggestions(value);
    }
  };

  const fetchAddressSuggestions = async (input: string) => {
    if (input.length > 2) {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            input
          )}&limit=5`
        );
        const data = await response.json();
        setAddressSuggestions(
          data.features.map((feature: any) => ({
            label: feature.properties.label,
            context: feature.properties.context,
          }))
        );
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des suggestions d'adresse:",
          error
        );
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleAddressSelect = (address: string) => {
    setFormData((prevData) => ({
      ...prevData,
      details: {
        ...prevData.details,
        beneficiary: {
          ...prevData.details.beneficiary,
          address: address,
        },
      },
    }));
    setAddressSuggestions([]);
  };

  const validateForm = () => {
    const { details } = formData;
    if (
      !details.beneficiary.name ||
      !details.beneficiary.address ||
      !details.beneficiary.phone ||
      !details.fiscalIncome ||
      !details.typeOfImprovement ||
      !details.estimatedCost
    ) {
      throw new Error("Tous les champs sont requis");
    }

    if (
      isNaN(Number(details.fiscalIncome)) ||
      isNaN(Number(details.estimatedCost))
    ) {
      throw new Error("Les montants doivent être des nombres valides");
    }
  };

  const generatePdaTitle = () => {
    const now = new Date();
    return `PDA ${now.toLocaleDateString("fr-FR")} - ${
      formData.details.beneficiary.name
    }`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      validateForm();

      const pdaTitle = generatePdaTitle();
      const estimatedCost = parseFloat(formData.details.estimatedCost);
      const calculatedGrantAmount =
        Math.round(estimatedCost * 0.2857 * 100) / 100;

      const dataToSend = {
        title: pdaTitle,
        status: "En cours",
        details: {
          beneficiary: {
            name: formData.details.beneficiary.name,
            address: formData.details.beneficiary.address,
            phone: formData.details.beneficiary.phone,
          },
          typeOfImprovement: formData.details.typeOfImprovement,
          fiscalIncome: parseFloat(formData.details.fiscalIncome),
          estimatedCost: estimatedCost,
          grantAmount: calculatedGrantAmount,
        },
        createdBy: user?.id, // Ajout de l'ID de l'utilisateur connecté
      };

      // Simuler un délai pour le test d'éligibilité
      await new Promise((resolve) => setTimeout(resolve, 50000));

      const response = await fetch("/api/pda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la création du plan d'aide"
        );
      }

      const data = await response.json();
      console.log("PDA créé avec succès:", data);

      setGrantAmount(calculatedGrantAmount.toString());
      setIsSuccess(true);

      toast({
        title: "Succès",
        description: "Le plan d'aide a été créé avec succès",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erreur lors de la création du PDA:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la création du plan d'aide",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Flex
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        backgroundColor="rgba(0, 0, 0, 0.7)"
        zIndex="9999"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Spinner size="xl" color="white" />
        <Text mt={4} color="white" fontSize="xl">
          Test d'éligibilité en cours...
        </Text>
      </Flex>
    );
  }

  if (isSuccess) {
    return (
      <Box textAlign="center" py={10}>
        <Heading as="h2" size="xl" mb={4}>
          Félicitations !
        </Heading>
        <Text fontSize="lg" mb={4}>
          Vous êtes éligible à une aide à l'habitat de {grantAmount}€.
        </Text>
        <Text fontSize="md" mb={4}>
          Cette offre est valable 72h.
        </Text>
        <Text fontSize="md" mb={4}>
          Le plan d'aide a été enregistré avec succès.
        </Text>
        <Button colorScheme="blue" onClick={() => setIsSuccess(false)}>
          Retour au formulaire
        </Button>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} p={5}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Nom du bénéficiaire</FormLabel>
          <Input
            name="details.beneficiary.name"
            value={formData.details.beneficiary.name}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Adresse du bénéficiaire</FormLabel>
          <Input
            name="details.beneficiary.address"
            value={formData.details.beneficiary.address}
            onChange={handleChange}
          />
          {addressSuggestions.length > 0 && (
            <List mt={2} borderWidth={1} borderRadius="md" boxShadow="sm">
              {addressSuggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  p={2}
                  _hover={{ bg: "gray.100" }}
                  cursor="pointer"
                  onClick={() => handleAddressSelect(suggestion.label)}
                >
                  {suggestion.label}
                </ListItem>
              ))}
            </List>
          )}
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Téléphone du bénéficiaire</FormLabel>
          <Input
            type="tel"
            value={formData.details.beneficiary.phone}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                details: {
                  ...prev.details,
                  beneficiary: {
                    ...prev.details.beneficiary,
                    phone: e.target.value,
                  },
                },
              }));
            }}
            placeholder="0XXXXXXXXX"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Revenu fiscal de référence</FormLabel>
          <Input
            name="details.fiscalIncome"
            value={formData.details.fiscalIncome}
            onChange={handleChange}
            type="number"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Type d'amélioration</FormLabel>
          <Select
            name="details.typeOfImprovement"
            value={formData.details.typeOfImprovement}
            onChange={handleChange}
          >
            <option value="">Sélectionnez un type</option>
            <option value="isolation">Isolation</option>
            <option value="chauffage">Chauffage</option>
            <option value="ventilation">Ventilation</option>
            <option value="energie_renouvelable">Énergie renouvelable</option>
            <option value="amelioration_divers">Amelioration Divers</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Coût estimé de la prestation</FormLabel>
          <Input
            name="details.estimatedCost"
            value={formData.details.estimatedCost}
            onChange={handleChange}
            type="number"
          />
        </FormControl>

        <Button type="submit" colorScheme="blue" size="lg" w="full">
          Tester mon éligibilité
        </Button>
      </VStack>
    </Box>
  );
}
