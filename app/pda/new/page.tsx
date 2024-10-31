
'use client'

import { Box } from '@chakra-ui/react'
import Sidebar from '../../components/Sidebar'
import NewPdaForm from '../../components/NewPdaForm'  // Supposons que vous avez déplacé le formulaire dans un composant séparé

export default function NewPdaPage() {
  return (
    <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
    <Sidebar />
    <Box 
      flex="1"
      width={{ base: '100%', md: 'auto' }}
    >
      <Box 
        p={{ base: 4, sm: 6, md: 8 }}
        minH={{ base: 'calc(100vh - 60px)', md: '100vh' }}
      >
        <NewPdaForm />
      </Box>
    </Box>
  </Box>
  )
}

