first of bun create convex@latest ./
set up clerk keys

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHVtcGVkLWNhaW1hbi01My5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_QX5FOe4XyHX9Eva8p3KmUSGjD0xwOgYV8lnHRazSCN these one

then setup clerk templete convex one in clerk dashboard

first add a users table and in this add this

export const createUser = internalMutation({
args: {
clerkId: v.string(),
email: v.string(),
imageUrl: v.string(),
name: v.string(),
},
handler: async (ctx, args) => {
await ctx.db.insert("users", {
clerkId: args.clerkId,
email: args.email,
imageUrl: args.imageUrl,
name: args.name,
});
},
});

export const updateUser = internalMutation({
args: {
clerkId: v.string(),
imageUrl: v.string(),
email: v.string(),
},
async handler(ctx, args) {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      imageUrl: args.imageUrl,
      email: args.email,
    });

},
});

export const deleteUser = internalMutation({
args: { clerkId: v.string() },
async handler(ctx, args) {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.delete(user._id);

},
});

export const getUserById = query({
args: { clerkId: v.string() },
handler: async (ctx, args) => {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return user;

},
});

then add this http.ts
first install svix bun add svix

// ===== reference links =====
// https://www.convex.dev/templates (open the link and choose for clerk than you will get the github link mentioned below)
// https://github.dev/webdevcody/thumbnail-critique/blob/6637671d72513cfe13d00cb7a2990b23801eb327/convex/schema.ts

import type { WebhookEvent } from "@clerk/nextjs/server";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";

```
import { internal } from "./\_generated/api";
import { httpAction } from "./\_generated/server";

const handleClerkWebhook = httpAction(async (ctx, request) => {
const event = await validateRequest(request);
if (!event) {
return new Response("Invalid request", { status: 400 });
}
switch (event.type) {
case "user.created":
await ctx.runMutation(internal.users.createUser, {
clerkId: event.data.id,
email: event.data.email_addresses[0].email_address,
imageUrl: event.data.image_url,
name: event.data.first_name!,
});
break;
case "user.updated":
await ctx.runMutation(internal.users.updateUser, {
clerkId: event.data.id,
imageUrl: event.data.image_url,
email: event.data.email_addresses[0].email_address,
});
break;
case "user.deleted":
await ctx.runMutation(internal.users.deleteUser, {
clerkId: event.data.id as string,
});
break;
}
return new Response(null, {
status: 200,
});
});

const http = httpRouter();

http.route({
path: "/clerk",
method: "POST",
handler: handleClerkWebhook,
});

const validateRequest = async (
req: Request,
): Promise<WebhookEvent | undefined> => {
//TODO: add clerk webhook secret bro
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
if (!webhookSecret) {
throw new Error("CLERK_WEBHOOK_SECRET is not defined");
}
const payloadString = await req.text();
const headerPayload = req.headers;
const svixHeaders = {
"svix-id": headerPayload.get("svix-id")!,
"svix-timestamp": headerPayload.get("svix-timestamp")!,
"svix-signature": headerPayload.get("svix-signature")!,
};
const wh = new Webhook(webhookSecret);
const event = wh.verify(payloadString, svixHeaders);
return event as unknown as WebhookEvent;
};

export default http;
```

for this you have to get webhook secrect from clerk dashboard paster it with right name in env and clerk deployment and convex env dashboard

---

## title: Integrating Clerk Authentication with Convex using Webhooks

# Integrating Clerk Authentication with Convex using Webhooks

This guide will walk you through setting up Clerk authentication with your Convex backend using webhooks. This approach ensures that your Convex `users` table stays synchronized with user events (creation, update, deletion) in your Clerk application.

## Prerequisites

- **Bun:** Ensure you have Bun installed on your system. You can find installation instructions on the [Bun website](https://bun.sh/).
- **Clerk Account:** You need a Clerk account. If you don't have one, you can sign up at [Clerk.dev](https://clerk.dev/).
- **Convex Project:** You'll need a Convex project.

## Setup Instructions

Follow these steps to integrate Clerk with Convex using webhooks:

### 1. Create a New Convex Project

First, create a new Convex project using Bun:

```bash
bun create convex@latest ./
This command will initialize a new Convex project in the current directory.

2. Set Up Clerk API Keys
You'll need your Clerk Publishable Key and Secret Key. You provided the following test keys:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHVtcGVkLWNhaW1hbi01My5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_QX5FOe4XyHX9Eva8p3KmUSGjD0xwOgYV8lnHRazSCN
Important:

These are test keys. For production environments, make sure to use your production Clerk API keys.
Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as an environment variable accessible by your frontend (usually in your .env.local or similar file).
Set CLERK_SECRET_KEY as an environment variable accessible by your Convex backend (you can configure this in your Convex dashboard).
3. Set Up Convex Clerk Template in Clerk Dashboard
Go to your Clerk dashboard for your application.
Navigate to Webhooks in the sidebar.
Click on Add Webhook Endpoint.
Endpoint URL: You will need to get the HTTP Action URL for your Convex webhook handler after you deploy it. This will typically be in the format https://your-convex-deployment-url/api/clerk. We will configure this in the next steps.
Webhook Secret: Clerk will generate a webhook secret for this endpoint. Copy this secret. You will need to set this as the CLERK_WEBHOOK_SECRET environment variable in your Convex environment.
Select Events: Choose the following events to subscribe to:
user.created
user.updated
user.deleted
Click Create Webhook.
4. Add the users Table to Your Convex Schema (convex/schema.ts)
If you haven't already, add the users table definition to your convex/schema.ts file:

TypeScript
```

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
podcasts: defineTable({
user: v.id('users'),
podcastTitle: v.string(),
podcastDescription: v.string(),
audioUrl: v.optional(v.string()),
audioStorageId: v.optional(v.id('\_storage')),
imageUrl: v.optional(v.string()),
imageStorageId: v.optional(v.id('\_storage')),
author: v.string(),
authorId: v.string(),
authorImageUrl: v.string(),
voicePrompt: v.string(),
imagePrompt: v.string(),
voiceType: v.string(),
audioDuration: v.number(),
views: v.number(),
})
.searchIndex('search_author', { searchField: 'author' })
.searchIndex('search_title', { searchField: 'podcastTitle' })
.searchIndex('search_body', { searchField: 'podcastDescription' }),
users: defineTable({
email: v.string(),
imageUrl: v.string(),
clerkId: v.string(),
name: v.string(),
}),
});

