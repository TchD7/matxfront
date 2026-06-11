import { InputGroup, InputLeftElement, InputRightElement, Input, Box, IconButton, HStack } from '@chakra-ui/react';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  mb?: any;
}

export default function SearchBar({
  placeholder = 'Rechercher...',
  value,
  onChange,
  onSubmit,
  onClear,
  mb = 6
}: SearchBarProps) {

  const handleClear = () => {
    if (onClear) onClear();
    else onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <Box mb={mb}>
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none">
          <RiSearchLine color="gray.400" size={18} />
        </InputLeftElement>

        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outline"
          borderRadius="lg"
          focusBorderColor="purple.500"
          _hover={{ borderColor: 'gray.300' }}
          // Augmenté le padding-right pour laisser la place aux deux icônes
          pr="75px"
        />

        <InputRightElement width="75px">
          <HStack spacing={0}>
            {value && (
              <IconButton
                aria-label="Effacer"
                icon={<RiCloseLine />}
                size="sm"
                variant="ghost"
                borderRadius="full"
                onClick={handleClear}
              />
            )}
            {onSubmit && (
              <IconButton
                aria-label="Rechercher"
                icon={<RiSearchLine />}
                size="sm"
                variant="ghost"
                colorScheme="purple"
                borderRadius="full"
                onClick={onSubmit}
              />
            )}
          </HStack>
        </InputRightElement>
      </InputGroup>
    </Box>
  );
}