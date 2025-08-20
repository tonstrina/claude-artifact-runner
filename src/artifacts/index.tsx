import React, { useState } from 'react';

// Simple icons as SVG components to avoid any external dependencies
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const FileTextIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="M21 21l-4.35-4.35"></path>
  </svg>
);

interface Note {
  id: number;
  content: string;
  date: string;
  createdAt: string;
  lastModified?: string;
}

interface Client {
  id: number;
  name: string;
  notes: Note[];
  createdAt: string;
}

const ClientNotesApp = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<number | null>(null);

  // Add new client
  const addClient = () => {
    if (newClientName.trim()) {
      const newClient: Client = {
        id: Date.now(),
        name: newClientName.trim(),
        notes: [],
        createdAt: new Date().toISOString()
      };
      setClients([...clients, newClient]);
      setNewClientName('');
      setShowAddClient(false);
    }
  };

  // Add note to selected client
  const addNote = () => {
    if (newNote.trim() && selectedClient) {
      const note: Note = {
        id: Date.now(),
        content: newNote.trim(),
        date: new Date().toISOString(),
        createdAt: new Date().toLocaleString()
      };
      
      setClients(clients.map(client => 
        client.id === selectedClient.id 
          ? { ...client, notes: [note, ...client.notes] }
          : client
      ));
      
      setSelectedClient({
        ...selectedClient,
        notes: [note, ...selectedClient.notes]
      });
      
      setNewNote('');
      setShowAddNote(false);
    }
  };

  // Delete note
  const deleteNote = (noteId: number) => {
    if (!selectedClient) return;
    
    setClients(clients.map(client => 
      client.id === selectedClient.id 
        ? { ...client, notes: client.notes.filter(note => note.id !== noteId) }
        : client
    ));
    
    setSelectedClient({
      ...selectedClient,
      notes: selectedClient.notes.filter(note => note.id !== noteId)
    });
  };

  // Update note
  const updateNote = (noteId: number, newContent: string) => {
    if (!selectedClient) return;
    
    setClients(clients.map(client => 
      client.id === selectedClient.id 
        ? { 
            ...client, 
            notes: client.notes.map(note => 
              note.id === noteId 
                ? { ...note, content: newContent, lastModified: new Date().toLocaleString() }
                : note
            )
          }
        : client
    ));
    
    setSelectedClient({
      ...selectedClient,
      notes: selectedClient.notes.map(note => 
        note.id === noteId 
          ? { ...note, content: newContent, lastModified: new Date().toLocaleString() }
          : note
      )
    });
    setEditingNote(null);
  };

  // Export functions
  const exportClientNotes = (client: Client) => {
    const content = `CLIENT NOTES: ${client.name}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Notes: ${client.notes.length}\n\n` +
      `${'='.repeat(50)}\n\n` +
      client.notes.map(note => 
        `Date: ${note.createdAt}\n` +
        `${note.lastModified ? `Last Modified: ${note.lastModified}\n` : ''}` +
        `Note:\n${note.content}\n\n` +
        `${'-'.repeat(30)}\n`
      ).join('\n');
    
    downloadFile(`${client.name}_notes.txt`, content);
  };

  const exportAllNotes = () => {
    const content = `ALL CLIENT NOTES\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Clients: ${clients.length}\n` +
      `Total Notes: ${clients.reduce((sum, client) => sum + client.notes.length, 0)}\n\n` +
      `${'='.repeat(60)}\n\n` +
      clients.map(client => 
        `CLIENT: ${client.name}\n` +
        `Notes: ${client.notes.length}\n\n` +
        client.notes.map(note => 
          `  Date: ${note.createdAt}\n` +
          `  ${note.lastModified ? `Last Modified: ${note.lastModified}\n` : ''}` +
          `  Note: ${note.content}\n\n`
        ).join('') +
        `${'='.repeat(40)}\n\n`
      ).join('');
    
    downloadFile('all_client_notes.txt', content);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                fontSize: '30px', 
                fontWeight: 'bold', 
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: 0
              }}>
                <FileTextIcon />
                Client Notes Manager
              </h1>
              <p style={{ color: '#6b7280', marginTop: '8px', margin: 0 }}>
                Manage and track your client interactions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddClient(true)}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                <PlusIcon />
                Add Client
              </button>
              {clients.length > 0 && (
                <button
                  onClick={exportAllNotes}
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                >
                  <DownloadIcon />
                  Export All
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Client List */}
          <div>
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              border: '1px solid #e5e7eb',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0
                }}>
                  <UserIcon />
                  Clients ({clients.length})
                </h2>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '12px' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      backgroundColor: selectedClient?.id === client.id ? '#eff6ff' : '#f9fafb',
                      border: selectedClient?.id === client.id ? '2px solid #bfdbfe' : '1px solid #e5e7eb'
                    }}
                    onMouseOver={(e) => {
                      if (selectedClient?.id !== client.id) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedClient?.id !== client.id) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500', color: '#111827' }}>{client.name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', gap: '16px' }}>
                      <span>{client.notes.length} notes</span>
                      <span>Added: {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    {searchTerm ? 'No clients found' : 'No clients yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            {selectedClient ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                border: '1px solid #e5e7eb',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {selectedClient.name}
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>{selectedClient.notes.length} notes</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowAddNote(true)}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      <PlusIcon />
                      Add Note
                    </button>
                    <button
                      onClick={() => exportClientNotes(selectedClient)}
                      style={{
                        backgroundColor: '#059669',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    >
                      <DownloadIcon />
                      Export
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
                  {selectedClient.notes.map(note => (
                    <div key={note.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      backgroundColor: '#f9fafb',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                          <CalendarIcon />
                          <span>{note.createdAt}</span>
                          {note.lastModified && (
                            <span style={{ color: '#9ca3af' }}>• Modified: {note.lastModified}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => setEditingNote(note.id)}
                            style={{
                              padding: '4px',
                              color: '#6b7280',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            style={{
                              padding: '4px',
                              color: '#6b7280',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <div style={{ marginTop: '8px' }}>
                          <textarea
                            defaultValue={note.content}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              minHeight: '80px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              resize: 'vertical'
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                updateNote(note.id, (e.target as HTMLTextAreaElement).value);
                              }
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={(e) => {
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                updateNote(note.id, textarea.value);
                              }}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#d1d5db',
                                color: '#374151',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#111827', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                      )}
                    </div>
                  ))}
                  {selectedClient.notes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                      <FileTextIcon />
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                        No notes yet for this client
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                border: '1px solid #e5e7eb',
                padding: '24px',
                textAlign: 'center'
              }}>
                <UserIcon />
                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                  Select a Client
                </h3>
                <p style={{ color: '#6b7280' }}>Choose a client from the list to view and manage their notes</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Add New Client</h3>
              <input
                type="text"
                placeholder="Client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => e.key === 'Enter' && addClient()}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddClient(false);
                    setNewClientName('');
                  }}
                  style={{
                    padding: '8px 16px',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '600px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Add Note for {selectedClient?.name}
              </h3>
              <textarea
                placeholder="Enter your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  height: '128px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                  style={{
                    padding: '8px 16px',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotesApp;