/**
 * TabbedForm - Platform component for module detail pages
 * Implements charter requirement: "Forms use a TabbedForm wrapper for sub-areas"
 * Reuses platform Files and Audit panels
 */

import React, { useState, useEffect } from 'react';

const TabbedForm = ({ 
    children, 
    defaultTab = 'overview',
    showFiles = true,
    showAudit = true,
    entityType = 'record',
    entityId = null,
    onTabChange = null
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [tabs, setTabs] = useState([]);

    useEffect(() => {
        // Build tabs array from children and standard tabs
        const childTabs = React.Children.map(children, (child, index) => {
            if (React.isValidElement(child) && child.props.tabName) {
                return {
                    id: child.props.tabId || child.props.tabName.toLowerCase(),
                    name: child.props.tabName,
                    icon: child.props.tabIcon || null,
                    component: child
                };
            }
            return null;
        }).filter(Boolean);

        const standardTabs = [];
        
        // Add Files tab if enabled
        if (showFiles) {
            standardTabs.push({
                id: 'files',
                name: 'Files',
                icon: 'fas fa-paperclip',
                component: <PlatformFilesPanel entityType={entityType} entityId={entityId} />
            });
        }
        
        // Add Audit tab if enabled
        if (showAudit) {
            standardTabs.push({
                id: 'audit',
                name: 'Audit',
                icon: 'fas fa-history',
                component: <PlatformAuditPanel entityType={entityType} entityId={entityId} />
            });
        }

        setTabs([...childTabs, ...standardTabs]);
    }, [children, showFiles, showAudit, entityType, entityId]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    const activeTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="tabbed-form">
            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-3" role="tablist">
                {tabs.map(tab => (
                    <li key={tab.id} className="nav-item" role="presentation">
                        <button
                            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                            type="button"
                            role="tab"
                            onClick={() => handleTabClick(tab.id)}
                            aria-selected={activeTab === tab.id}
                        >
                            {tab.icon && <i className={`${tab.icon} me-2`}></i>}
                            {tab.name}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                <div className="tab-pane fade show active" role="tabpanel">
                    {activeTabComponent}
                </div>
            </div>
        </div>
    );
};

/**
 * Platform Files Panel - Reusable across all modules
 */
const PlatformFilesPanel = ({ entityType, entityId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Placeholder for file management
    // TODO: Connect to platform file service
    
    return (
        <div className="platform-files-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Attached Files</h6>
                <button 
                    className="btn btn-sm btn-outline-primary"
                    disabled={uploading}
                >
                    <i className="fas fa-upload me-1"></i>
                    Upload File
                </button>
            </div>
            
            {files.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    <i className="fas fa-inbox fa-2x mb-2"></i>
                    <p>No files attached</p>
                    <small>Drag files here or click Upload to add attachments</small>
                </div>
            ) : (
                <div className="file-list">
                    {files.map(file => (
                        <div key={file.id} className="file-item border rounded p-2 mb-2">
                            <div className="d-flex align-items-center">
                                <i className={`fas fa-file me-2`}></i>
                                <div className="flex-grow-1">
                                    <div className="fw-medium">{file.name}</div>
                                    <small className="text-muted">
                                        {file.size} • {file.uploadedAt}
                                    </small>
                                </div>
                                <button className="btn btn-sm btn-outline-danger">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Platform Audit Panel - Reusable across all modules  
 */
const PlatformAuditPanel = ({ entityType, entityId }) => {
    const [auditLog, setAuditLog] = useState([]);
    
    // Placeholder for audit tracking
    // TODO: Connect to platform audit service
    
    useEffect(() => {
        // Load audit history
        setAuditLog([
            {
                id: 1,
                action: 'Created',
                user: 'System',
                timestamp: new Date().toISOString(),
                details: `${entityType} created`
            }
        ]);
    }, [entityType, entityId]);

    return (
        <div className="platform-audit-panel">
            <h6 className="mb-3">Activity History</h6>
            
            {auditLog.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    <i className="fas fa-history fa-2x mb-2"></i>
                    <p>No activity recorded</p>
                </div>
            ) : (
                <div className="audit-timeline">
                    {auditLog.map(entry => (
                        <div key={entry.id} className="audit-entry border-start border-2 ps-3 pb-3">
                            <div className="d-flex justify-content-between">
                                <strong>{entry.action}</strong>
                                <small className="text-muted">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </small>
                            </div>
                            <div className="text-muted">{entry.details}</div>
                            <div className="small text-muted">by {entry.user}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TabbedForm;
export { PlatformFilesPanel, PlatformAuditPanel };