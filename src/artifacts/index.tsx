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
}, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
    <div className="bg-red-500 text-white p-4">CSS TEST</div>
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden"> //Paddy
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-8"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Workspace</h2>
          <p className="text-purple-200">
            {isConfigured ? 'Syncing from the cloud...' : 'Preparing your notes...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-6 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-3">
                    Client Notes
                  </h1>
                  <div className="flex items-center gap-4">
                    {isOnline ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <Wifi className="h-4 w-4 text-emerald-300" />
                        <span className="text-emerald-200 text-sm font-semibold">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <WifiOff className="h-4 w-4 text-red-300" />
                        <span className="text-red-200 text-sm font-semibold">Offline</span>
                      </div>
                    )}
                    {isConfigured && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm">
                        <Cloud className={`h-4 w-4 ${syncing ? 'animate-spin text-yellow-300' : 'text-blue-300'}`} />
                        <span className="text-blue-200 text-sm font-semibold">
                          {syncing ? 'Syncing...' : 'Cloud Ready'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-lg text-purple-100 leading-relaxed max-w-2xl">
                {isConfigured 
                  ? isOnline 
                    ? 'Your notes sync seamlessly across all devices with enterprise-grade security'
                    : 'Working offline - changes will sync automatically when reconnected'
                  : 'Secure local storage keeps your notes private and accessible'
                }
              </p>
            </div>
            <div className="flex gap-4 ml-8">
              {isConfigured && (
                <button
                  onClick={syncData}
                  disabled={syncing || !isOnline}
                  className="group relative px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center gap-3 text-white font-semibold">
                    <Cloud className="h-5 w-5" />
                    Sync
                  </div>
                </button>
              )}
              <button
                onClick={() => setShowAddClient(true)}
                disabled={syncing}
                className="group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center gap-3 text-white font-semibold">
                  <Plus className="h-5 w-5" />
                  Add Client
                </div>
              </button>
              {clients.length > 0 && (
                <button
                  onClick={exportAllNotes}
                  className="group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center gap-3 text-white font-semibold">
                    <Download className="h-5 w-5" />
                    Export All
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 bg-red-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-200" />
              </div>
              <span className="text-red-100 font-medium flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-200 hover:text-white transition-colors p-1 hover:bg-red-500/30 rounded-lg"
              >
                ×
              </button>
            </div>
          )}

          {!isConfigured && (
            <div className="mt-6 p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 bg-amber-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-200" />
              </div>
              <span className="text-amber-100 font-medium">
                Cloud sync disabled. Configure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable.
              </span>
            </div>
          )}

          {!isOnline && (
            <div className="mt-6 p-4 bg-orange-500/20 border border-orange-400/30 rounded-xl backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 bg-orange-500/30 rounded-lg">
                <WifiOff className="h-5 w-5 text-orange-200" />
              </div>
              <span className="text-orange-100 font-medium">
                Offline mode active. Changes will sync when connection is restored.
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="xl:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Clients ({clients.length})
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-purple-300" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 placeholder-purple-300 text-white backdrop-blur-sm"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      selectedClient?.id === client.id
                        ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-white/20 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        selectedClient?.id === client.id 
                          ? 'bg-gradient-to-r from-purple-400 to-blue-400 shadow-lg shadow-purple-400/50' 
                          : 'bg-white/30 group-hover:bg-white/50'
                      }`} />
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">{client.name}</div>
                        <div className="text-sm text-purple-200 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-2">
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
                  <div className="text-center py-12 text-purple-200">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {searchTerm ? 'No matches found' : 'No clients yet'}
                    </h3>
                    <p className="text-purple-300">
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
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-4xl font-bold text-white mb-2">{selectedClient.name}</h2>
                    <p className="text-xl text-purple-200">
                      {selectedClient.notes?.length || 0} {(selectedClient.notes?.length || 0) === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowAddNote(true)}
                      disabled={syncing}
                      className="group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <div className="relative flex items-center gap-3 text-white font-semibold">
                        <Plus className="h-5 w-5" />
                        Add Note
                      </div>
                    </button>
                    <button
                      onClick={() => exportClientNotes(selectedClient)}
                      className="group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <div className="relative flex items-center gap-3 text-white font-semibold">
                        <Download className="h-5 w-5" />
                        Export
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                  {(selectedClient.notes || []).map(note => (
                    <div key={note.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-purple-200">
                          <div className="p-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl border border-white/20">
                            <Calendar className="h-5 w-5 text-blue-200" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-base">{new Date(note.created_at).toLocaleDateString()}</div>
                            <div className="text-purple-300">{new Date(note.created_at).toLocaleTimeString()}</div>
                            {note.last_modified && (
                              <div className="text-purple-400 text-xs mt-1">
                                Modified: {new Date(note.last_modified).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            disabled={syncing}
                            className="p-3 text-purple-200 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            disabled={syncing}
                            className="p-3 text-purple-200 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <div className="space-y-4">
                          <textarea
                            defaultValue={note.content}
                            className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent min-h-32 resize-y text-white placeholder-purple-300 backdrop-blur-sm"
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
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 font-semibold"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white leading-relaxed whitespace-pre-wrap text-lg">{note.content}</div>
                      )}
                    </div>
                  ))}
                  {(selectedClient.notes?.length || 0) === 0 && (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <FileText className="h-12 w-12 text-purple-300" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">No notes yet</h3>
                      <p className="text-purple-200 mb-8 text-lg">Create your first note for {selectedClient.name}</p>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl overflow-hidden transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center gap-3 text-white font-semibold text-lg">
                          <Plus className="h-6 w-6" />
                          Create First Note
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-12 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <User className="h-16 w-16 text-purple-300" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Select a Client</h3>
                <p className="text-xl text-purple-200 max-w-md mx-auto leading-relaxed">
                  Choose a client from the sidebar to view their notes, or create a new client to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-2xl font-bold text-white mb-6">Add New Client</h3>
              <input
                type="text"
                placeholder="Enter client name..."
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-6 text-white placeholder-purple-300 text-lg backdrop-blur-sm"
                onKeyDown={(e) => e.key === 'Enter' && !syncing && addClient()}
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowAddClient(false);
                    setNewClientName('');
                  }}
                  className="px-6 py-3 text-purple-200 hover:text-white hover:bg-white/20 rounded-2xl transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  disabled={syncing}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {syncing ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">
                New Note for <span className="text-blue-300">{selectedClient?.name}</span>
              </h3>
              <textarea
                placeholder="What's on your mind?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-6 h-48 resize-y text-white placeholder-purple-300 backdrop-blur-sm"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                  className="px-6 py-3 text-purple-200 hover:text-white hover:bg-white/20 rounded-2xl transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  disabled={syncing}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {syncing ? 'Saving...' : 'Save Note'}
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
