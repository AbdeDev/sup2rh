import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AdminIndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/jobs", { replace: true });
  }, [navigate]);

  return null;
}
