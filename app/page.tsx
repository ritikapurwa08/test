import UserDropDown from "@/components/user-dropdown";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import React from "react";

const page = () => {
  return (
    <div>
      this is you and this is made by ritik apurwa
      <SignedIn>
        <UserDropDown />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </div>
  );
};

export default page;