```
5. Add User Management Mutations and Queries (convex/users.ts)
Create a file named users.ts inside your convex directory and add the following code:

TypeScript
```

import { internalMutation, query } from "./\_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/server";

export const createUser = internalMutation({
args: {
clerkId: v.string(),
email: v.string(),
imageUrl: v.string(),
name: v.string(),
},
handler: async (ctx, args) => {
await ctx.db.insert("users", {
clerkId: args.clerkId,
email: args.email,
imageUrl: args.imageUrl,
name: args.name,
});
},
});

export const updateUser = internalMutation({
args: {
clerkId: v.string(),
imageUrl: v.string(),
email: v.string(),
},
async handler(ctx, args) {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      imageUrl: args.imageUrl,
      email: args.email,
    });

},
});

export const deleteUser = internalMutation({
args: { clerkId: v.string() },
async handler(ctx, args) {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.delete(user._id);

},
});

export const getUserById = query({
args: { clerkId: v.string() },
handler: async (ctx, args) => {
const user = await ctx.db
.query("users")
.filter((q) => q.eq(q.field("clerkId"), args.clerkId))
.unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return user;

},
});

```
6. Add the HTTP Action for Clerk Webhooks (convex/http.ts)
Create a file named http.ts inside your convex directory and add the following code. Make sure to install the svix library:

Bash

bun add svix
Then, add the code to convex/http.ts:
```

TypeScript

// convex/http.ts
import type { WebhookEvent } from "@clerk/nextjs/server";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";

import { internal } from "./\_generated/api";
import { httpAction } from "./\_generated/server";

const handleClerkWebhook = httpAction(async (ctx, request) => {
const event = await validateRequest(request);
if (!event) {
return new Response("Invalid request", { status: 400 });
}
switch (event.type) {
case "user.created":
await ctx.runMutation(internal.users.createUser, {
clerkId: event.data.id,
email: event.data.email_addresses[0].email_address,
imageUrl: event.data.image_url,
name: event.data.first_name!,
});
break;
case "user.updated":
await ctx.runMutation(internal.users.updateUser, {
clerkId: event.data.id,
imageUrl: event.data.image_url,
email: event.data.email_addresses[0].email_address,
});
break;
case "user.deleted":
await ctx.runMutation(internal.users.deleteUser, {
clerkId: event.data.id as string,
});
break;
}
return new Response(null, {
status: 200,
});
});

const http = httpRouter();

http.route({
path: "/clerk",
method: "POST",
handler: handleClerkWebhook,
});

const validateRequest = async (
req: Request,
): Promise<WebhookEvent | undefined> => {
//TODO: add clerk webhook secret bro
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;
if (!webhookSecret) {
throw new Error("CLERK_WEBHOOK_SECRET is not defined");
}
const payloadString = await req.text();
const headerPayload = req.headers;
const svixHeaders = {
"svix-id": headerPayload.get("svix-id")!,
"svix-timestamp": headerPayload.get("svix-timestamp")!,
"svix-signature": headerPayload.get("svix-signature")!,
};
const wh = new Webhook(webhookSecret);
const event = wh.verify(payloadString, svixHeaders);
return event as unknown as WebhookEvent;
};

export default http;```
Important:

Set CLERK_WEBHOOK_SECRET Environment Variable: Make sure you set the CLERK_WEBHOOK_SECRET environment variable in your Convex project's settings (you can do this in the Convex dashboard). This should be the webhook secret you copied from your Clerk dashboard in step 3.
Get Convex HTTP Action URL: After deploying your Convex project, go to your Convex dashboard and find the URL for your HTTP endpoint. It will be something like https://your-convex-deployment-id.convex.cloud/api/clerk.
Update Clerk Webhook Endpoint: Go back to your Clerk webhook settings and update the Endpoint URL with the Convex HTTP Action URL you just obtained.
