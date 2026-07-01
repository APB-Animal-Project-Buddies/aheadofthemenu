import { AuthModal } from "@/components/auth/AuthModal";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Intercepts a soft navigation to /register → renders as a modal.
export default function RegisterModal() {
  return (
    <AuthModal>
      <RegisterForm />
    </AuthModal>
  );
}
