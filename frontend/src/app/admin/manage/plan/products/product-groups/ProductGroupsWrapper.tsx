"use client";

import dynamic from "next/dynamic";
import Message from "../../../../../components/common/Message";
import { useAuth } from "@/app/context/AuthContext";

const ProductGroupsClient = dynamic(() => import("./ProductGroupsClient"), {
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

const ProductGroupsWrapper = () => {
  const { isAuthReady, isAdmin, isConnected } = useAuth();

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

  if (!isAdmin) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="deny" content="deny" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="deny" content="deny" fullscreen withinContainer />
        </div>
      </>
    );
  }

  return <ProductGroupsClient isConnected={isConnected} />;
};

export default ProductGroupsWrapper;