import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, 
  LayoutDashboard, 
  Building, 
  LogOut, 
  Plus, 
  Trash2, 
  Loader2, 
  Upload,
  Users
} from 'lucide-react';
import { 
  getDeveloperProfile, 
  addSchool, 
  deleteSchool, 
  subscribeToSchools,
  uploadSchoolsBatch,
  getStudentsBySchool
} from '../services/developerService';
import { DeveloperProfile, School } from '../types';
import { auth } from '../services/firebase';

interface DeveloperDashboardProps {
  onSignOut: () => void;
}

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'schools' | 'students'>('profile');
  const [devProfile, setDevProfile] = useState<DeveloperProfile | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  
  // School Form State
  const [schoolName, setSchoolName] = useState('');
  const [schoolRegion, setSchoolRegion] = useState('');
  const [schoolDomain, setSchoolDomain] = useState('');
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Student Segregation State
  const [selectedSchoolForStudents, setSelectedSchoolForStudents] = useState<School | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
        const profile = await getDeveloperProfile(auth.currentUser.uid);
        setDevProfile(profile);
      }
      setLoading(false);
    };
    init();

    // Subscribe to schools
    const unsub = subscribeToSchools((data) => setSchools(data));
    
    // Timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
        if (selectedSchoolForStudents) {
            setIsLoadingStudents(true);
            const data = await getStudentsBySchool(selectedSchoolForStudents.name);
            setStudents(data);
            setIsLoadingStudents(false);
        } else {
            setStudents([]);
        }
    };
    loadStudents();
  }, [selectedSchoolForStudents]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !schoolRegion) return;

    setIsAddingSchool(true);
    try {
      await addSchool(schoolName, schoolRegion, schoolDomain);
      setSchoolName('');
      setSchoolRegion('');
      setSchoolDomain('');
      alert("School added successfully.");
    } catch (error) {
      alert("Failed to add school.");
    } finally {
      setIsAddingSchool(false);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      setIsAddingSchool(true);
      try {
        const lines = text.split('\n');
        const newSchools = [];
        // Assume Header: Name, Region, Domain
        // Simple CSV parse:
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Skip typical header
            if (line.toLowerCase().startsWith('name,region')) continue;

            const parts = line.split(',');
            if (parts.length >= 2) {
                newSchools.push({
                    name: parts[0].trim(),
                    region: parts[1].trim(),
                    domain: parts[2] ? parts[2].trim() : ''
                });
            }
        }

        if (newSchools.length > 0) {
            await uploadSchoolsBatch(newSchools);
            alert(`Successfully uploaded ${newSchools.length} schools.`);
        } else {
            alert("No valid schools found in CSV.");
        }
      } catch (e) {
        alert("Error processing CSV.");
        console.error(e);
      } finally {
        setIsAddingSchool(false);
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSchool = async (id: string) => {
    if (confirm("Are you sure you want to remove this school?")) {
      try {
        await deleteSchool(id);
      } catch (e) {
        alert("Failed to delete school.");
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-light dark:bg-brand-dark">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-light dark:bg-brand-dark font-sans text-slate-900 dark:text-white overflow-hidden">
      
      {/* Dev Sidebar */}
      <nav className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
             <Code size={20} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Developer</h1>
            <p className="text-xs text-slate-500">Console</p>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 mt-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={20} /> Dev Profile
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'schools' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Building size={20} /> Manage Schools
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'students' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Users size={20} /> Student Data
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">
                {activeTab === 'profile' ? 'Developer Profile' : 
                 activeTab === 'schools' ? 'School Management' : 'Student Data Explorer'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-500">System Level Controls</p>
                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
            </div>
          </div>
        </header>

        {activeTab === 'profile' && devProfile && (
            <div className="max-w-3xl space-y-6">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {devProfile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{devProfile.name}</h3>
                            <p className="text-slate-500">{devProfile.role}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">UID</p>
                            <p className="font-mono text-sm">{devProfile.uid}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Access Level</p>
                            <p className="font-bold text-emerald-500">{devProfile.accessLevel}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Specialization</p>
                            <p>{devProfile.specialization}</p>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {activeTab === 'schools' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* School List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                             <h3 className="text-xl font-bold">Registered Schools</h3>
                             <span className="bg-slate-100 dark:bg-white/10 text-xs font-bold px-2 py-1 rounded-full">{schools.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Region</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Domain</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {schools.map(school => (
                                        <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-sm">{school.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{school.region}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500">{school.domain || '-'}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDeleteSchool(school.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {schools.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No schools added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Add School Form */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Add Single School</h3>
                        <form onSubmit={handleAddSchool} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">School Name</label>
                                <input 
                                    type="text" 
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    placeholder="e.g. Lincoln High"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Region (City, State)</label>
                                <input 
                                    type="text" 
                                    value={schoolRegion}
                                    onChange={(e) => setSchoolRegion(e.target.value)}
                                    placeholder="e.g. Springfield, IL"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email Domain (Optional)</label>
                                <input 
                                    type="text" 
                                    value={schoolDomain}
                                    onChange={(e) => setSchoolDomain(e.target.value)}
                                    placeholder="e.g. lincoln.edu"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isAddingSchool || !schoolName || !schoolRegion}
                                className="w-full py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-brand-burgundy disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isAddingSchool ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                                Add School
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Bulk Upload (CSV)</h3>
                        <p className="text-xs text-slate-500 mb-4">Format: Name, Region, Domain (Optional)</p>
                        <button 
                            onClick={() => csvInputRef.current?.click()}
                            disabled={isAddingSchool}
                            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-brand-red dark:hover:border-brand-red text-slate-500 hover:text-brand-red transition-all flex items-center justify-center gap-2"
                        >
                            <Upload size={18} />
                            Select CSV File
                        </button>
                        <input 
                            type="file" 
                            ref={csvInputRef}
                            onChange={handleBulkUpload}
                            className="hidden"
                            accept=".csv"
                        />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                     <div className="flex items-center gap-4">
                        <Building size={24} className="text-slate-400" />
                        <select 
                            className="bg-slate-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 outline-none min-w-[300px]"
                            onChange={(e) => {
                                const school = schools.find(s => s.name === e.target.value);
                                setSelectedSchoolForStudents(school || null);
                            }}
                        >
                            <option value="">Select a School to View Students</option>
                            {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                     </div>
                </div>

                {selectedSchoolForStudents && (
                    <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Students at {selectedSchoolForStudents.name}</h3>
                            <span className="bg-slate-100 dark:bg-white/10 text-xs font-bold px-2 py-1 rounded-full">{students.length} Students</span>
                        </div>
                        {isLoadingStudents ? (
                            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-brand-red" size={32} /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Grade/Class</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {students.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-sm flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold">
                                                        {student.name?.charAt(0)}
                                                    </div>
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{student.email}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{student.class || '-'} {student.section}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {student.status || 'Offline'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {students.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No students found for this school.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default DeveloperDashboard;