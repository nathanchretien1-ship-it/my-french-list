"use client";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkEmailMsg, setCheckEmailMsg] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // --- 1. CONNEXION GOOGLE ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirige vers ton callback pour gérer la session proprement
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la connexion Google");
      setLoading(false);
    }
  };

  // --- 2. VALIDATION DU MOT DE PASSE ---
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
    if (!/[A-Z]/.test(pwd)) return "Il faut au moins une majuscule.";
    if (!/[a-z]/.test(pwd)) return "Il faut au moins une minuscule.";
    if (!/[0-9]/.test(pwd)) return "Il faut au moins un chiffre.";
    return null;
  };

  // --- 3. VÉRIFICATION PSEUDO ---
  useEffect(() => {
    if (isLogin || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase.rpc("check_username_available", { 
        username_input: username 
      });
      setUsernameAvailable(data);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, isLogin, supabase]);

  // --- 4. GESTION EMAIL/PASSWORD ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
        window.location.href = "/"; 
      } else {
        const passwordError = validatePassword(password);
        if (passwordError) throw new Error(passwordError);

        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas.");
        }

        if (username.length < 3) throw new Error("Le pseudo est trop court.");
        if (usernameAvailable === false) throw new Error("Ce pseudo est déjà pris.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
        setCheckEmailMsg(true);
        toast.success("Compte créé ! Vérifie tes emails.");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  if (checkEmailMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f111a] px-4">
        <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-2xl border border-white/10 text-center">
          <div className="text-5xl mb-4">📩</div>
          <h2 className="text-2xl font-bold text-white mb-2">Vérifie ta boîte mail</h2>
          <p className="text-gray-400 mb-6">Un lien a été envoyé à <strong>{email}</strong>.</p>
          <button onClick={() => setCheckEmailMsg(false)} className="text-purple-400 hover:underline">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f111a] px-4 pt-20">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
        
        <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          {isLogin ? "Connexion" : "Créer un compte"}
        </h2>

        {/* BOUTON GOOGLE */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition mb-6 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continuer avec Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-gray-500">OU</span></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Pseudo</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`w-full bg-slate-800 border rounded-lg p-3 text-white focus:outline-none transition ${
                    usernameAvailable === false ? "border-red-500" : usernameAvailable === true ? "border-green-500" : "border-slate-700 focus:ring-purple-500"
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirmer mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full bg-slate-800 border rounded-lg p-3 text-white outline-none transition ${confirmPassword && password !== confirmPassword ? "border-red-500" : "border-slate-700 focus:ring-purple-500"}`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? "Chargement..." : (isLogin ? "Se connecter" : "S'inscrire")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-purple-400 hover:text-purple-300 font-bold underline"
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}