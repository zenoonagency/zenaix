# Utils - Funções Utilitárias

## 📅 DateUtils - Funções de Data Unificadas

Todas as funções relacionadas a datas foram consolidadas em um único arquivo `dateUtils.ts` para facilitar a manutenção e uso.

### 🚀 Funções Principais

#### Formatação de Datas

- `formatDate(date: string | Date)` - Formata data para dd/MM/yyyy
- `formatDateTime(isoString: string)` - Formata data ISO para dd/MM/yyyy HH:mm
- `formatDateTimeGeneral(date: string | Date)` - Formata data/hora geral
- `formatMessageTime(isoString: string)` - Formata apenas hora HH:mm
- `formatCompactDate(date: string | Date)` - Formato compacto (Hoje, Ontem, etc.)

#### Conversão de Fuso Horário

- `toBrasiliaTimezone(date: Date)` - Converte para fuso de Brasília
- `adjustDateToBrasilia(isoString: string)` - Ajusta string ISO para Brasília
- `toLocalTimezone(date: Date)` - Converte para fuso local
- `toUTC(date: Date)` - Converte para UTC
- `formatWithTimezone(date: Date, timezone?)` - Formata com fuso específico

#### Utilitários de Data

- `getCurrentISOString()` - Data atual em ISO
- `createISODate(year, month, day, hour?, minute?, second?)` - Cria data ISO
- `isValidISOString(isoString: string)` - Valida string ISO
- `toISOString(date: Date)` - Converte para ISO com tratamento de erro

#### Fuso Horário

- `getTimezoneOffset(timezone?)` - Obtém offset em minutos
- `isDaylightSavingTime(date?, timezone?)` - Verifica horário de verão
- `TIMEZONE_OPTIONS` - Lista de fusos horários disponíveis

### 📦 Como Usar

```typescript
// Importação direta
import { formatDate, getCurrentISOString } from "./utils/dateUtils";

// Ou via índice
import { formatDate, getCurrentISOString } from "./utils";

// Exemplos
const isoDate = "2024-01-15T14:30:00.000Z";
formatDate(isoDate); // "15/01/2024"
getCurrentISOString(); // Data atual em ISO
```

### 🔄 Migração

Todas as funções de data dos arquivos `formatters.ts` e `timezones.ts` foram movidas para `dateUtils.ts`. Os imports foram atualizados automaticamente.

### ✨ Benefícios

- ✅ Centralização de todas as funções de data
- ✅ Tratamento de erros consistente
- ✅ Suporte completo ao fuso horário brasileiro
- ✅ Funções otimizadas e bem documentadas
- ✅ Fácil manutenção e extensão
