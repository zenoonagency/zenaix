const filteredBoards = boards.filter(board => 
  board?.title?.toLowerCase().includes(searchTerm.toLowerCase())
); 