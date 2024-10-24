
'use client'

import { Box } from '@chakra-ui/react'
import Sidebar from '../../components/Sidebar'
import NewPdaForm from '../../components/NewPdaForm'  // Supposons que vous avez déplacé le formulaire dans un composant séparé

export default function NewPdaPage() {
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1">
        <Box p={5}>
          <NewPdaForm />
        </Box>
      </Box>
    </Box>
  )
}

