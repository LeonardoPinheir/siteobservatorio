import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  BookOpen,
  Lock,
  User,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { auth, subscribeToAuth, logoutUser } from '../lib/store';
import { User as FirebaseUser } from 'firebase/auth';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | 'visitor'>('visitor');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser, currentRole) => {
      setUser(currentUser);
      setRole(currentRole);
    });
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'Publicações', href: '/publicacoes' },
    { name: 'Chamadas', href: isHome ? '#chamadas' : '/#chamadas' },
    { name: 'Submissões', href: '/submissoes' },
    { name: 'Equipe Editorial', href: isHome ? '#equipe' : '/#equipe' },
    { name: 'Contato', href: isHome ? '#contato' : '/#contato' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    } else if (href.includes('#')) {
      if (isHome) {
        e.preventDefault();
        const hash = href.split('#')[1];
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setIsOpen(false);
        }
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo_observatorio.png"
              alt="Observatório Edições"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-102"
              onError={(e) => {
                // Fallback visual if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                Observatório Edições
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium transition-colors hover:text-blue-700 ${
                  location.pathname === link.href ? 'text-blue-700 font-semibold' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-800 transition-colors"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Foto" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {role === 'admin' ? 'Admin' : 'Editor'}
                  </span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-500">Conectado como</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-blue-600" />
                      Painel Administrativo
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Encerrar Sessão
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                <Lock size={13} />
                Área Restrita
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Abrir menu de navegação"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm"
                >
                  <LayoutDashboard size={18} />
                  Acessar Painel ({role === 'admin' ? 'Admin' : 'Editor'})
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-rose-600 font-medium text-sm"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm"
              >
                <Lock size={16} />
                Entrar na Área Restrita
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
