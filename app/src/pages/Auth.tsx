import { Routes, Route, Navigate } from "react-router-dom";

import SignUp from "@components/Auth/SignUp";
import Login from "@components/Auth/Login";

const AuthPages = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AuthPages;
