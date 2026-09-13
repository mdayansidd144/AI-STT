import React, { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onSignup?: () => void;
}

const Login: React.FC<LoginProps> = ({
  onSuccess,
  onSignup,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(
        identifier.trim(),
        password
      );

      if (success) {
        onSuccess?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 px-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            Welcome Back
          </h2>

          <p className="text-gray-400 mt-2">
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Email / Username */}
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email or Username
            </label>

            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(event) =>
                setIdentifier(event.target.value)
              }
              required
              autoComplete="username"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter email or username"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              isLoading ||
              !identifier.trim() ||
              !password
            }
            className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}

            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Signup */}
        {onSignup && (
          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSignup}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;