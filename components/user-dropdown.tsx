"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React from "react";
import { format } from "date-fns";
import { Avatar, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { SignedIn, SignOutButton, useUser } from "@clerk/clerk-react";

import { CalendarIcon, LogOutIcon, MailIcon, UserIcon } from "lucide-react";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface UserDropdownProps {
  size?: "sm" | "md" | "lg";
}

const UserDropDown: React.FC<UserDropdownProps> = ({ size = "md" }) => {
  const { user: clerkUser } = useUser();
  const clerkId = clerkUser?.id;
  const convexUser = useQuery(
    api.users.getUserById,
    clerkId ? { clerkId } : "skip",
  );

  const userName = convexUser?.name;
  const userImage = convexUser?.imageUrl;
  const userCreatedAt = convexUser?._creationTime;
  const userEmail = convexUser?.email;

  const userJoined = userCreatedAt ? new Date(userCreatedAt) : null;

  const avatarSizeClasses = React.useMemo(() => {
    switch (size) {
      case "sm":
        return "w-8 h-8";
      case "md":
        return "w-10 h-10";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-10 h-10";
    }
  }, [size]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className={`cursor-pointer ${avatarSizeClasses}`}>
          {userImage === undefined ? (
            <Skeleton className={cn("rounded-full", avatarSizeClasses)} />
          ) : (
            <AvatarImage
              src={userImage}
              alt="User Image"
              className={avatarSizeClasses}
            />
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem className="p-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <h1 className="text-lg font-semibold">
                {userName || "Guest User"}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MailIcon className="h-4 w-4" />
              <span>{userEmail || "No Email"}</span>
            </div>
            {userJoined && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CalendarIcon className="h-3 w-3" />
                <span>Joined: {format(userJoined, "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <SignedIn>
          <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
            <div className="flex items-center gap-2">
              <LogOutIcon className="h-4 w-4 text-gray-500" />
              <SignOutButton>
                <span>Sign Out</span>
              </SignOutButton>
            </div>
          </DropdownMenuItem>
        </SignedIn>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropDown;
