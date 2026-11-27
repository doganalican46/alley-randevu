import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { env } from '@/core/config/env'
import { AppError } from '@/core/errors/app-error'
import { useAuth } from '@/features/auth/auth-context'

interface AuthValues {
  fullName?: string | undefined
  email: string
  password: string
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { t } = useTranslation()
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const authSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().max(100).optional(),
        email: z.email(t('auth.invalidEmail')),
        password: z.string().min(8, t('auth.shortPassword'))
      }),
    [t]
  )
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '' }
  })

  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/onboarding'

  useEffect(() => {
    if (session) navigate(redirectPath, { replace: true })
  }, [navigate, redirectPath, session])

  const onSubmit = async (values: AuthValues) => {
    setFeedback(null)
    try {
      const result = isRegister
        ? await signUp({
            email: values.email,
            password: values.password,
            fullName: values.fullName
          })
        : await signIn({ email: values.email, password: values.password })

      if (result.session) {
        navigate(redirectPath, { replace: true })
      } else if (result.requiresEmailConfirmation) {
        setFeedback(t('auth.registered'))
      }
    } catch (error) {
      setFeedback(error instanceof AppError ? error.message : t('auth.genericError'))
    }
  }

  return (
    <section className="px-5 py-12 sm:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-[.85fr_1.15fr] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="size-4" /> {t('auth.home')}
          </Link>
          <div>
            <span className="grid size-14 place-items-center rounded-2xl bg-indigo-500">
              <CalendarMonogram />
            </span>
            <h2 className="mt-7 text-3xl font-black tracking-tight">{t('auth.panelTitle')}</h2>
            <p className="mt-4 leading-7 text-slate-300">{t('auth.panelDescription')}</p>
          </div>
          <p className="text-sm text-slate-500">Alley Software · Türkiye</p>
        </div>
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="max-w-md">
            <p className="section-kicker">
              {isRegister ? t('auth.registerKicker') : t('auth.loginKicker')}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
            </h1>
            <p className="mt-3 text-slate-500">
              {isRegister ? t('auth.registerDescription') : t('auth.loginDescription')}
            </p>

            {!env.isSupabaseConfigured && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                {t('auth.configurationWarning')}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {isRegister && (
                <FormField
                  icon={UserRound}
                  label={t('auth.fullName')}
                  error={errors.fullName?.message}
                >
                  <input className="form-input" autoComplete="name" {...register('fullName')} />
                </FormField>
              )}
              <FormField icon={Mail} label={t('auth.email')} error={errors.email?.message}>
                <input
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                />
              </FormField>
              <FormField
                icon={LockKeyhole}
                label={t('auth.password')}
                error={errors.password?.message}
                action={
                  <button
                    type="button"
                    className="text-slate-400 hover:text-indigo-600"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={t('auth.togglePassword')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              >
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  {...register('password')}
                />
              </FormField>
              {feedback && (
                <p
                  className="rounded-2xl bg-slate-100 p-4 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  role="status"
                >
                  {feedback}
                </p>
              )}
              <button className="button button-primary button-large w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? t('auth.processing')
                  : isRegister
                    ? t('auth.createAccount')
                    : t('auth.signIn')}
              </button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">
              {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to={isRegister ? '/login' : '/register'}
              >
                {isRegister ? t('auth.signIn') : t('auth.startFree')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FormField({
  icon: Icon,
  label,
  error,
  action,
  children
}: {
  icon: typeof Mail
  label: string
  error?: string | undefined
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <span className="form-input-wrap">
        <Icon className="size-5 shrink-0 text-slate-400" />
        {children}
        {action}
      </span>
      {error && <span className="mt-2 block text-sm font-medium text-red-600">{error}</span>}
    </label>
  )
}

function CalendarMonogram() {
  return <span className="text-2xl font-black">A</span>
}
