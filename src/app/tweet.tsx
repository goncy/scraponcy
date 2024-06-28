"use client";

import {useState, useEffect} from "react";

export default function Tweet({children}: {children: React.ReactNode}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  function handleClick() {
    navigator.clipboard.writeText(children as string).then(() => setIsCopied(true));
  }

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => setIsCopied(false), 500);
    }
  }, [isCopied]);

  return (
    <div
      className={`cursor-pointer whitespace-pre rounded-md border p-4 transition-colors ${isCopied ? "bg-blue-100/40" : "bg-transparent"}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
