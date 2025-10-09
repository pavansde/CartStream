import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/User";

function VerifyEmailPage() {
  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");
  const navigate = useNavigate();

  // Ref to ensure single API call
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setMessage("No verification token provided.");
      return;
    }
    if (hasVerifiedRef.current) {
      // Already called verifyEmail once, skip calling again
      return;
    }
    hasVerifiedRef.current = true; // Mark as called

    verifyEmail(token)
      .then(() => {
        setMessage("Email successfully verified! Redirecting to login...");
        setSuccess(true);
      })
      .catch(() => {
        setMessage("Invalid or expired verification token.");
      });

  }, [token]);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  return (
    <div className={`p-6 text-center font-semibold ${success ? "text-green-600" : "text-red-600"}`}>
      {message}
      {success && (
        <div className="mt-2 text-sm text-gray-700">
          Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
        </div>
      )}
    </div>
  );
}

export default VerifyEmailPage;
