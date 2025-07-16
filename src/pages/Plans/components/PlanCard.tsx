import React from "react";
import { Check } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";

interface PlanCardProps {
  title: string;
  description: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  features: string[];
  isPopular?: boolean;
  gradient: string;
  baseUsers: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PlanCard({
  title,
  description,
  price,
  billingPeriod,
  features,
  isPopular,
  gradient,
  baseUsers,
  isSelected,
  onClick,
  className,
}: PlanCardProps) {
  // Extrair as cores do gradiente para usar no círculo
  const gradientColor = gradient.split(" ")[1].replace("from-", "");

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg transition-all duration-200 ease-out
        ${
          isSelected
            ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-dark-900"
            : ""
        }
        hover:translate-y-[-2px]
        cursor-pointer bg-white dark:bg-dark-800 shadow-lg hover:shadow-xl
        ${className || ""}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="relative p-6">
        {/* Cabeçalho com título e círculo colorido */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300">
                {title}
              </h3>
              <div className={`w-3 h-3 rounded-full bg-${gradientColor}`} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {description}
            </p>
          </div>
          {isPopular && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Popular
            </span>
          )}
        </div>

        {/* Preço */}
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(price)}
            </span>
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
              /{billingPeriod === "monthly" ? "mês" : "ano"}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {baseUsers} licença incluída
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Licenças adicionais disponíveis no checkout
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center text-sm text-gray-700 dark:text-gray-200"
            >
              <div className="rounded-full p-1 bg-purple-600 dark:bg-purple-500 mr-3 flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
