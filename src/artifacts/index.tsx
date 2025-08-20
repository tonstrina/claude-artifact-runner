import React, { useState } from 'react';
import { Plus, User, FileText, Download, Edit2, Trash2, Calendar, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Client Notes Manager
              </h1>
              <p className="text-gray-600 mt-2">Manage and track your client interactions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
              {clients.length > 0 && (
                <button
                  onClick={exportAllNotes}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Clients ({clients.length})
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-blue-50 border-blue-200 border-2'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span>{client.notes.length} notes</span>
                      <span>Added: {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No clients found' : 'No clients yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-gray-600">{selectedClient.notes.length} notes</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </button>
                    <button
                      onClick={() => exportClientNotes(selectedClient)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedClient.notes.map(note => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{note.createdAt}</span>
                          {note.lastModified && (
                            <span className="text-gray-500">• Modified: {note.lastModified}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            defaultValue={note.content}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                updateNote(note.id, (e.target as HTMLTextAreaElement).value);
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                updateNote(note.id, textarea.value);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900 whitespace-pre-wrap">{note.content}</div>
                      )}
                    </div>
                  ))}
                  {selectedClient.notes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      No notes yet for this client
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
                <p className="text-gray-600">Choose a client from the list to view and manage their notes</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
              <input
                type="text"
                placeholder="Client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                onKeyDown={(e) => e.key === 'Enter' && addClient()}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddClient(false);
                    setNewClientName('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Add Note for {selectedClient?.name}</h3>
              <textarea
                placeholder="Enter your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 h-32"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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