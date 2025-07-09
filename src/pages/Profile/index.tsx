import React, { useState, useRef } from 'react';
import { User, Camera, Trash2, QrCode, X } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useSettingsStore } from '../../store/settingsStore';

export function Profile() {
  const { name, photo, plan, setUserData } = useUser();
  const { webhookAgent } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: name,
    photo: photo,
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, photo: base64String }));
        setUserData({ name: formData.name, photo: base64String, plan });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
    setUserData({ name: formData.name, photo: '', plan });
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setFormData(prev => ({ ...prev, name: newName }));
    setUserData({ name: newName, photo: formData.photo, plan });
  };

  const handleGenerateQRCode = async () => {
    if (!webhookAgent) {
      alert('Webhook não configurado');
      return;
    }

    setIsGeneratingQR(true);
    setQrCodeImage(null);

    try {
      const response = await fetch(webhookAgent, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          photo: formData.photo,
          plan: plan
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar QR Code');
      }

      const data = await response.json();
      if (data.qrcode) { // Assumindo que o webhook retorna { qrcode: 'base64string' }
        setQrCodeImage(data.qrcode);
      } else {
        throw new Error('QR Code não recebido');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar QR Code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perfil</h1>
          {qrCodeImage && (
            <button
              onClick={() => setQrCodeImage(null)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          {qrCodeImage ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrCodeImage}
                alt="QR Code"
                className="w-64 h-64"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Escaneie o QR Code para compartilhar seu perfil
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {formData.photo ? (
                    <div className="relative">
                      <img
                        src={formData.photo}
                        alt={formData.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-[#7f00ff]"
                      />
                      <button
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[#7f00ff]/10 flex items-center justify-center">
                      <User className="w-16 h-16 text-[#7f00ff]" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-[#7f00ff] rounded-full text-white hover:bg-[#7f00ff]/90 transition-colors"
                    title="Alterar foto"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plano Atual
                  </label>
                  <div className="px-4 py-2 rounded-lg bg-[#7f00ff]/10 text-[#7f00ff] font-medium">
                    {plan}
                  </div>
                </div>

                <button
                  onClick={handleGenerateQRCode}
                  disabled={isGeneratingQR}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  {isGeneratingQR ? 'Gerando QR Code...' : 'Gerar QR Code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 