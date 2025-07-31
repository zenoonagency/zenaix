import React from "react";
import { MoreVertical } from "lucide-react";

export function InstanceTabs({
  instances,
  activeInstanceId,
  handleInstanceChange,
  handleMenuClick,
  tabRefs,
  getStatusInfo,
}) {
  return (
    <div className="bg-gray-100 dark:bg-dark-700 rounded-t-lg px-2 py-1">
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-x-auto hide-scrollbar conversations-tabs-container">
          <div className="flex gap-1 min-w-max pb-1">
            {instances.map((instance) => {
              const statusInfo = getStatusInfo(instance.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={instance.id}
                  className="relative"
                  ref={(el) => {
                    tabRefs.current[instance.id] = el;
                  }}
                >
                  <button
                    onClick={() => handleInstanceChange(instance.id)}
                    className={`conversations-tab flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium border-b-2 transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                      activeInstanceId === instance.id
                        ? "active border-[#7f00ff] text-[#7f00ff] bg-white dark:bg-dark-900"
                        : "border-transparent text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-200 dark:hover:bg-dark-600"
                    }`}
                    style={{ minWidth: 160, maxWidth: 220 }}
                  >
                    <span className="truncate text-sm font-medium flex-1">
                      {instance.name}
                    </span>
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full ${statusInfo.bgColor} flex-shrink-0`}
                    >
                      <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleMenuClick(e, instance.id)}
                    className="conversations-tab-menu absolute -top-1 -right-1 w-6 h-6 bg-gray-200 dark:bg-dark-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
                    title="Mais informações"
                  >
                    <MoreVertical className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
