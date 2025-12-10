"use client";

import { useEffect, useState } from "react";

export function useUserPlan() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setPlan(data));
  }, []);

  return plan;
}
