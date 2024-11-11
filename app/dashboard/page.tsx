            // page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  VStack,
  SimpleGrid,
  Spinner,
  Center,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Progress,
  HStack,
  Badge,
  useBreakpointValue,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
  Portal,
  useToast
} from '@chakra-ui/react';
import {
  MdAssignment,
  MdShowChart,
  MdPeople,
  MdAdd,
  MdFilterList,
  MdMoreVert
} from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../lib/auth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
interface DashboardStats {
  totalPdas: number;
  totalExpertises: number;
  monthlyData: {
    name: string;
    value: number;
  }[];
  workTypeData: {
    name: string;
    value: number;
  }[];
  recentFiles: FileData[];
}

interface FileData {
  id: string;
  type: 'pda' | 'expertise';
  title: string;
  status: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  increase?: number;
  color: string;
}

// Couleurs pour le graphique en camembert
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Composant StatCard
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: IconComponent,
  increase,
  color
}) => {
  return (
    <Card>
      <CardBody p={{ base: 2, sm: 3, md: 4 }}>
        <Stat>
          <HStack mb={1} spacing={{ base: 1, sm: 2 }}>
            <Icon 
              as={IconComponent} 
              boxSize={{ base: '16px', sm: '20px' }} 
              color={color} 
            />
            <StatLabel 
              fontSize={{ base: '11px', sm: '13px', md: '14px' }}
              fontWeight="medium"
              isTruncated
            >
              {label}
            </StatLabel>
          </HStack>
          <StatNumber 
            fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
            mt={1}
          >
            {value.toLocaleString()}
          </StatNumber>
          {increase && (
            <StatHelpText fontSize={{ base: '10px', sm: '12px' }} mt={1}>
              <HStack spacing={1}>
                <StatArrow type="increase" />
                <Text>{increase}% ce mois</Text>
              </HStack>
            </StatHelpText>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
};

// Composant principal Dashboard
export default function Dashboard() {
  const router = useRouter();
  const { user, getAuthHeaders } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPdas: 0,
    totalExpertises: 0,
    monthlyData: [],
    workTypeData: [],
    recentFiles: []
  });
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });
  const chartHeight = useBreakpointValue({ base: '180px', sm: '220px', md: '300px' });

  // Calcul des données mensuelles
  const calculateMonthlyData = (pdas: any[], expertises: any[]) => {
    const last6Months = Array.from({length: 6}, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        name: date.toLocaleDateString('fr-FR', { month: 'short' }),
        date: date
      };
    }).reverse();

    return last6Months.map(month => ({
      name: month.name,
      value: pdas.filter(pda => 
        new Date(pda.createdAt).getMonth() === month.date.getMonth()
      ).length + expertises.filter(exp => 
        new Date(exp.createdAt).getMonth() === month.date.getMonth()
      ).length
    }));
  };

  // Calcul de la répartition des travaux
  const calculateWorkTypeDistribution = (expertises: any[]) => {
    const typeCount: Record<string, number> = {
      'Isolation': 0,
      'Chauffage': 0,
      'Ventilation': 0,
      'Énergie': 0,
      'Autres': 0
    };

    expertises.forEach(expertise => {
      switch(expertise.details?.typeOfImprovement) {
        case 'isolation':
          typeCount['Isolation']++;
          break;
        case 'chauffage':
          typeCount['Chauffage']++;
          break;
        case 'ventilation':
          typeCount['Ventilation']++;
          break;
        case 'energie_renouvelable':
          typeCount['Énergie']++;
          break;
        default:
          typeCount['Autres']++;
      }
    });

    return Object.entries(typeCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Récupération des derniers fichiers
  const getRecentFiles = (pdas: any[], expertises: any[], isAdmin: boolean): FileData[] => {
    const allFiles = [
      ...pdas.map(pda => ({
        id: pda._id,
        type: 'pda' as const,
        title: pda.title,
        status: pda.status,
        createdAt: pda.createdAt,
        createdBy: pda.createdBy,
        createdByName: pda.createdByName
      })),
      ...expertises.map(exp => ({
        id: exp._id,
        type: 'expertise' as const,
        title: `Expertise ${exp.typeLogement} - ${exp.beneficiaire.nom}`,
        status: exp.status,
        createdAt: exp.createdAt,
        createdBy: exp.createdBy,
        createdByName: exp.createdByName
      }))
    ];

    return allFiles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  // Chargement des données
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const headers = getAuthHeaders();

      // Chargement des PDAs
      const pdasResponse = await fetch('/api/pda', { headers });
      const pdasData = await pdasResponse.json();

      // Chargement des Expertises
      const expertisesResponse = await fetch('/api/expertises', { headers });
      const expertisesData = await expertisesResponse.json();

      const pdas = pdasData.data || [];
      const expertises = expertisesData.data || [];

      // Filtrage selon le rôle
      let filteredPdas = pdas;
      let filteredExpertises = expertises;

      if (user?.role !== 'admin') {
        filteredPdas = pdas.filter((pda: any) => pda.createdBy === user?.id);
        filteredExpertises = expertises.filter((exp: any) => exp.createdBy === user?.id);
      }

      setStats({
        totalPdas: filteredPdas.length,
        totalExpertises: filteredExpertises.length,
        monthlyData: calculateMonthlyData(filteredPdas, filteredExpertises),
        workTypeData: calculateWorkTypeDistribution(filteredExpertises),
        recentFiles: getRecentFiles(filteredPdas, filteredExpertises, user?.role === 'admin')
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <Center h="100vh" w="100vw">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!user) return null;

  return (
    <Box 
      display="flex" 
      flexDir={{ base: 'column', md: 'row' }}
      minH="100vh"
      bg="gray.50"
    >
      <Sidebar />
      
      <Box
        flex="1"
        p={{ base: '10px', sm: 4, md: 6 }}
        width="100%"
        maxW="100%"
        overflowX="hidden"
      >
        <VStack spacing={{ base: 3, sm: 4, md: 6 }} align="stretch">
          {/* En-tête */}
          <Flex 
            justify="space-between" 
            align="flex-start"
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 2, sm: 0 }}
          >
            <Box>
              <Heading
                fontSize={{ base: '18px', sm: '22px', md: '26px' }}
                lineHeight="1.2"
                mb={1}
              >
                Bonjour, {user.name}
              </Heading>
              <Text
                fontSize={{ base: '11px', sm: '13px' }}
                color="gray.600"
              >
                {formattedDate}
              </Text>
            </Box>

            {/* Actions rapides mobile */}
            {isMobile && (
              <HStack spacing={2} w="100%">
                <Button
                  size="sm"
                  leftIcon={<Icon as={MdAdd} boxSize="14px" />}
                  colorScheme="blue"
                  fontSize="12px"
                  h="32px"
                  flex={1}
                >
                  Nouveau PDA
                </Button>
                <IconButton
                  aria-label="Filtres"
                  icon={<Icon as={MdFilterList} boxSize="18px" />}
                  size="sm"
                  variant="ghost"
                  h="32px"
                />
              </HStack>
            )}
          </Flex>

          {/* Cartes statistiques */}
          <SimpleGrid
            columns={{ base: 2, lg: 2 }}
            spacing={{ base: 2, sm: 3, md: 4 }}
            minChildWidth={{ base: '140px', sm: '160px' }}
          >
            <StatCard
              label="Plans d'aide"
              value={stats.totalPdas}
              icon={MdShowChart}
              color="blue.500"
            />
            <StatCard
              label="Expertises"
              value={stats.totalExpertises}
              icon={MdPeople}
              color="green.500"
            />
          </SimpleGrid>

          {/* Graphiques */}
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            spacing={{ base: 3, sm: 4 }}
          >
            {/* Graphique linéaire */}
            <Card>
              <CardHeader p={{ base: 2, sm: 3 }}>
                <Text fontSize={{ base: '13px', sm: '15px' }} fontWeight="semibold">
                  Évolution des dossiers
                </Text>
              </CardHeader>
              <CardBody p={{ base: 1, sm: 2 }}>
                <Box h={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.monthlyData}
                      margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} width={25} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0088FE"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>

            {/* Graphique circulaire */}
            <Card>
              <CardHeader p={{ base: 2, sm: 3 }}>
                <Text fontSize={{ base: '13px', sm: '15px' }} fontWeight="semibold">
                  Répartition des travaux
                </Text>
              </CardHeader>
              <CardBody p={{ base: 1, sm: 2 }}>
                <Box h={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.workTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                        label={!isMobile}
                      >
                        {stats.workTypeData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>
         {/* Liste des derniers dossiers */}
<Card>
  <CardHeader p={{ base: 2, sm: 3 }}>
    <Text fontSize={{ base: '13px', sm: '15px' }} fontWeight="semibold">
      Derniers dossiers
    </Text>
  </CardHeader>
  <CardBody p={{ base: 2, sm: 3 }}>
    <VStack spacing={{ base: 2, sm: 3 }} align="stretch">
      {stats.recentFiles.length === 0 ? (
        <Box
          p={4}
          textAlign="center"
          color="gray.500"
          fontSize="sm"
        >
          Aucun dossier récent
        </Box>
      ) : (
        stats.recentFiles.map((file) => (
          <Box
            key={file.id}
            p={{ base: 2, sm: 3 }}
            bg="gray.50"
            borderRadius="md"
            _hover={{ bg: 'gray.100' }}
            cursor="pointer"
          >
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', sm: 'center' }}
              gap={{ base: 1, sm: 0 }}
            >
              <HStack spacing={2}>
                <Icon
                  as={file.type === 'pda' ? MdAssignment : MdPeople}
                  boxSize={{ base: '16px', sm: '20px' }}
                  color={file.type === 'pda' ? 'blue.500' : 'green.500'}
                />
                <Box>
                  <Text
                    fontSize={{ base: '12px', sm: '14px' }}
                    fontWeight="medium"
                  >
                    {file.title}
                    {user?.role === 'admin' && file.createdByName && (
                      <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                        par {file.createdByName}
                      </Text>
                    )}
                  </Text>
                  <Text
                    fontSize={{ base: '10px', sm: '12px' }}
                    color="gray.500"
                  >
                    {new Date(file.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </Box>
              </HStack>
              <Badge
                colorScheme={file.status === 'Terminé' ? "green" : "orange"}
                fontSize={{ base: '9px', sm: '11px' }}
                px={1.5}
                py={0.5}
                textTransform="none"
                borderRadius="full"
              >
                {file.status}
              </Badge>
            </Flex>
          </Box>
        ))
      )}

      <Button
        variant="ghost"
        size="sm"
        width="full"
        mt={{ base: 2, sm: 3 }}
        fontSize={{ base: '11px', sm: '13px' }}
        height={{ base: '32px', sm: '36px' }}
        onClick={() => {
          router.push('/dossiers');
        }}
      >
        Voir tous les dossiers
      </Button>
    </VStack>
  </CardBody>
</Card>

{/* Menu flottant mobile pour les actions rapides */}
{isMobile && (
  <Portal>
    <Box
      position="fixed"
      bottom={4}
      right={4}
      zIndex={1000}
    >
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Actions rapides"
          icon={<MdAdd />}
          colorScheme="blue"
          borderRadius="full"
          size="lg"
          shadow="lg"
          _hover={{
            transform: 'scale(1.05)',
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
        />
        <MenuList
          fontSize="13px"
          p={1}
        >
          <MenuItem 
            icon={<Icon as={MdAssignment} boxSize="16px" />}
            py={2}
            onClick={() => router.push('/expertises/new')}
          >
            Nouvelle expertise
          </MenuItem>
          <MenuItem 
            icon={<Icon as={MdAdd} boxSize="16px" />}
            py={2}
            onClick={() => router.push('/pda/new')}
          >
            Nouveau PDA
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  </Portal>
)}
        </VStack>
      </Box>
    </Box>
  );
}