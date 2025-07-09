import { useLocalizationStore, SupportedCurrency } from '../store/localizationStore';

export function useCurrency() {
  const { 
    currency, 
    formatCurrency, 
    convertCurrency,
    exchangeRates
  } = useLocalizationStore();

  /**
   * Formata um valor para a moeda atual ou uma moeda específica
   * @param amount Valor a ser formatado
   * @param targetCurrency Moeda opcional para formatação (usa a moeda atual se não especificada)
   * @returns String formatada com símbolo da moeda
   */
  const format = (amount: number, targetCurrency?: SupportedCurrency) => {
    return formatCurrency(amount, targetCurrency);
  };

  /**
   * Converte um valor de uma moeda para outra
   * @param amount Valor a ser convertido
   * @param fromCurrency Moeda de origem
   * @param toCurrency Moeda de destino (usa a moeda atual se não especificada)
   * @returns Valor convertido como número
   */
  const convert = (amount: number, fromCurrency: SupportedCurrency, toCurrency?: SupportedCurrency) => {
    return convertCurrency(amount, fromCurrency, toCurrency || currency);
  };

  /**
   * Converte e formata um valor de uma moeda para outra
   * @param amount Valor a ser convertido e formatado
   * @param fromCurrency Moeda de origem
   * @param toCurrency Moeda de destino (usa a moeda atual se não especificada)
   * @returns String formatada com o valor convertido
   */
  const convertAndFormat = (amount: number, fromCurrency: SupportedCurrency, toCurrency?: SupportedCurrency) => {
    const targetCurrency = toCurrency || currency;
    const convertedAmount = convertCurrency(amount, fromCurrency, targetCurrency);
    return formatCurrency(convertedAmount, targetCurrency);
  };

  /**
   * Obtém a taxa de câmbio entre duas moedas
   * @param fromCurrency Moeda de origem
   * @param toCurrency Moeda de destino (usa a moeda atual se não especificada)
   * @returns Taxa de câmbio como número
   */
  const getExchangeRate = (fromCurrency: SupportedCurrency, toCurrency?: SupportedCurrency) => {
    const targetCurrency = toCurrency || currency;
    const fromRate = exchangeRates.find(rate => rate.currency === fromCurrency)?.rate || 1;
    const toRate = exchangeRates.find(rate => rate.currency === targetCurrency)?.rate || 1;
    return (1 / fromRate) * toRate;
  };

  return {
    currentCurrency: currency,
    format,
    convert,
    convertAndFormat,
    getExchangeRate
  };
} 