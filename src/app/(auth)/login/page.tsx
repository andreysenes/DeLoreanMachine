import { MagicLinkForm } from '@/components/auth/magic-link-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <MagicLinkForm />
    </div>
  );
}
