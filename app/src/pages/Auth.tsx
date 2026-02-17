import { Routes, Route, Navigate } from "react-router-dom";

import SignUp from "@components/Auth/SignUp";
import Login from "@components/Auth/Login";
import ForgotPassword from "@components/Auth/ForgotPassword";
import ResetPassword from "@components/Auth/ResetPassword";

const AuthPages = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AuthPages;
