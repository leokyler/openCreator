"use client";

import { useState } from "react";
import FlowEditor, { useFlowStore } from "@/components/FlowEditor";
import { templates } from "@/lib/templates";
import { Button } from "@/components/ui/button";

function App() {
  const [activeTab, setActiveTab] = useState("editor");
  const loadTemplate = useFlowStore((s) => s.loadTemplate);

  const handleLoadTemplate = (template: (typeof templates)[0]) => {
    loadTemplate(template.nodes, template.edges);
    setActiveTab("editor");
  };

  return (
    <main className="app">
      <header className="app-header">
        <h1>Creator Center</h1>
        <nav className="app-nav">
          <Button
            className={activeTab === "editor" ? "active" : ""}
            onClick={() => setActiveTab("editor")}
          >
            Node Editor
          </Button>
          <Button
            className={activeTab === "templates" ? "active" : ""}
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </Button>
          <Button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </Button>
        </nav>
      </header>
      <div className="app-content">
        {activeTab === "editor" && <FlowEditor />}
        {activeTab === "templates" && (
          <div className="templates-panel">
            <h2>创作模板</h2>
            <p style={{ color: "#888", marginBottom: "24px" }}>
              选择一个模板快速开始创作。基于经典故事结构理论
            </p>

            <div className="template-section">
              <h3>故事创作</h3>
              <div className="template-grid">
                {templates
                  .filter((t) => t.category === "story")
                  .map((template) => (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="template-icon">{template.icon}</div>
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="template-section">
              <h3>其他模板</h3>
              <div className="template-grid">
                {templates
                  .filter((t) => t.category !== "story")
                  .map((template) => (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="template-icon">{template.icon}</div>
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="settings-panel">
            <h2>设置</h2>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
