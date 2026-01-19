"use client";

import dynamic from "next/dynamic";
import Message from "../../components/common/Message";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

const OperationalPlanClient = dynamic(() => import("./OperationalPlanClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        <Message icon="loading" content="loading" fullscreen />
      </div>

      <div className="block md:hidden">
        <Message icon="loading" content="loading" fullscreen withinContainer />
      </div>
    </>
  ),
});

const OperationalPlanWrapper = () => {
  const { isAuthReady, isConnected, isLoggedIn, isPlanner } =
  useAuth();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [isInvalidDate, setIsInvalidDate] = useState(false);

  useEffect(() => {
    if (!dateParam) return;

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (!dateRegex.test(dateParam)) {
      setIsInvalidDate(true);
      return;
    }

    const [year, month, day] = dateParam.split("-").map(Number);
    const date = new Date(dateParam);
    const isValid =
      !isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day &&
      year >= 1900 &&
      year <= 2999;

    if (!isValid) setIsInvalidDate(true);
  }, [dateParam]);

  if (isInvalidDate) {
    return <Message content="invalid" fullscreen />;
  }

  if (!isAuthReady) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="loading" content="loading" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message
            icon="loading"
            content="loading"
            fullscreen
            withinContainer
          />
        </div>
      </>
    );
  }

  return (
    <OperationalPlanClient
      isConnected={isConnected}
      isAuthReady={isAuthReady}
      isLoggedIn={isLoggedIn}
      isPlanner={isPlanner}
    />
  );
};

export default OperationalPlanWrapper;
