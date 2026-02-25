import React from "react";

const loading = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center bg-background">
      <div className="w-1/4 max-w-[100px] aspect-square border-4 border-t-4 border-muted border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default loading;
