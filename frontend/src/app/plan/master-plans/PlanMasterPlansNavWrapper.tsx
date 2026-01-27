"use client";

import dynamic from "next/dynamic";
import Message from "../../components/common/Message";
import { useAuth } from "@/app/context/AuthContext";

const PlanMasterPlansNavClient = dynamic(() => import("./PlanMasterPlansNavClient"), {
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

const PlanMasterPlansNavWrapper = () => {
  const { isAuthReady, isConnected } = useAuth();

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

  return <PlanMasterPlansNavClient isConnected={isConnected} />;
};

export default PlanMasterPlansNavWrapper;