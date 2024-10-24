// components/ManageUser.tsx
import { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des agents');
        }
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        } else {
          throw new Error(data.message);
        }
      } catch (error : any) {
        setError(error.message);
      }
    };

    fetchUsers();
  }, []);

  if (error) {
    return <Text color="red.500">Erreur : {error}</Text>;
  }

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nom</Th>
            <Th>Email</Th>
            <Th>Rôle</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user._id}>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}