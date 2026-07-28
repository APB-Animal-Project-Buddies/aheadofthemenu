import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { LoginForm } from "@/components/auth/LoginForm";

// Intercepts a soft navigation to /login → renders as a modal.
// Suspense: LoginForm reads useSearchParams (?next= redirect).
export default function LoginModal() {
  return (
    <AuthModal>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthModal>
  );
}
