import { RegisterForm } from "@/components/auth/RegisterForm";
import { authStyles } from "@/components/auth/authStyles";

// Full-page registration (direct visit / refresh). Soft navigations from within
// the app are intercepted and shown as a modal — see app/@modal.
export default function RegisterPage() {
  return (
    <div style={authStyles.container}>
      <RegisterForm />
    </div>
  );
}
