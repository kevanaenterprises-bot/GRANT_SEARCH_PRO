import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import ProfileSetup from './pages/ProfileSetup';
import DraftView from './pages/DraftView';
import DeepSearch from './pages/DeepSearch';
import Login from './pages/Login';
import Account from './pages/Account';
import { Toaster } from './components/ui/Toaster';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={ProfileSetup} />} />
        <Route path="/drafts/:id" component={() => <ProtectedRoute component={DraftView} />} />
        <Route path="/deep-search" component={() => <ProtectedRoute component={DeepSearch} />} />
        <Route path="/account" component={() => <ProtectedRoute component={Account} />} />
      </Switch>
      <Toaster />
    </div>
  );
}
