import { InputGroup, InputLeftElement, Input, Box } from '@chakra-ui/react';
import { RiSearchLine } from 'react-icons/ri';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  mb?: any;
}

export default function SearchBar({ 
  placeholder = 'Rechercher...', 
  value, 
  onChange,
  mb = 6 
}: SearchBarProps) {
  return (
    <Box mb={mb}>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <RiSearchLine color="gray.400" size={18} />
        </InputLeftElement>
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          fontSize="sm"
          _focus={{
            borderColor: 'purple.500',
            boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)',
          }}
          _placeholder={{ color: 'gray.400' }}
        />
      </InputGroup>
    </Box>
  );
}
