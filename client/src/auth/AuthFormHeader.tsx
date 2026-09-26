import { Logo } from '../components/Logo';

export function AuthFormHeader({ title }: { title: string }) {
  return (
    <header className="auth-form-header">
      <Logo size={72} className="auth-form-logo" />
      <h1 className="auth-form-title">{title}</h1>
    </header>
  );
}
