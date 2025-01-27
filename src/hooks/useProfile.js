"use client";
import { useState, useEffect } from "react";
import { getCookie } from "@/lib/getCookie";
import getProfile from "@/app/(backend)/actions/auth/getProfile";

export default function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = getCookie("token");
        if (!token) {
          setError("No token found");
          return;
        }

        const { data } = await getProfile({ token });
        setProfile(data);
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: async () => {
      setLoading(true);
      try {
        const token = getCookie("token");
        if (!token) {
          setError("No token found");
          return;
        }

        const { data } = await getProfile({ token });
        setProfile(data);
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }
  };
}
