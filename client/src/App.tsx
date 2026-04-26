import { Route, Switch } from 'wouter';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import ProfileSetup from './pages/ProfileSetup';
import DraftView from './pages/DraftView';
import DeepSearch from './pages/DeepSearch';
import { Toaster } from './components/ui/Toaster';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/search" component={Search} />
        <Route path="/profile" component={ProfileSetup} />
        <Route path="/drafts/:id" component={DraftView} />
        <Route path="/deep-search" component={DeepSearch} />
      </Switch>
      <Toaster />
    </div>
  );
}
