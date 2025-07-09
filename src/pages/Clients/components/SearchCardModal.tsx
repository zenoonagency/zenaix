import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Card } from '../types';

interface SearchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onCardClick: (cardId: string) => void;
}

export function SearchCardModal({ isOpen, onClose, cards, onCardClick }: SearchCardModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);

  // Reset filtered cards when modal opens or cards change
  useEffect(() => {
    console.log('Cards recebidos:', cards); // Debug
    if (isOpen) {
      setFilteredCards(cards);
      setSearchTerm('');
    }
  }, [isOpen, cards]);

  // Filter cards when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filtered = cards.filter(card => {
      // Debug logs
      console.log('Verificando card:', {
        id: card.id,
        title: card.title,
        description: card.description,
        phone: card.phone,
        value: card.value
      });
      
      const titleMatch = (card.title || '').toLowerCase().includes(searchTermLower);
      const descriptionMatch = (card.description || '').toLowerCase().includes(searchTermLower);
      const phoneMatch = (card.phone || '').toLowerCase().includes(searchTermLower);
      const valueMatch = card.value ? card.value.toString().includes(searchTermLower) : false;
      
      // Debug logs
      console.log('Matches:', {
        titleMatch,
        descriptionMatch,
        phoneMatch,
        valueMatch
      });

      return titleMatch || descriptionMatch || phoneMatch || valueMatch;
    });

    console.log('Cartões filtrados:', filtered); // Debug
    setFilteredCards(filtered);
  }, [searchTerm, cards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="w-full max-w-2xl p-6 bg-white dark:bg-dark-900 rounded-lg shadow-xl border dark:border-white/10 border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Procurar Cartão
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite para pesquisar..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredCards.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Nenhum cartão encontrado
            </p>
          ) : (
            filteredCards.map(card => (
              <div
                key={card.id}
                onClick={() => {
                  onCardClick(card.id);
                  onClose();
                }}
                className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {card.title}
                </h4>
                {card.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {card.description}
                  </p>
                )}
                {card.phone && (
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    📞 {card.phone}
                  </div>
                )}
                {card.value > 0 && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(card.value)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 