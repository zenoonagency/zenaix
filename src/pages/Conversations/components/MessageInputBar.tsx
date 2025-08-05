import React, { useRef, useState } from "react";
import { Mic, Paperclip, Send, Trash2, Smile } from "lucide-react";

// Emojis populares do WhatsApp organizados por categoria
const emojiCategories = {
  recentes: [], // Será preenchido dinamicamente
  faces: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "🥴",
    "🤢",
  ],
  gestures: [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
  ],
  objects: [
    "💻",
    "📱",
    "📞",
    "📟",
    "📠",
    "🖨️",
    "🖥️",
    "⌨️",
    "🖱️",
    "🖲️",
    "💽",
    "💾",
    "💿",
    "📀",
    "🎥",
    "📺",
    "📻",
    "📷",
    "📸",
    "📹",
    "🎞️",
    "📽️",
    "🎬",
    "📼",
    "🔍",
    "🔎",
    "🔏",
    "🔐",
    "🔑",
    "🗝️",
    "💡",
    "🔦",
    "🕯️",
    "🪔",
    "🧯",
    "🛢️",
    "💸",
    "💵",
    "💴",
    "💶",
    "💷",
    "🪙",
    "💰",
    "💳",
    "💎",
    "⚖️",
    "🪜",
    "🦯",
    "🦽",
    "🦼",
  ],
  food: [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🫐",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🥑",
    "🍆",
    "🥔",
    "🥕",
    "🌽",
    "🌶️",
    "🥬",
    "🥦",
    "🧄",
    "🧅",
    "🥜",
    "🌰",
    "🍞",
    "🥐",
    "🥯",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🧈",
    "🥞",
    "🧇",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🦴",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
  ],
  places: [
    "🏠",
    "🏡",
    "🏘️",
    "🏚️",
    "🏗️",
    "🏭",
    "🏢",
    "🏬",
    "🏣",
    "🏤",
    "🏥",
    "🏦",
    "🏨",
    "🏪",
    "🏫",
    "🏩",
    "💒",
    "⛪",
    "🕌",
    "🕍",
    "🛕",
    "⛩️",
    "🕋",
    "⛲",
    "⛺",
    "🌁",
    "🌃",
    "🏙️",
    "🌄",
    "🌅",
    "🌆",
    "🌇",
    "🌉",
    "🎠",
    "🎡",
    "🎢",
    "🚂",
    "🚃",
    "🚄",
    "🚅",
    "🚆",
    "🚇",
    "🚈",
    "🚉",
    "🚊",
    "🚝",
    "🚞",
    "🚋",
    "🚌",
    "🚍",
    "🚎",
    "🚐",
    "🚑",
    "🚒",
    "🚓",
    "🚔",
    "🚕",
    "🚖",
    "🚗",
    "🚘",
    "🚙",
    "🚚",
    "🚛",
    "🚜",
    "🚝",
    "🚞",
    "🚟",
    "🚠",
    "🚡",
    "🚢",
    "🚣",
    "🚤",
    "🚥",
    "🚦",
    "🚧",
    "🚨",
    "🚩",
    "🚪",
    "🚫",
    "🚬",
    "🚭",
    "🚮",
    "🚯",
    "🚰",
    "🚱",
    "🚲",
    "🚳",
    "🚴",
    "🚵",
    "🚶",
    "🚷",
    "🚸",
    "🚹",
    "🚺",
    "🚻",
    "🚼",
    "🚽",
    "🚾",
    "🚿",
    "🛁",
    "🛂",
    "🛃",
    "🛄",
    "🛅",
    "🛋️",
    "🛌",
    "🛍️",
    "🛎️",
    "🛏️",
    "🛐",
    "🛑",
    "🛒",
    "🛕",
    "🛠️",
    "🛡️",
    "🛢️",
    "🛣️",
    "🛤️",
    "🛥️",
    "🛦",
    "🛧️",
    "🛨️",
    "🛩️",
    "🛪",
    "🛫",
    "🛬",
    "🛰️",
    "🛱️",
    "🛲",
    "🛳️",
    "🛴",
    "🛵",
    "🛶",
    "🛷",
    "🛸",
    "🛹",
    "🛺",
    "🛻",
    "🛼",
    "🛽",
    "🛾",
    "🛿",
    "✈️",
    "🛩️",
    "🛪",
    "🛫",
    "🛬",
    "🛰️",
    "🛱️",
    "🛲",
    "🛳️",
    "🛴",
    "🛵",
    "🛶",
    "🛷",
    "🛸",
    "🛹",
    "🛺",
    "🚀",
    "🛸",
    "🛹",
    "🛺",
  ],
  music: [
    "🎵",
    "🎶",
    "🎼",
    "🎤",
    "🎧",
    "🎺",
    "🎷",
    "🪗",
    "🎸",
    "🎹",
    "🪕",
    "🎻",
    "🪘",
    "🥁",
    "🪔",
    "🎭",
    "🎨",
    "🎬",
    "🎤",
    "🎧",
    "🎪",
    "🎟️",
    "🎫",
    "🎖️",
    "🏆",
    "🏅",
    "🥇",
    "🥈",
    "🥉",
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🪀",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🥅",
    "⛳",
    "🪁",
    "🏹",
  ],
};

