import { Box } from '../../../components/Box';

export function TransactionForm({ onSubmit, initialData, onCancel }: TransactionFormProps) {
  // ... existing code ...

  return (
    <Box className="p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form content remains the same */}
        // ... existing code ...
      </form>
    </Box>
  );
} 