import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?mode=signin");
    }
  }, [loading, user]);

  // Pendant la vérification → rien (ou un spinner)
  if (loading || !user) return null;

  // Utilisateur connecté → on affiche la page
  return <>{children}</>;
}















