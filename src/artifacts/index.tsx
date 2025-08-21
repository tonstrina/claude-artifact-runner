import React, { useState, useEffect } from 'react';
import { Plus, User, FileText, Download, Edit2, Trash2, Calendar, Search, Cloud, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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

interface SupabaseClient {
  id: number;
  name: string;
  created_at: string;
}

interface SupabaseNote {
  id: number;
  client_id: number;
  content: string;
  created_at: string;
  last_modified?: string;
}

const ClientNotesApp: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState<boolean>(false);
  const [showAddNote, setShowAddNote] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Check if Supabase is configured
  const isConfigured = Boolean(supabaseUrl && supabaseKey && supabase);

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
  const loadClients = async (): Promise<void> => {
    if (!isConfigured || !supabase) {
      // Fallback to localStorage if Supabase not configured
      try {
        const savedClients = localStorage.getItem('clientNotes');
        if (savedClients) {
          setClients(JSON.parse(savedClients) as Client[]);
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
        (clientsData as SupabaseClient[] || []).map(async (client): Promise<Client> => {
          const { data: notesData, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

          if (notesError) throw notesError;

          return {
            ...client,
            notes: (notesData as SupabaseNote[]) || []
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
          setClients(JSON.parse(savedClients) as Client[]);
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
  const saveToLocalStorage = (clientsData: Client[]): void => {
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
  const addClient = async (): Promise<void> => {
    if (!newClientName.trim()) return;

    const clientData = { name: newClientName.trim() };

    if (!isConfigured || !isOnline || !supabase) {
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

      const newClient: Client = { ...(data as SupabaseClient), notes: [] };
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
  const addNote = async (): Promise<void> => {
    if (!newNote.trim() || !selectedClient) return;

    const noteData = {
      client_id: selectedClient.id,
      content: newNote.trim()
    };

    if (!isConfigured || !isOnline || !supabase) {
      // Fallback to local storage
      const note: Note = {
        id: Date.now(),
        client_id: selectedClient.id,
        content: newNote.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedClient: Client = {
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

      const newNoteData = data as SupabaseNote;
      const updatedClient: Client = {
        ...selectedClient,
        notes: [newNoteData, ...(selectedClient.notes || [])]
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
      const note: Note = {
        id: Date.now(),
        client_id: selectedClient.id,
        content: newNote.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedClient: Client = {
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
  const deleteNote = async (noteId: number): Promise<void> => {
    if (!selectedClient) return;

    if (!isConfigured || !isOnline || !supabase) {
      // Fallback to local storage
      const updatedClient: Client = {
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

      const updatedClient: Client = {
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
  const updateNote = async (noteId: number, newContent: string): Promise<void> => {
    if (!selectedClient) return;

    const updateData = {
      content: newContent,
      last_modified: new Date().toISOString()
    };

    if (!isConfigured || !isOnline || !supabase) {
      // Fallback to local storage
      const updatedClient: Client = {
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

      const updatedNoteData = data as SupabaseNote;
      const updatedClient: Client = {
        ...selectedClient,
        notes: (selectedClient.notes || []).map(note => 
          note.id === noteId ? updatedNoteData : note
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
  const syncData = async (): Promise<void> => {
    if (isConfigured && isOnline) {
      await loadClients();
    }
  };

  // Export functions
  const exportClientNotes = (client: Client): void => {
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

  const exportAllNotes = (): void => {
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

  const downloadFile = (filename: string, content: string): void => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Client Notes Manager
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {isOnline ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                        <Wifi className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700 text-sm font-medium">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                        <WifiOff className="h-4 w-4 text-red-600" />
                        <span className="text-red-700 text-sm font-medium">Offline</span>
                      </div>
                    )}
                    {isConfigured && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                        <Cloud className={`h-4 w-4 ${syncing ? 'animate-pulse text-amber-600' : 'text-blue-600'}`} />
                        <span className="text-blue-700 text-sm font-medium">
                          {syncing ? 'Syncing...' : isOnline ? 'Cloud Connected' : 'Offline Mode'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                {isConfigured 
                  ? isOnline 
                    ? 'Your notes are automatically saved to the cloud and synced across devices'
                    : 'Working offline - changes will sync when connection is restored'
                  : 'Manage and track your client interactions (local storage only)'
                }
              </p>
            </div>
            <div className="flex gap-3 ml-6">
              {isConfigured && (
                <button
                  onClick={syncData}
                  disabled={syncing || !isOnline}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Cloud className="h-5 w-5" />
                  Sync
                </button>
              )}
              <button
                onClick={() => setShowAddClient(true)}
                disabled={syncing}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Client
              </button>
              {clients.length > 0 && (
                <button
                  onClick={exportAllNotes}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <Download className="h-5 w-5" />
                  Export All
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-red-800 font-medium flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-200 rounded-lg"
              >
                ×
              </button>
            </div>
          )}

          {/* Configuration Warning */}
          {!isConfigured && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-amber-800 font-medium">
                Cloud storage not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables to enable cloud sync.
              </span>
            </div>
          )}

          {/* Offline Warning */}
          {!isOnline && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-orange-200 rounded-lg">
                <WifiOff className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-orange-800 font-medium">
                You're currently offline. Changes are being saved locally and will sync when connection is restored.
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Clients ({clients.length})
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                      selectedClient?.id === client.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                        : 'bg-gray-50 hover:bg-white border-2 border-transparent hover:border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedClient?.id === client.id ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {client.notes?.length || 0} notes
                          </span>
                          <span>Added: {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">
                      {searchTerm ? 'No clients found' : 'No clients yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm ? 'Try a different search term' : 'Add your first client to get started'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="xl:col-span-2">
            {selectedClient ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-lg text-gray-600 mt-1">
                      {selectedClient.notes?.length || 0} {(selectedClient.notes?.length || 0) === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddNote(true)}
                      disabled={syncing}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      Add Note
                    </button>
                    <button
                      onClick={() => exportClientNotes(selectedClient)}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                  {(selectedClient.notes || []).map(note => (
                    <div key={note.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium">{new Date(note.created_at).toLocaleDateString()}</span>
                            <span className="block text-xs text-gray-500">{new Date(note.created_at).toLocaleTimeString()}</span>
                            {note.last_modified && (
                              <span className="block text-xs text-gray-500 mt-1">
                                Modified: {new Date(note.last_modified).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            disabled={syncing}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            disabled={syncing}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <div className="space-y-4">
                          <textarea
                            defaultValue={note.content}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24 resize-y bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                updateNote(note.id, (e.target as HTMLTextAreaElement).value);
                              }
                            }}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                updateNote(note.id, textarea.value);
                              }}
                              disabled={syncing}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 font-medium"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all duration-200 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                      )}
                    </div>
                  ))}
                  {(selectedClient.notes?.length || 0) === 0 && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
                      <p className="text-gray-600 mb-6">Add your first note for {selectedClient.name} to get started</p>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                      >
                        <Plus className="h-5 w-5" />
                        Add First Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a Client</h3>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Choose a client from the list to view and manage their notes, or add a new client to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Client</h3>
              <input
                type="text"
                placeholder="Enter client name..."
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && !syncing && addClient()}
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowAddClient(false);
                    setNewClientName('');
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  disabled={syncing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
                >
                  {syncing ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Add Note for <span className="text-blue-600">{selectedClient?.name}</span>
              </h3>
              <textarea
                placeholder="Enter your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 h-40 resize-y"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  disabled={syncing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
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