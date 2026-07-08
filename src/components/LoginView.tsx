import { useState } from 'react';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function LoginView({ onLogin, onBack }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email === 'admin' && password === '@Orla44') {
      onLogin();
      setLoading(false);
      return;
    }

    setError('Credenciais inválidas.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-sand-200 w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors -ml-1">
            <LogIn className="w-5 h-5 text-gray-500 rotate-180" />
          </button>
          <div className="p-2 bg-primary-100 rounded-full">
            <Shield className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Acesso ADM</h1>
            <p className="text-xs text-gray-500">Painel administrativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Usuário</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
