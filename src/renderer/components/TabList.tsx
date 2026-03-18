import React from "react";

export type TabListTab = {
  label: string;
  key: string;
  content: React.ReactNode;
};

export interface TabListProps {
  tabs: TabListTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function TabList({ tabs, activeTab, onTabChange }: TabListProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState(0);

  // Find the active tab index based on value
  const activeTabIndex = activeTab
    ? tabs.findIndex((tab) => tab.key === activeTab)
    : internalActiveTab;

  const handleTabClick = (index: number) => {
    if (onTabChange) {
      onTabChange(tabs[index].key);
    } else {
      setInternalActiveTab(index);
    }
  };

  return (
    <div className="settings-shell">
      <div role="tablist" className="settings-tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTabIndex === index}
            className="settings-tab"
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="settings-panel" role="tabpanel">
        <div className="settings-panel-body">
          {tabs[activeTabIndex]?.content}
        </div>
      </div>
    </div>
  );
}