const categoryIcons = {
  recentes: "🕐",
  faces: "😀",
  gestures: "👍",
  objects: "💻",
  food: "🍎",
  places: "🏠",
  music: "🎵",
};

// Função para gerenciar emojis recentes no localStorage
const getRecentEmojis = () => {
  try {
    const recent = localStorage.getItem("recentEmojis");
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

const saveRecentEmoji = (emoji: string) => {
  try {
    const recent = getRecentEmojis();
    // Se o emoji já existe nos recentes, não faz nada
    if (recent.includes(emoji)) {
      return;
    }
    // Adiciona o novo emoji no início e mantém apenas os 20 mais recentes
    const newRecent = [emoji, ...recent].slice(0, 20);
    localStorage.setItem("recentEmojis", JSON.stringify(newRecent));
  } catch {
    // Ignora erros de localStorage
  }
};

function RecordingWave() {
  // Onda fake animada
  return (
    <svg
      height="24"
      width="60"
      className="mx-2 animate-pulse"
      style={{ minWidth: 40 }}
    >
      <rect x="2" y="10" width="2" height="4" rx="1" fill="#bbb" />
      <rect x="8" y="6" width="2" height="12" rx="1" fill="#bbb" />
      <rect x="14" y="12" width="2" height="6" rx="1" fill="#bbb" />
      <rect x="20" y="8" width="2" height="10" rx="1" fill="#bbb" />
      <rect x="26" y="4" width="2" height="16" rx="1" fill="#bbb" />
      <rect x="32" y="8" width="2" height="10" rx="1" fill="#bbb" />
      <rect x="38" y="12" width="2" height="6" rx="1" fill="#bbb" />
      <rect x="44" y="6" width="2" height="12" rx="1" fill="#bbb" />
      <rect x="50" y="10" width="2" height="4" rx="1" fill="#bbb" />
    </svg>
  );
}

export function MessageInputBar({
  selectedContactId,
  activeInstance,
  showToast,
  isSendingFile,
  fileInputRef,
  newMessage,
  setNewMessage,
  handleKeyPress,
  handleSendMessage,
  handleFileSelect,
  isLoadingMessages,
  handleSendAudio, // função para enviar áudio
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("recentes");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  // Carregar emojis recentes quando o componente montar
  React.useEffect(() => {
    const recent = getRecentEmojis();
    setRecentEmojis(recent);
  }, []);

  // Detectar cliques fora da modal de emoji para fechá-la
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Função para inserir emoji no texto
  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    saveRecentEmoji(emoji); // Salva o emoji recente
    // Atualiza a lista de recentes
    setRecentEmojis(getRecentEmojis());
  };

  // Iniciar gravação
  const startRecording = async () => {
    if (!selectedContactId) {
      showToast("Selecione um contato para gravar áudio", "error");
      return;
    }
    if (activeInstance?.status !== "CONNECTED") {
      showToast("Instância não está conectada", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      setRecordingTime(0);
      setIsRecording(true);
      setAudioBlob(null);
      mediaRecorder.start();
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      showToast("Não foi possível acessar o microfone", "error");
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Cancelar gravação ou preview
  const cancelRecording = () => {
    stopRecording();
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Regravar
  const reRecord = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    startRecording();
  };

  // Enviar áudio
  const sendAudio = () => {
    if (audioBlob) {
      handleSendAudio(audioBlob);
      setIsRecording(false);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  // Formatar tempo
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Barra de gravação/preview igual WhatsApp
  if (isRecording || audioBlob) {
    return (
      <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Cancelar */}
          <button
            onClick={cancelRecording}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
            title="Cancelar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {audioBlob ? (
            <>
              <audio
                src={audioUrl!}
                controls
                controlsList="nodownload"
                className="h-8"
              />
              <span className="font-mono text-xs text-gray-700 dark:text-gray-200 min-w-[40px]">
                {formatTime(recordingTime)}
              </span>
              <button
                onClick={reRecord}
                className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full"
                title="Regravar"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={sendAudio}
                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full"
                title="Enviar áudio"
                disabled={!audioBlob}
              >
                <Send className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                <span className="font-mono text-xs text-gray-700 dark:text-gray-200 min-w-[40px]">
                  {formatTime(recordingTime)}
                </span>
              </span>
              <RecordingWave />
              {/* Parar gravação */}
              <button
                onClick={stopRecording}
                className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                title="Parar gravação"
              >
                {/* Ícone de quadrado (stop) */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="block"
                >
                  <rect
                    x="5"
                    y="5"
                    width="10"
                    height="10"
                    rx="2"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Barra padrão
  return (
    <div className="bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Botão de áudio */}
        <button
          onClick={startRecording}
          disabled={
            !selectedContactId ||
            (activeInstance && activeInstance.status !== "CONNECTED")
          }
          className={`p-2 transition-colors ${
            selectedContactId && activeInstance?.status === "CONNECTED"
              ? "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          title={
            !selectedContactId
              ? "Selecione um contato"
              : activeInstance?.status !== "CONNECTED"
              ? "Instância não conectada"
              : "Gravar áudio"
          }
        >
          <Mic className="w-5 h-5" />
        </button>
        {/* Botão de anexo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 transition-colors ${
            !isSendingFile
              ? "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          title="Anexar arquivo"
          disabled={isSendingFile}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        {/* Botão de emoji */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>
        {/* Campo de mensagem */}
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="w-full px-4 py-2 bg-white dark:bg-dark-900 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isLoadingMessages}
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 w-80 max-h-64 overflow-hidden z-50"
            >
              {/* Área principal dos emojis */}
              <div className="h-48 overflow-y-auto mb-2">
                {/* Grid de emojis da categoria ativa */}
                <div className="grid grid-cols-8 gap-1">
                  {(activeEmojiCategory === "recentes"
                    ? recentEmojis
                    : emojiCategories[activeEmojiCategory]
                  ).map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* Mostrar mensagem se não há emojis recentes */}
                  {activeEmojiCategory === "recentes" &&
                    recentEmojis.length === 0 && (
                      <div className="col-span-8 text-center text-gray-500 text-sm py-8">
                        Nenhum emoji usado recentemente
                      </div>
                    )}
                </div>
              </div>
              {/* Abas das categorias na parte de baixo */}
              <div className="flex border-t border-gray-200 dark:border-gray-600 pt-2">
                {Object.keys(emojiCategories).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveEmojiCategory(category)}
                    className={`flex-1 p-2 text-lg transition-colors ${
                      activeEmojiCategory === category
                        ? "text-purple-600 bg-purple-50 dark:bg-purple-900/30 rounded"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title={category}
                  >
                    {categoryIcons[category]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Botão de enviar texto */}
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className={`p-2 rounded-full transition-colors ${
            newMessage.trim()
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
          title="Enviar mensagem"
        >
          <Send className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.txt"
          className="hidden"
        />
      </div>
    </div>
  );
}
