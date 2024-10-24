// app/components/ExpertiseForm.tsx
import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Select, Textarea, VStack, Text, Heading, Radio, RadioGroup, Stack, Checkbox } from '@chakra-ui/react';

interface FormData {
  // Étape 1
  typeLogement: string;
  // Étape 2
  nomBeneficiaire: string;
  adresseBeneficiaire: string;
  telBeneficiaire: string;
  // Étape 3
  anneeConstruction: string;
  superficie: string;
  nombreEtages: string;
  // Étape 4
  nombreOuvertures: string;
  typeVitrage: string;
  etatOuvrants: string;
  anneeInstallationOuvrants: string;
  // Étape 5
  typeChauffage: string;
  nombreChauffages: string;
  etatChauffage: string;
  anneeInstallationChauffage: string;
  // Étape 6
  tauxHumidite: string;
  etatHumidite: string;
  // Étape 7
  typeFacade: string;
  epaisseurMurs: string;
  dernierEntretienFacade: string;
  etatFacade: string;
  // Étape 8
  typeTableau: string;
  anneePoseTableau: string;
  presenceLinky: string;
  tableauAuxNormes: string;
  etatTableau: string;
  // Étape 9
  typeVentilation: string;
  nombreBouches: string;
  piecesVentilation: string;
  ventilationNaturelle: string;
  anneePoseVentilation: string;
  etatVentilation: string;
  // Étape 10
  typeIsolation: string;
  poseIsolation: string;
  epaisseurIsolant: string;
  etatIsolation: string;
  presenceCondensation: string;
  localisationCondensation: string;
  tauxHumiditeCombles: string;
  etatCombles: string;
  // Étape 11
  typeCharpente: string;
  presenceArtive: string;
  entretienCharpente: string;
  dateEntretienCharpente: string;
  etatCharpente: string;
  // Étape 12
  typeToiture: string;
  typeFaitage: string;
  dateEntretienToiture: string;
  typeEntretienToiture: string;
  presenceImpuretes: string;
  anneeToiture: string;
  etatToiture: string;
}

const initialFormData: FormData = {
  typeLogement: '', nomBeneficiaire: '', adresseBeneficiaire: '', telBeneficiaire: '',
  anneeConstruction: '', superficie: '', nombreEtages: '', nombreOuvertures: '',
  typeVitrage: '', etatOuvrants: '', anneeInstallationOuvrants: '', typeChauffage: '',
  nombreChauffages: '', etatChauffage: '', anneeInstallationChauffage: '', tauxHumidite: '',
  etatHumidite: '', typeFacade: '', epaisseurMurs: '', dernierEntretienFacade: '',
  etatFacade: '', typeTableau: '', anneePoseTableau: '', presenceLinky: '',
  tableauAuxNormes: '', etatTableau: '', typeVentilation: '', nombreBouches: '',
  piecesVentilation: '', ventilationNaturelle: '', anneePoseVentilation: '', etatVentilation: '',
  typeIsolation: '', poseIsolation: '', epaisseurIsolant: '', etatIsolation: '',
  presenceCondensation: '', localisationCondensation: '', tauxHumiditeCombles: '', etatCombles: '',
  typeCharpente: '', presenceArtive: '', entretienCharpente: '', dateEntretienCharpente: '',
  etatCharpente: '', typeToiture: '', typeFaitage: '', dateEntretienToiture: '',
  typeEntretienToiture: '', presenceImpuretes: '', anneeToiture: '', etatToiture: ''
};

const ExpertiseForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    // Ici, vous pouvez ajouter la logique pour envoyer les données à votre API
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormControl isRequired>
            <FormLabel>Type de logement</FormLabel>
            <Select name="typeLogement" value={formData.typeLogement} onChange={handleChange}>
              <option value="">Sélectionnez</option>
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
            </Select>
          </FormControl>
        );
      case 2:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Nom du bénéficiaire</FormLabel>
              <Input name="nomBeneficiaire" value={formData.nomBeneficiaire} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Adresse du logement</FormLabel>
              <Textarea name="adresseBeneficiaire" value={formData.adresseBeneficiaire} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Téléphone du bénéficiaire</FormLabel>
              <Input name="telBeneficiaire" value={formData.telBeneficiaire} onChange={handleChange} />
            </FormControl>
          </>
        );
      case 3:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Année de construction</FormLabel>
              <Input name="anneeConstruction" type="number" value={formData.anneeConstruction} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Superficie (m²)</FormLabel>
              <Input name="superficie" type="number" value={formData.superficie} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Nombre d'étages</FormLabel>
              <Input name="nombreEtages" type="number" value={formData.nombreEtages} onChange={handleChange} />
            </FormControl>
          </>
        );
      case 4:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Nombre d'ouvertures</FormLabel>
              <Input name="nombreOuvertures" type="number" value={formData.nombreOuvertures} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Type de vitrage</FormLabel>
              <RadioGroup name="typeVitrage" value={formData.typeVitrage} onChange={(value) => handleRadioChange('typeVitrage', value)}>
                <Stack direction="row">
                  <Radio value="simple">Simple</Radio>
                  <Radio value="double">Double</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État des ouvrants</FormLabel>
              <RadioGroup name="etatOuvrants" value={formData.etatOuvrants} onChange={(value) => handleRadioChange('etatOuvrants', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Année d'installation des ouvrants</FormLabel>
              <Input name="anneeInstallationOuvrants" type="number" value={formData.anneeInstallationOuvrants} onChange={handleChange} />
            </FormControl>
          </>
        );
      case 5:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de chauffage</FormLabel>
              <Select name="typeChauffage" value={formData.typeChauffage} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="Électrique">Électrique</option>
                <option value="Gaz">Gaz</option>
                <option value="Fioul">Fioul</option>
                <option value="Bois">Bois</option>
                <option value="Pele">Pele</option>
                <option value="Pompe à chaleur">Pompe à chaleur</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Nombre de chauffages</FormLabel>
              <Input name="nombreChauffages" type="number" value={formData.nombreChauffages} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État du chauffage</FormLabel>
              <RadioGroup name="etatChauffage" value={formData.etatChauffage} onChange={(value) => handleRadioChange('etatChauffage', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Année d'installation du chauffage</FormLabel>
              <Input name="anneeInstallationChauffage" type="number" value={formData.anneeInstallationChauffage} onChange={handleChange} />
            </FormControl>
          </>
        );
      case 6:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Taux d'humidité (%)</FormLabel>
              <Input name="tauxHumidite" type="number" value={formData.tauxHumidite} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État (humidité)</FormLabel>
              <RadioGroup name="etatHumidite" value={formData.etatHumidite} onChange={(value) => handleRadioChange('etatHumidite', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 7:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de façade</FormLabel>
              <Select name="typeFacade" value={formData.typeFacade} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="Enduit">Enduit</option>
                <option value="Peinture">Peinture</option>
                <option value="Pierre">Pierre</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Épaisseur des murs (cm)</FormLabel>
              <Input name="epaisseurMurs" type="number" value={formData.epaisseurMurs} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Dernier entretien (année)</FormLabel>
              <Input name="dernierEntretienFacade" type="number" value={formData.dernierEntretienFacade} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État de la façade</FormLabel>
              <RadioGroup name="etatFacade" value={formData.etatFacade} onChange={(value) => handleRadioChange('etatFacade', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 8:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de tableau électrique</FormLabel>
              <RadioGroup name="typeTableau" value={formData.typeTableau} onChange={(value) => handleRadioChange('typeTableau', value)}>
                <Stack direction="row">
                  <Radio value="Mono">Mono</Radio>
                  <Radio value="Triphasé">Triphasé</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Année de pose</FormLabel>
              <Input name="anneePoseTableau" type="number" value={formData.anneePoseTableau} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Présence Linky</FormLabel>
              <RadioGroup name="presenceLinky" value={formData.presenceLinky} onChange={(value) => handleRadioChange('presenceLinky', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tableau aux normes NF-2012</FormLabel>
              <RadioGroup name="tableauAuxNormes" value={formData.tableauAuxNormes} onChange={(value) => handleRadioChange('tableauAuxNormes', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État du tableau</FormLabel>
              <RadioGroup name="etatTableau" value={formData.etatTableau} onChange={(value) => handleRadioChange('etatTableau', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 9:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de ventilation</FormLabel>
              <Select name="typeVentilation" value={formData.typeVentilation} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="VMC Simple flux">VMC Simple flux</option>
                <option value="Double Flux">Double Flux</option>
                <option value="VMI">VMI</option>
                <option value="VPH">VPH</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Nombre de bouches</FormLabel>
              <Input name="nombreBouches" type="number" value={formData.nombreBouches} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Dans quelles pièces ?</FormLabel>
              <Input name="piecesVentilation" value={formData.piecesVentilation} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Existe-t-il un système de ventilation naturel ?</FormLabel>
              <RadioGroup name="ventilationNaturelle" value={formData.ventilationNaturelle} onChange={(value) => handleRadioChange('ventilationNaturelle', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Année de pose</FormLabel>
              <Input name="anneePoseVentilation" type="number" value={formData.anneePoseVentilation} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État</FormLabel>
              <RadioGroup name="etatVentilation" value={formData.etatVentilation} onChange={(value) => handleRadioChange('etatVentilation', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 10:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type d'isolation</FormLabel>
              <Select name="typeIsolation" value={formData.typeIsolation} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="Ouate de cellulose">Ouate de cellulose</option>
                <option value="Laine de Roche">Laine de Roche</option>
                <option value="Laine de Verre">Laine de Verre</option>
                <option value="Isolation Minerales">Isolation Minerales</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Pose</FormLabel>
              <RadioGroup name="poseIsolation" value={formData.poseIsolation} onChange={(value) => handleRadioChange('poseIsolation', value)}>
                <Stack direction="column">
                  <Radio value="Sous rampants">Sous rampants</Radio>
                  <Radio value="En soufflage">En soufflage</Radio>
                  <Radio value="En rouleau">En rouleau</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Épaisseur de l'isolant (cm)</FormLabel>
              <Input name="epaisseurIsolant" type="number" value={formData.epaisseurIsolant} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État de l'isolation</FormLabel>
              <RadioGroup name="etatIsolation" value={formData.etatIsolation} onChange={(value) => handleRadioChange('etatIsolation', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Présence de condensation</FormLabel>
              <RadioGroup name="presenceCondensation" value={formData.presenceCondensation} onChange={(value) => handleRadioChange('presenceCondensation', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Localisation de la condensation</FormLabel>
              <Input name="localisationCondensation" value={formData.localisationCondensation} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Taux d'humidité (%)</FormLabel>
              <Input name="tauxHumiditeCombles" type="number" value={formData.tauxHumiditeCombles} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État</FormLabel>
              <RadioGroup name="etatCombles" value={formData.etatCombles} onChange={(value) => handleRadioChange('etatCombles', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 11:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de charpente</FormLabel>
              <Select name="typeCharpente" value={formData.typeCharpente} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="Fermette">Fermette</option>
                <option value="Traditionnelle">Traditionnelle</option>
                <option value="Metalique">Metalique</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Présence d'artive</FormLabel>
              <RadioGroup name="presenceArtive" value={formData.presenceArtive} onChange={(value) => handleRadioChange('presenceArtive', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>La charpente a-t-elle déjà fait l'objet d'un entretien ?</FormLabel>
              <RadioGroup name="entretienCharpente" value={formData.entretienCharpente} onChange={(value) => handleRadioChange('entretienCharpente', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            {formData.entretienCharpente === 'Oui' && (
              <FormControl isRequired>
                <FormLabel>Date de l'entretien</FormLabel>
                <Input name="dateEntretienCharpente" type="date" value={formData.dateEntretienCharpente} onChange={handleChange} />
              </FormControl>
            )}
            <FormControl isRequired>
              <FormLabel>État de la charpente</FormLabel>
              <RadioGroup name="etatCharpente" value={formData.etatCharpente} onChange={(value) => handleRadioChange('etatCharpente', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      case 12:
        return (
          <>
            <FormControl isRequired>
              <FormLabel>Type de toiture</FormLabel>
              <Select name="typeToiture" value={formData.typeToiture} onChange={handleChange}>
                <option value="">Sélectionnez</option>
                <option value="Ardoise Naturelle">Ardoise Naturelle</option>
                <option value="Ardoise Fibrociment">Ardoise Fibrociment</option>
                <option value="Tuiles">Tuiles</option>
                <option value="Tuiles Béton">Tuiles Béton</option>
                <option value="Acier">Acier</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Type de faîtage</FormLabel>
              <RadioGroup name="typeFaitage" value={formData.typeFaitage} onChange={(value) => handleRadioChange('typeFaitage', value)}>
                <Stack direction="row">
                  <Radio value="Cimente">Cimenté</Radio>
                  <Radio value="En Boîte">En Boîte</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Date d'entretien</FormLabel>
              <Input name="dateEntretienToiture" type="date" value={formData.dateEntretienToiture} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Type d'entretien effectué</FormLabel>
              <Input name="typeEntretienToiture" value={formData.typeEntretienToiture} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>La toiture présente-t-elle des impuretés ?</FormLabel>
              <RadioGroup name="presenceImpuretes" value={formData.presenceImpuretes} onChange={(value) => handleRadioChange('presenceImpuretes', value)}>
                <Stack direction="row">
                  <Radio value="Oui">Oui</Radio>
                  <Radio value="Non">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Année de la toiture</FormLabel>
              <Input name="anneeToiture" type="number" value={formData.anneeToiture} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>État</FormLabel>
              <RadioGroup name="etatToiture" value={formData.etatToiture} onChange={(value) => handleRadioChange('etatToiture', value)}>
                <Stack direction="row">
                  <Radio value="Bon">Bon</Radio>
                  <Radio value="Moyen">Moyen</Radio>
                  <Radio value="Mauvais">Mauvais</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </>
        );
      default:
        return <Text>Étape non trouvée</Text>;
    }
  };

  return (
    <Box maxWidth="600px" margin="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <Heading size="lg">Expertise Habitat - Étape {currentStep}</Heading>
          {renderStep()}
          <Box>
            {currentStep > 1 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)} mr={3}>
                Précédent
              </Button>
            )}
            {currentStep < 12 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Suivant
              </Button>
            ) : (
              <Button type="submit" colorScheme="blue">
                Soumettre
              </Button>
            )}
          </Box>
        </VStack>
      </form>
    </Box>
  );
};

export default ExpertiseForm;