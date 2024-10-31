// app/dashboard/page.tsx
'use client';

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
} from '@chakra-ui/react';
import {
  MdAssignment,
  MdShowChart,
  MdPeople,
  MdDoneAll,
  MdPending,
  MdMoreVert,
  MdAdd,
  MdFileDownload,
  MdCalendarToday,
  MdFilterList
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
  completedPdas: number;
  pendingPdas: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  increase?: number;
  progress?: number;
  badge?: { text: string; color: string };
  color: string;
}

// Données fictives
const MOCK_DATA = {
  monthlyData: [
    { name: 'Jan', value: 12 },
    { name: 'Fév', value: 15 },
    { name: 'Mar', value: 18 },
    { name: 'Avr', value: 14 },
    { name: 'Mai', value: 20 },
    { name: 'Juin', value: 22 },
  ],
  pieData: [
    { name: 'Isolation', value: 45 },
    { name: 'Chauffage', value: 30 },
    { name: 'Ventilation', value: 15 },
    { name: 'Énergie', value: 10 },
  ],
  colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
};

// Composant de carte statistique
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: IconComponent,
  increase,
  progress,
  badge,
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
          <StatHelpText 
            fontSize={{ base: '10px', sm: '12px' }}
            mt={1}
          >
            {increase && (
              <HStack spacing={1}>
                <StatArrow type="increase" />
                <Text>{increase}% ce mois</Text>
              </HStack>
            )}
            {progress && (
              <Progress
                value={progress}
                size="xs"
                colorScheme="green"
                mt={1}
              />
            )}
            {badge && (
              <Badge
                colorScheme={badge.color}
                fontSize={{ base: '9px', sm: '11px' }}
                mt={1}
                px={1.5}
                py={0.5}
              >
                {badge.text}
              </Badge>
            )}
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};

// Composant principal
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPdas: 0,
    totalExpertises: 0,
    completedPdas: 0,
    pendingPdas: 0,
  });
  const [loading, setLoading] = useState(true);

  // Breakpoints responsifs
  const isMobile = useBreakpointValue({ base: true, md: false });
  const chartHeight = useBreakpointValue({ 
    base: '180px', 
    sm: '220px', 
    md: '300px' 
  });

  // Chargement des données
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats({
          totalPdas: 87,
          totalExpertises: 124,
          completedPdas: 65,
          pendingPdas: 22,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) loadDashboardData();
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

          {/* Filtres rapides mobile */}
          {isMobile && (
            <Box
              overflowX="auto"
              py={1}
              mx={-2}
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none'
              }}
            >
              <HStack spacing={2} px={2}>
                {['Jour', 'Semaine', 'Mois'].map((period) => (
                  <Button
                    key={period}
                    size="xs"
                    variant="outline"
                    fontSize="11px"
                    h="28px"
                    minW="auto"
                    px={3}
                  >
                    {period}
                  </Button>
                ))}
              </HStack>
            </Box>
          )}

          {/* Cartes statistiques */}
          <SimpleGrid
            columns={{ base: 2, lg: 4 }}
            spacing={{ base: 2, sm: 3, md: 4 }}
            minChildWidth={{ base: '140px', sm: '160px' }}
          >
            <StatCard
              label="Plans d'aide"
              value={stats.totalPdas}
              icon={MdShowChart}
              increase={23}
              color="blue.500"
            />
            <StatCard
              label="Expertises"
              value={stats.totalExpertises}
              icon={MdPeople}
              increase={15}
              color="green.500"
            />
            <StatCard
              label="PDAs complétés"
              value={stats.completedPdas}
              icon={MdDoneAll}
              progress={(stats.completedPdas / stats.totalPdas) * 100}
              color="purple.500"
            />
            <StatCard
              label="En attente"
              value={stats.pendingPdas}
              icon={MdPending}
              badge={{ text: "À traiter", color: "orange" }}
              color="orange.500"
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
                <Text
                  fontSize={{ base: '13px', sm: '15px' }}
                  fontWeight="semibold"
                >
                  Évolution des dossiers
                </Text>
              </CardHeader>
              <CardBody p={{ base: 1, sm: 2 }}>
                <Box h={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={MOCK_DATA.monthlyData}
                      margin={{
                        top: 5,
                        right: 5,
                        left: -15,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={25}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: '11px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#000091"
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
                <Text
                  fontSize={{ base: '13px', sm: '15px' }}
                  fontWeight="semibold"
                >
                  Répartition des travaux
                </Text>
              </CardHeader>
              <CardBody p={{ base: 1, sm: 2 }}>
                <Box h={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_DATA.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                        label={!isMobile}
                      >
                        {MOCK_DATA.pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={MOCK_DATA.colors[index % MOCK_DATA.colors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Liste des dossiers récents */}
          <Card>
            <CardHeader p={{ base: 2, sm: 3 }}>
              <Text
                fontSize={{ base: '13px', sm: '15px' }}
                fontWeight="semibold"
              >
                Derniers dossiers
              </Text>
            </CardHeader>
            <CardBody p={{ base: 2, sm: 3 }}>
              <VStack spacing={{ base: 2, sm: 3 }} align="stretch">
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
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
                          as={MdAssignment}
                          boxSize={{ base: '16px', sm: '20px' }}
                          color="blue.500"
                        />
                        <Box>
                          <Text
                            fontSize={{ base: '12px', sm: '14px' }}
                            fontWeight="medium"
                          >
                            Dossier #{2023 + i}
                          </Text>
                          <Text
                            fontSize={{ base: '10px', sm: '12px' }}
                            color="gray.500"
                          >
                            {new Date().toLocaleDateString('fr-FR')}
                          </Text>
                        </Box>
                      </HStack>
                       <Badge
                        colorScheme={i === 0 ? "green" : i === 1 ? "orange" : "blue"}
                        fontSize={{ base: '9px', sm: '11px' }}
                        px={1.5}
                        py={0.5}
                        textTransform="none"
                        borderRadius="full"
                      >
                        {i === 0 ? "Terminé" : i === 1 ? "En attente" : "En cours"}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </VStack>

              {/* Bouton "Voir plus" */}
              <Button
                variant="ghost"
                size="sm"
                width="full"
                mt={{ base: 2, sm: 3 }}
                fontSize={{ base: '11px', sm: '13px' }}
                height={{ base: '32px', sm: '36px' }}
              >
                Voir tous les dossiers
              </Button>
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
                    >
                      Nouvelle expertise
                    </MenuItem>
                    <MenuItem 
                      icon={<Icon as={MdAdd} boxSize="16px" />}
                      py={2}
                    >
                      Nouveau PDA
                    </MenuItem>
                    <MenuItem 
                      icon={<Icon as={MdFileDownload} boxSize="16px" />}
                      py={2}
                    >
                      Exporter les données
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
                  