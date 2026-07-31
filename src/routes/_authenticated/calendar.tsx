import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/calendar")({
  beforeLoad: () => {
    throw redirect({ to: "/my-jobs" });
  },
  component: () => null,
  head: () => ({ meta: [{ title: "Calendar · DoneMate Provider Portal" }] }),
});