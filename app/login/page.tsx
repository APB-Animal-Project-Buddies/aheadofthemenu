import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { authStyles } from "@/components/auth/authStyles";

// Full-page sign in (direct visit / refresh). Soft navigations from within the
// app are intercepted and shown as a modal — see app/@modal.
// Suspense: LoginForm reads useSearchParams (?next= redirect), which requires
// a boundary for static prerendering.
export default function LoginPage() {
  return (
    <div style={authStyles.container}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
