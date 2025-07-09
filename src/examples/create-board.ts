import { useKanbanStore } from '../pages/Clients/store/kanbanStore';

export function CreateBoardExample() {
  const { addBoard } = useKanbanStore();

  const handleClick = () => {
    addBoard('Novo Board');
  };

  return {
    handleClick,
  };
} 