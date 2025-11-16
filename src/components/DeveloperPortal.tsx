import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Store,
  BarChart3,
  Settings,
  Wallet,
  ArrowLeft,
} from 'lucide-react';
import { gameProjectService } from '../services/GameProjectService';
import { GameProject } from '../types/PlatformTypes';
import { useProfile } from '../hooks/useProfile';
import { useGrindWallet } from '../hooks/useGrindWallet';

interface DeveloperPortalProps {
  currentProjectId: string | null;
  onNavigateToStore: () => void;
  onNavigateToPlay: (gameId: string) => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  currentProjectId,
  onNavigateToStore,
  onNavigateToPlay,
}) => {
  const { profile, developerProfile } = useProfile();
  const { wallet, formatAmount } = useGrindWallet();
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');

  useEffect(() => {
    if (profile?.id) {
      loadProjects();
    }
  }, [profile]);

  const loadProjects = async () => {
    if (!profile?.id) return;

    setLoading(true);
    const data = await gameProjectService.getDeveloperProjects(profile.id);
    setProjects(data);
    setLoading(false);
  };

  const handleCreateProject = async () => {
    if (!profile?.id || !newGameTitle.trim()) return;

    const project = await gameProjectService.createGameProject(
      profile.id,
      newGameTitle,
      newGameDescription
    );

    if (project) {
      setProjects([project, ...projects]);
      setShowCreateModal(false);
      setNewGameTitle('');
      setNewGameDescription('');
    }
  };

  const handlePublishProject = async (projectId: string) => {
    const success = await gameProjectService.publishGameProject(projectId);
    if (success) {
      await loadProjects();
    }
  };

  const renderProjectCard = (project: GameProject) => (
    <div
      key={project.id}
      className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
          <p className="text-sm text-slate-400 mb-2 line-clamp-2">
            {project.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span
              className={`px-2 py-1 rounded ${
                project.status === 'published'
                  ? 'bg-green-900 text-green-300'
                  : project.status === 'testing'
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {project.status}
            </span>
            <span className="text-slate-400">v{project.version}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-900 rounded-lg">
        <div>
          <div className="text-2xl font-bold text-white">{project.total_plays}</div>
          <div className="text-xs text-slate-400">Total Plays</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{project.total_players}</div>
          <div className="text-xs text-slate-400">Players</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {project.average_rating.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">Rating</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onNavigateToPlay(project.id)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Test Play
        </button>
        {project.status === 'draft' && (
          <button
            onClick={() => handlePublishProject(project.id)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Publish
          </button>
        )}
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToStore}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-400" />
              </button>
              <Code2 className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Developer Portal</h1>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-white">
                {developerProfile?.total_games || 0}
              </div>
              <div className="text-sm text-slate-400">Total Games</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-white">
                {formatAmount(developerProfile?.total_revenue || 0)}
              </div>
              <div className="text-sm text-slate-400">Total Revenue</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-white">
                {developerProfile?.rating.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-slate-400">Developer Rating</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-white">
                {formatAmount(wallet?.balance || 0)}
              </div>
              <div className="text-sm text-slate-400">Wallet Balance</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Projects</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <Code2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">No projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Your First Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(renderProjectCard)}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Create New Game Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Game Title
                </label>
                <input
                  type="text"
                  value={newGameTitle}
                  onChange={(e) => setNewGameTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="My Awesome Game"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newGameDescription}
                  onChange={(e) => setNewGameDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Describe your game..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newGameTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGameTitle('');
                    setNewGameDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
