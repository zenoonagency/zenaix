import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useContactsStore } from '../../Contacts/store/contactsStore';
import { read, utils } from 'xlsx';

export function ContactImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { addContact } = useContactsStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const workbook = read(file, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const contacts = utils.sheet_to_json(sheet) as Array<{
        Nome: string;
        Telefone: string;
      }>;

      contacts
        .filter(c => c.Nome && c.Telefone)
        .forEach(c => {
          addContact({
            name: c.Nome,
            phone: c.Telefone.replace(/\D/g, ''),
            tagIds: [],
          });
        });

    } catch (err) {
      setError('Erro ao processar arquivo. Verifique o formato e tente novamente.');
      console.error('File import error:', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Importar Contatos
        </h2>
        <FileSpreadsheet className="w-6 h-6 text-gray-400" />
      </div>

      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-[#7f00ff] dark:hover:border-[#7f00ff] transition-colors">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Arraste um arquivo .csv ou .xlsx aqui ou
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
        >
          Selecionar Arquivo
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}