import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { PageLoader } from '@/shared/components/page-loader'

export default function AuthCallbackPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    navigate(user ? '/onboarding' : '/login', { replace: true })
  }, [isLoading, navigate, user])

  return <PageLoader />
}
