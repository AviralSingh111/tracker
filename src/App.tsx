import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { DashboardSkeleton } from './components/Skeleton'

function AppContent() {
  const { user, loading } = useAuth()

  // The shell of the signed-in view, so a cold start reads as the app
  // arriving rather than as a blank screen with a word on it.
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas px-4 pt-5 pb-32">
        <div className="max-w-md mx-auto">
          <div className="h-7 mb-4 flex items-center">
            <div className="skeleton h-4 w-20" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
