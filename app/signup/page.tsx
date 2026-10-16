import Image from 'next/image';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Image
            src="/images/pegasus-logo.png"
            alt="Pegasus"
            width={150}
            height={40}
            className="h-9 w-auto mb-10"
            priority
          />
          <p className="mono-tag text-[10px] text-primary mb-3">Customer Academy</p>
          <h1 className="editorial-text text-4xl mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Create an account, then register your Pegasus tool with its product key to unlock the tutorials, guides and certification.
          </p>
          <SignupForm />
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
