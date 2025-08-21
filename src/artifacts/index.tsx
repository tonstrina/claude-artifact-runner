import React, { useState, useEffect } from 'react';
import { Plus, User, FileText, Download, Edit2, Trash2, Calendar, Search, Cloud, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

interface Note {
  id: number;
  client_id: number;
  content: string;
  created_at: string;
  last_modified?: string;
}

interface Client {
  id: number;
  name: string;
  created_at: string;
  notes?: Note[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check if Supabase is configured
  const isConfigured = supabaseUrl && supabaseKey && supabase;

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load clients from Supabase
  const loadClients = async () => {
    if (!isConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const savedClients = localStorage.getItem('clientNotes');
        if (savedClients) {
          setClients(JSON.parse(savedClients));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Load notes for each client
      const clientsWithNotes = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: notesData, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

          if (notesError) throw notesError;

          return {
            ...client,
            notes: notesData || []
          };
        })
      );

      setClients(clientsWithNotes);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(`Failed to load data: ${err.message || 'Unknown error'}`);
      
      // Fallback to localStorage on error
      try {
        const savedClients = localStorage.getItem('clientNotes');
        if (savedClients) {
          setClients(JSON.parse(savedClients));
          setError(error + ' (Loaded from local backup)');
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save to localStorage as backup
  const saveToLocalStorage = (clientsData: Client[]) => {
    try {
      localStorage.setItem('clientNotes', JSON.stringify(clientsData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Save to localStorage whenever clients change
  useEffect(() => {
    if (clients.length > 0) {
      saveToLocalStorage(clients);
    }
  }, [clients]);

  // Add new client
  const addClient = async () => {
    if (!newClientName.trim()) return;

    const clientData = { name: newClientName.trim() };

    if (!isConfigured || !isOnline) {
      // Fallback to local storage
      const newClient: Client = {
        id: Date.now(),
        name: newClientName.trim(),
        created_at: new Date().toISOString(),
        notes: []
      };
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      saveToLocalStorage(updatedClients);
      setNewClientName('');
      setShowAddClient(false);
      
      if (!isOnline) {
        setError('Added offline - will sync when connection restored');
      }
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      const newClient = { ...data, notes: [] };
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      saveToLocalStorage(updatedClients);
      setNewClientName('');
      setShowAddClient(false);
      setError(null);
    } catch (err: any) {
      console.error('Error adding client:', err);
      setError(`Failed to add client: ${err.message}`);
      
      // Add locally as fallback
      const newClient: Client = {
        id: Date.now(),
        name: newClientName.trim(),
        created_at: new Date().toISOString(),
        notes: []
      };
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      saveToLocalStorage(updatedClients);
      setNewClientName('');
      setShowAddClient(false);
    } finally {
      setSyncing(false);
    }
  };

  // Add note to selected client
  const addNote = async () => {
    if (!newNote.trim() || !selectedClient) return;

    const noteData = {
      client_id: selectedClient.id,
      content: newNote.trim()
    };

    if (!isConfigured || !isOnline) {
      // Fallback to local storage
      const note = {
        id: Date.now(),
        client_id: selectedClient.id,
        content: newNote.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedClient = {
        ...selectedClient,
        notes: [note, ...(selectedClient.notes || [])]
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setNewNote('');
      setShowAddNote(false);
      
      if (!isOnline) {
        setError('Added offline - will sync when connection restored');
      }
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) throw error;

      const updatedClient = {
        ...selectedClient,
        notes: [data, ...(selectedClient.notes || [])]
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setNewNote('');
      setShowAddNote(false);
      setError(null);
    } catch (err: any) {
      console.error('Error adding note:', err);
      setError(`Failed to add note: ${err.message}`);
      
      // Add locally as fallback
      const note = {
        id: Date.now(),
        client_id: selectedClient.id,
        content: newNote.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedClient = {
        ...selectedClient,
        notes: [note, ...(selectedClient.notes || [])]
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setNewNote('');
      setShowAddNote(false);
    } finally {
      setSyncing(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: number) => {
    if (!selectedClient) return;

    if (!isConfigured || !isOnline) {
      // Fallback to local storage
      const updatedClient = {
        ...selectedClient,
        notes: (selectedClient.notes || []).filter(note => note.id !== noteId)
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      
      if (!isOnline) {
        setError('Deleted offline - will sync when connection restored');
      }
      return;
    }

    setSyncing(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      const updatedClient = {
        ...selectedClient,
        notes: (selectedClient.notes || []).filter(note => note.id !== noteId)
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setError(null);
    } catch (err: any) {
      console.error('Error deleting note:', err);
      setError(`Failed to delete note: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Update note
  const updateNote = async (noteId: number, newContent: string) => {
    if (!selectedClient) return;

    const updateData = {
      content: newContent,
      last_modified: new Date().toISOString()
    };

    if (!isConfigured || !isOnline) {
      // Fallback to local storage
      const updatedClient = {
        ...selectedClient,
        notes: (selectedClient.notes || []).map(note => 
          note.id === noteId 
            ? { ...note, content: newContent, last_modified: new Date().toISOString() }
            : note
        )
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setEditingNote(null);
      
      if (!isOnline) {
        setError('Updated offline - will sync when connection restored');
      }
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      const updatedClient = {
        ...selectedClient,
        notes: (selectedClient.notes || []).map(note => 
          note.id === noteId ? data : note
        )
      };
      
      const updatedClients = clients.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      );
      
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      saveToLocalStorage(updatedClients);
      setEditingNote(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating note:', err);
      setError(`Failed to update note: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Manual sync function
  const syncData = async () => {
    if (isConfigured && isOnline) {
      await loadClients();
    }
  };

  // Export functions
  const exportClientNotes = (client: Client) => {
    const content = `CLIENT NOTES: ${client.name}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Notes: ${client.notes?.length || 0}\n\n` +
      `${'='.repeat(50)}\n\n` +
      (client.notes || []).map(note => 
        `Date: ${new Date(note.created_at).toLocaleString()}\n` +
        `${note.last_modified ? `Last Modified: ${new Date(note.last_modified).toLocaleString()}\n` : ''}` +
        `Note:\n${note.content}\n\n` +
        `${'-'.repeat(30)}\n`
      ).join('\n');
    
    downloadFile(`${client.name}_notes.txt`, content);
  };

  const exportAllNotes = () => {
    const content = `ALL CLIENT NOTES\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Clients: ${clients.length}\n` +
      `Total Notes: ${clients.reduce((sum, client) => sum + (client.notes?.length || 0), 0)}\n\n` +
      `${'='.repeat(60)}\n\n` +
      clients.map(client => 
        `CLIENT: ${client.name}\n` +
        `Notes: ${client.notes?.length || 0}\n\n` +
        (client.notes || []).map(note => 
          `  Date: ${new Date(note.created_at).toLocaleString()}\n` +
          `  ${note.last_modified ? `Last Modified: ${new Date(note.last_modified).toLocaleString()}\n` : ''}` +
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">
            {isConfigured ? 'Loading your notes from the cloud...' : 'Loading your notes...'}
          </p>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center gap-2 text-sm">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  {isConfigured && (
                    <>
                      <Cloud className={`h-4 w-4 ${syncing ? 'animate-pulse text-yellow-500' : 'text-green-500'}`} />
                      <span className="text-gray-500">
                        {syncing ? 'Syncing...' : isOnline ? 'Cloud Connected' : 'Offline Mode'}
                      </span>
                    </>
                  )}
                </div>
              </h1>
              <p className="text-gray-600 mt-2">
                {isConfigured 
                  ? isOnline 
                    ? 'Your notes are automatically saved to the cloud and synced across devices'
                    : 'Working offline - changes will sync when connection is restored'
                  : 'Manage and track your client interactions (local storage only)'
                }
              </p>
            </div>
            <div className="flex gap-3">
              {isConfigured && (
                <button
                  onClick={syncData}
                  disabled={syncing || !isOnline}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Cloud className="h-4 w-4" />
                  Sync
                </button>
              )}
              <button
                onClick={() => setShowAddClient(true)}
                disabled={syncing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
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

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Configuration Warning */}
          {!isConfigured && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-700">
                Cloud storage not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables to enable cloud sync.
              </span>
            </div>
          )}

          {/* Offline Warning */}
          {!isOnline && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-orange-700">
                You're currently offline. Changes are being saved locally and will sync when connection is restored.
              </span>
            </div>
          )}
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
                      <span>{client.notes?.length || 0} notes</span>
                      <span>Added: {new Date(client.created_at).toLocaleDateString()}</span>
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
                    <p className="text-gray-600">{selectedClient.notes?.length || 0} notes</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddNote(true)}
                      disabled={syncing}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  {(selectedClient.notes || []).map(note => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                          {note.last_modified && (
                            <span className="text-gray-500">• Modified: {new Date(note.last_modified).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            disabled={syncing}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            disabled={syncing}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
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
                              disabled={syncing}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  {(selectedClient.notes?.length || 0) === 0 && (
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
                onKeyDown={(e) => e.key === 'Enter' && !syncing && addClient()}
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
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {syncing ? 'Adding...' : 'Add Client'}
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
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {syncing ? 'Adding...' : 'Add Note'}
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
