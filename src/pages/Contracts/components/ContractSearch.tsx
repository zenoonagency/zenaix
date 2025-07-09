import React from 'react';
import { Input } from '../../../components/ui/Input';

interface ContractSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContractSearch({ value, onChange }: ContractSearchProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar contratos..."
      label="Buscar"
    />
  );
}