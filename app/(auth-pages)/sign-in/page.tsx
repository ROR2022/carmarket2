import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LegalAdvice  from "../legalAdvice";
import { SocialAuthButtons } from "../social-auth-buttons";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Iniciar Sesion</h1>
      <p className="text-sm text-foreground">
        Todavia no tienes una cuenta?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Registrate
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Olvidaste tu password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Tu password"
          required
        />
        <LegalAdvice />
        <SubmitButton pendingText="Signing In..." formAction={signInAction}>
          Iniciar Sesion
        </SubmitButton>
        <div className="flex items-center justify-center my-3">
          <div className="w-full h-[1px] bg-border"></div>
        </div>
        <SocialAuthButtons />
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
