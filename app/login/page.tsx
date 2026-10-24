import Image from 'next/image';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={150}
            height={70}
            className="h-14 w-auto mb-10"
            priority
          />
          <p className="mono-tag text-[10px] text-primary mb-3">Customer Academy</p>
          <h1 className="editorial-text text-4xl mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to access the tutorials, guides and certification for your Pegasus tools.
            Content is exclusive to verified purchasers.
          </p>
          <LoginForm />
        </div>
      </div>

      {/* Right — brand visual */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/pegasus_luxury_salon.jpg"
          alt="Pegasus salon"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="mono-tag text-[10px] text-white/70 mb-4">Since 1961</p>
          <p className="editorial-text text-3xl leading-snug">
            “Every Pegasus tool ships with a lifetime of technique. This is where you collect it.”
          </p>
        </div>
      </div>
    </div>
  );
}
